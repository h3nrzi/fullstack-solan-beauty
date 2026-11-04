import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import {
  PrismaClient,
  SecurityEventType,
  BookingStatus,
  ServicePriceType,
} from '@salon/database';
import { AppModule } from '../src/app.module';
import { SMS_SERVICE, ISmsService } from '../src/auth/customer-auth.service';

const prisma = new PrismaClient();

class TestSmsService implements ISmsService {
  public sentCodes: Map<string, string> = new Map();
  async sendOtp(phone: string, code: string): Promise<void> {
    this.sentCodes.set(phone, code);
  }
}

describe('HTTP API Seam - Seam 3: Customer Auth, Profile & IDOR Boundary', () => {
  let app: INestApplication;
  let testSmsService: TestSmsService;

  beforeEach(async () => {
    testSmsService = new TestSmsService();

    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(SMS_SERVICE)
      .useValue(testSmsService)
      .compile();

    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    await prisma.serviceBookingResourceAllocation.deleteMany();
    await prisma.serviceBooking.deleteMany();
    await prisma.servicePhase.deleteMany();
    await prisma.service.deleteMany();
    await prisma.customerSession.deleteMany();
    await prisma.customerOtp.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.workingShift.deleteMany();
    await prisma.artistLeave.deleteMany();
    await prisma.artistServiceTariff.deleteMany();
    await prisma.commissionContract.deleteMany();
    await prisma.artistProfile.deleteMany();
    await prisma.recoveryCode.deleteMany();
    await prisma.session.deleteMany();
    await prisma.independentRecoveryRequest.deleteMany();
    await prisma.staff.deleteMany();
  });

  afterAll(async () => {
    await app?.close();
    await prisma.$disconnect();
  });

  it('completes the customer auth lifecycle via HTTP endpoints with cookies and session validation', async () => {
    const phone = '09121112233';

    // 1. Request OTP
    const reqRes = await request(app.getHttpServer())
      .post('/api/customer/auth/otp/request')
      .send({ phone })
      .expect(201);

    expect(reqRes.body.success).toBe(true);
    expect(reqRes.body.expiresInSeconds).toBe(120);

    const generatedCode = testSmsService.sentCodes.get(phone);
    expect(generatedCode).toBeDefined();

    // 2. Reject invalid OTP code
    await request(app.getHttpServer())
      .post('/api/customer/auth/otp/verify')
      .send({ phone, code: '999999' })
      .expect(401);

    // 3. Verify with valid OTP code
    const verifyRes = await request(app.getHttpServer())
      .post('/api/customer/auth/otp/verify')
      .send({ phone, code: generatedCode })
      .expect(200);

    expect(verifyRes.body.success).toBe(true);
    expect(verifyRes.body.customer.phone).toBe(phone);

    // Cookie must be set
    const cookies = verifyRes.headers['set-cookie'];
    expect(cookies).toBeDefined();
    const sessionCookie = (cookies as unknown as string[]).find((c) =>
      c.startsWith('salon_customer_session='),
    );
    expect(sessionCookie).toBeDefined();

    // 4. Access /api/customer/me without cookie -> 401
    await request(app.getHttpServer())
      .get('/api/customer/me')
      .expect(401);

    // 5. Access /api/customer/me with cookie -> 200
    const meRes = await request(app.getHttpServer())
      .get('/api/customer/me')
      .set('Cookie', sessionCookie!)
      .expect(200);

    expect(meRes.body.customer.id).toBe(verifyRes.body.customer.id);
    expect(meRes.body.customer.phone).toBe(phone);

    // 6. Logout
    await request(app.getHttpServer())
      .post('/api/customer/auth/logout')
      .set('Cookie', sessionCookie!)
      .expect(200);

    // 7. Verify subsequent request fails with 401
    await request(app.getHttpServer())
      .get('/api/customer/me')
      .set('Cookie', sessionCookie!)
      .expect(401);
  });

  it('strictly blocks IDOR: customer cannot access another customer profile by changing ID', async () => {
    // Create Customer 1 and login
    const phone1 = '09121111111';
    await request(app.getHttpServer())
      .post('/api/customer/auth/otp/request')
      .send({ phone: phone1 })
      .expect(201);
    const code1 = testSmsService.sentCodes.get(phone1)!;
    const login1 = await request(app.getHttpServer())
      .post('/api/customer/auth/otp/verify')
      .send({ phone: phone1, code: code1 })
      .expect(200);
    const cookie1 = (login1.headers['set-cookie'] as unknown as string[]).find((c) =>
      c.startsWith('salon_customer_session='),
    )!;
    const cust1Id = login1.body.customer.id;

    // Create Customer 2 directly in DB
    const cust2 = await prisma.customer.create({
      data: {
        phone: '09122222222',
        fullName: 'Sara Tehrani',
        isActive: true,
      },
    });

    // Customer 1 accessing their own profile by ID succeeds
    const ownRes = await request(app.getHttpServer())
      .get(`/api/customer/profile/${cust1Id}`)
      .set('Cookie', cookie1)
      .expect(200);
    expect(ownRes.body.customer.id).toBe(cust1Id);

    // Customer 1 accessing Customer 2's ID (IDOR attack) -> MUST return 403 Forbidden!
    const idorRes = await request(app.getHttpServer())
      .get(`/api/customer/profile/${cust2.id}`)
      .set('Cookie', cookie1)
      .expect(403);

    expect(idorRes.body.message).toMatch(/دسترسی غیرمجاز|Forbidden|IDOR/);

    // Verify security audit log for unauthorized access attempt
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        eventType: SecurityEventType.CUSTOMER_UNAUTHORIZED_ACCESS_ATTEMPT,
        customerId: cust1Id,
      },
    });
    expect(auditLogs.length).toBe(1);
    expect(auditLogs[0].details).toMatchObject({
      attemptedCustomerId: cust2.id,
      actualCustomerId: cust1Id,
    });
  });

  it('isolates customer bookings: customer only retrieves their own bookings', async () => {
    // 1. Setup service & artist
    const service = await prisma.service.create({
      data: {
        name: 'کوپ مو',
        priceType: ServicePriceType.FIXED,
        fixedPrice: 300000,
        durationMinutes: 45,
      },
    });

    const staff = await prisma.staff.create({
      data: {
        username: 'hair_artist',
        fullName: 'مهسا راد',
        role: 'ARTIST',
        passwordHash: 'dummy',
      },
    });

    const artist = await prisma.artistProfile.create({
      data: {
        staffId: staff.id,
      },
    });

    // 2. Setup Customer 1 and login
    const phone1 = '09123333333';
    await request(app.getHttpServer())
      .post('/api/customer/auth/otp/request')
      .send({ phone: phone1 })
      .expect(201);
    const code1 = testSmsService.sentCodes.get(phone1)!;
    const login1 = await request(app.getHttpServer())
      .post('/api/customer/auth/otp/verify')
      .send({ phone: phone1, code: code1 })
      .expect(200);
    const cookie1 = (login1.headers['set-cookie'] as unknown as string[]).find((c) =>
      c.startsWith('salon_customer_session='),
    )!;
    const cust1Id = login1.body.customer.id;

    // Customer 2 in DB
    const cust2 = await prisma.customer.create({
      data: { phone: '09124444444', fullName: 'مشتری دوم' },
    });

    // Create a booking for Customer 1 and Customer 2
    const now = new Date();
    await prisma.serviceBooking.create({
      data: {
        serviceId: service.id,
        artistId: artist.id,
        customerId: cust1Id,
        customerName: 'مشتری اول',
        customerPhone: phone1,
        startTime: new Date(now.getTime() + 3600000),
        endTime: new Date(now.getTime() + 7200000),
        status: BookingStatus.CONFIRMED,
      },
    });

    await prisma.serviceBooking.create({
      data: {
        serviceId: service.id,
        artistId: artist.id,
        customerId: cust2.id,
        customerName: 'مشتری دوم',
        customerPhone: cust2.phone,
        startTime: new Date(now.getTime() + 8000000),
        endTime: new Date(now.getTime() + 11000000),
        status: BookingStatus.CONFIRMED,
      },
    });

    // Customer 1 fetches bookings
    const bookingsRes = await request(app.getHttpServer())
      .get('/api/customer/bookings')
      .set('Cookie', cookie1)
      .expect(200);

    expect(bookingsRes.body.bookings.length).toBe(1);
    expect(bookingsRes.body.bookings[0].customerId).toBe(cust1Id);
    expect(bookingsRes.body.bookings[0].customerName).toBe('مشتری اول');
  });
});
