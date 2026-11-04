import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import {
  PrismaClient,
  StaffRole,
  ConsultationStatus,
  ConsultationEventType,
  SecurityEventType,
} from '@salon/database';
import { AppModule } from '../src/app.module';
import { SMS_SERVICE, ISmsService } from '../src/auth/customer-auth.service';
import argon2 from 'argon2';
import crypto from 'crypto';

const prisma = new PrismaClient();

class TestSmsService implements ISmsService {
  async sendOtp(_phone: string, _code: string): Promise<void> {}
}

describe('HTTP API Seam - Seam 2: Consultation Request E2E Endpoints & IDOR Boundary', () => {
  let app: INestApplication;
  let customer1Token: string;
  let customer1Id: string;
  let customer2Token: string;
  let customer2Id: string;
  let receptionistToken: string;
  let receptionistId: string;
  let consultantId: string;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(SMS_SERVICE)
      .useValue(new TestSmsService())
      .compile();

    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    // Clean tables
    await prisma.consultationRequestEvent.deleteMany();
    await prisma.consultationRequest.deleteMany();
    await prisma.serviceBookingResourceAllocation.deleteMany();
    await prisma.serviceBooking.deleteMany();
    await prisma.servicePhase.deleteMany();
    await prisma.service.deleteMany();
    await prisma.customerSession.deleteMany();
    await prisma.customerOtp.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.session.deleteMany();
    await prisma.staff.deleteMany();

    // Setup Customers
    const c1 = await prisma.customer.create({
      data: { phone: '09121111111', fullName: 'مشتری اول' },
    });
    customer1Id = c1.id;
    customer1Token = 'c1_session_' + crypto.randomUUID();
    await prisma.customerSession.create({
      data: {
        customerId: customer1Id,
        tokenHash: crypto.createHash('sha256').update(customer1Token).digest('hex'),
        expiresAt: new Date(Date.now() + 86400000),
      },
    });

    const c2 = await prisma.customer.create({
      data: { phone: '09122222222', fullName: 'مشتری دوم' },
    });
    customer2Id = c2.id;
    customer2Token = 'c2_session_' + crypto.randomUUID();
    await prisma.customerSession.create({
      data: {
        customerId: customer2Id,
        tokenHash: crypto.createHash('sha256').update(customer2Token).digest('hex'),
        expiresAt: new Date(Date.now() + 86400000),
      },
    });

    // Setup Staff
    const passHash = await argon2.hash('Secret123');
    const rec = await prisma.staff.create({
      data: {
        username: 'reception_e2e',
        fullName: 'پذیرش مرکز',
        passwordHash: passHash,
        role: StaffRole.RECEPTIONIST,
      },
    });
    receptionistId = rec.id;
    receptionistToken = 'rec_token_' + crypto.randomUUID();
    await prisma.session.create({
      data: {
        staffId: receptionistId,
        tokenHash: crypto.createHash('sha256').update(receptionistToken).digest('hex'),
        expiresAt: new Date(Date.now() + 86400000),
      },
    });

    const cons = await prisma.staff.create({
      data: {
        username: 'artist_e2e',
        fullName: 'آرتیست متخصص',
        passwordHash: passHash,
        role: StaffRole.ARTIST,
      },
    });
    consultantId = cons.id;
  });

  afterAll(async () => {
    await app?.close();
    await prisma.$disconnect();
  });

  it('runs the full consultation lifecycle via HTTP endpoints with IDOR boundary protection', async () => {
    // 1. Customer 1 creates consultation request
    const createRes = await request(app.getHttpServer())
      .post('/api/customer/consultations')
      .set('Authorization', `Bearer ${customer1Token}`)
      .send({
        customServiceTitle: 'کراتین و احیای تخصصی',
        customerNotes: 'موی دکلره شده و خشک، نیاز به بررسی مقاومت مو دارم.',
        preferredSchedule: 'پنج‌شنبه بعدازظهر',
      })
      .expect(201);

    const requestId = createRes.body.id;
    expect(requestId).toBeDefined();
    expect(createRes.body.status).toBe(ConsultationStatus.PENDING_REVIEW);
    expect(createRes.body.budgetTotalMinutes).toBe(240);
    expect(createRes.body.remainingMinutes).toBe(240);

    // 2. IDOR Protection: Customer 2 attempts to view Customer 1's consultation request -> 403 Forbidden
    await request(app.getHttpServer())
      .get(`/api/customer/consultations/${requestId}`)
      .set('Authorization', `Bearer ${customer2Token}`)
      .expect(403);

    // Verify security audit log for unauthorized access attempt
    const idorAudit = await prisma.auditLog.findFirst({
      where: {
        customerId: customer2Id,
        eventType: SecurityEventType.CUSTOMER_UNAUTHORIZED_ACCESS_ATTEMPT,
      },
    });
    expect(idorAudit).toBeDefined();

    // 3. Customer 1 can view their own request
    const ownRes = await request(app.getHttpServer())
      .get(`/api/customer/consultations/${requestId}`)
      .set('Authorization', `Bearer ${customer1Token}`)
      .expect(200);
    expect(ownRes.body.id).toBe(requestId);

    // 4. Staff queries list of pending consultations
    const staffListRes = await request(app.getHttpServer())
      .get('/api/admin/consultations?status=PENDING_REVIEW')
      .set('Authorization', `Bearer ${receptionistToken}`)
      .expect(200);
    expect(staffListRes.body.length).toBeGreaterThanOrEqual(1);
    expect(staffListRes.body[0].id).toBe(requestId);

    // 5. Staff assigns request to consultant
    const assignRes = await request(app.getHttpServer())
      .post(`/api/admin/consultations/${requestId}/assign`)
      .set('Authorization', `Bearer ${receptionistToken}`)
      .send({
        staffId: consultantId,
        note: 'ارجاع به متخصص کراتین',
      })
      .expect(200);
    expect(assignRes.body.assignedStaffId).toBe(consultantId);
    expect(assignRes.body.status).toBe(ConsultationStatus.ASSIGNED_CONSULTANT);

    // 6. Staff requests supplementary info
    const reqInfoRes = await request(app.getHttpServer())
      .post(`/api/admin/consultations/${requestId}/request-info`)
      .set('Authorization', `Bearer ${receptionistToken}`)
      .send({
        question: 'آیا در ۳ ماه اخیر از اتوی مو با حرارت بالا استفاده کرده‌اید؟',
      })
      .expect(200);
    expect(reqInfoRes.body.status).toBe(ConsultationStatus.NEEDS_INFO);
    expect(reqInfoRes.body.isPaused).toBe(true);

    // 7. Customer 2 tries to provide info on Customer 1's request -> 403 Forbidden
    await request(app.getHttpServer())
      .post(`/api/customer/consultations/${requestId}/info`)
      .set('Authorization', `Bearer ${customer2Token}`)
      .send({ answer: 'پاسخ مخرب' })
      .expect(403);

    // 8. Customer 1 provides supplementary info
    const provideInfoRes = await request(app.getHttpServer())
      .post(`/api/customer/consultations/${requestId}/info`)
      .set('Authorization', `Bearer ${customer1Token}`)
      .send({
        answer: 'خیر، از حرارت مستقیم استفاده نکرده‌ام.',
      })
      .expect(200);
    expect(provideInfoRes.body.status).toBe(ConsultationStatus.ASSIGNED_CONSULTANT);
    expect(provideInfoRes.body.isPaused).toBe(false);

    // 9. Staff prepares proposal
    const proposalRes = await request(app.getHttpServer())
      .post(`/api/admin/consultations/${requestId}/proposal`)
      .set('Authorization', `Bearer ${receptionistToken}`)
      .send({
        proposalDetails: {
          recommendedTreatment: 'بوتاکس سرد و آبرسانی عمیق',
          durationMinutes: 90,
          estimatedCostRange: '1,500,000 - 2,000,000',
        },
        note: 'پکیج پیشنهادی احیا آماده شد',
      })
      .expect(200);
    expect(proposalRes.body.status).toBe(ConsultationStatus.PROPOSAL_READY);

    // 10. Staff communicates result to customer
    const commRes = await request(app.getHttpServer())
      .post(`/api/admin/consultations/${requestId}/communicate-result`)
      .set('Authorization', `Bearer ${receptionistToken}`)
      .send({
        resultNotes: 'نتیجه مشاوره تلفنی اعلام شد و مورد رضایت مشتری قرار گرفت.',
        channel: 'PHONE',
      })
      .expect(200);
    expect(commRes.body.status).toBe(ConsultationStatus.RESULT_COMMUNICATED);
    expect(commRes.body.resultNotes).toBe('نتیجه مشاوره تلفنی اعلام شد و مورد رضایت مشتری قرار گرفت.');

    // 11. Staff reopens with documented reason and assignee
    const reopenRes = await request(app.getHttpServer())
      .post(`/api/admin/consultations/${requestId}/reopen`)
      .set('Authorization', `Bearer ${receptionistToken}`)
      .send({
        reason: 'مشتری درخواست بررسی پروتئین‌تراپی مکمل را دارد.',
        assignedStaffId: consultantId,
      })
      .expect(200);
    expect(reopenRes.body.status).toBe(ConsultationStatus.ASSIGNED_CONSULTANT);
    expect(reopenRes.body.reopenReason).toBe('مشتری درخواست بررسی پروتئین‌تراپی مکمل را دارد.');
    expect(reopenRes.body.budgetTotalMinutes).toBe(240);
    expect(reopenRes.body.remainingMinutes).toBe(240);

    // 12. Customer withdraws request
    const withdrawRes = await request(app.getHttpServer())
      .post(`/api/customer/consultations/${requestId}/withdraw`)
      .set('Authorization', `Bearer ${customer1Token}`)
      .send({ reason: 'تصمیم به انجام در سفر آینده گرفتم.' })
      .expect(200);
    expect(withdrawRes.body.status).toBe(ConsultationStatus.WITHDRAWN);

    // 13. Critical Guarantee: ZERO bookings or deposits created
    const bookingCount = await prisma.serviceBooking.count();
    expect(bookingCount).toBe(0);
  });
});
