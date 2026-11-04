import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import * as crypto from 'crypto';
import {
  PrismaClient,
  StaffRole,
  ServicePriceType,
  ArtistLevel,
  BookingStatus,
} from '@salon/database';
import { AppModule } from '../src/app.module';

const prisma = new PrismaClient();

async function createTestSessionToken(staffId: string): Promise<string> {
  const sessionToken = crypto.randomBytes(48).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(sessionToken).digest('hex');
  await prisma.session.create({
    data: {
      staffId,
      tokenHash,
      expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000),
    },
  });
  return sessionToken;
}

describe('HTTP API Seam - Seam 2: Schedule API, RBAC & Privacy Boundary', () => {
  let app: INestApplication;

  let managerToken: string;
  let receptionistToken: string;

  let artistStaffId: string;
  let artistProfileId: string;
  let serviceId: string;

  beforeEach(async () => {
    await prisma.serviceBookingResourceAllocation.deleteMany();
    await prisma.serviceBooking.deleteMany();
    await prisma.servicePhase.deleteMany();
    await prisma.sharedResource.deleteMany();
    await prisma.artistLeave.deleteMany();
    await prisma.workingShift.deleteMany();
    await prisma.artistServiceTariff.deleteMany();
    await prisma.commissionContract.deleteMany();
    await prisma.artistProfile.deleteMany();
    await prisma.service.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.session.deleteMany();
    await prisma.recoveryCode.deleteMany();
    await prisma.independentRecoveryRequest.deleteMany();
    await prisma.staff.deleteMany();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    await app.init();

    // 1. Manager
    const m = await prisma.staff.create({
      data: {
        username: 'manager_schedule',
        fullName: 'Zahra Modir',
        role: StaffRole.MANAGER,
        passwordHash: 'dummy',
      },
    });
    managerToken = await createTestSessionToken(m.id);

    // 2. Receptionist
    const r = await prisma.staff.create({
      data: {
        username: 'reception_schedule',
        fullName: 'Parvaneh Paziresh',
        role: StaffRole.RECEPTIONIST,
        passwordHash: 'dummy',
      },
    });
    receptionistToken = await createTestSessionToken(r.id);

    // 3. Artist
    const a = await prisma.staff.create({
      data: {
        username: 'artist_schedule',
        fullName: 'Mahsa Honarmand',
        role: StaffRole.ARTIST,
        passwordHash: 'dummy',
      },
    });
    artistStaffId = a.id;
    const profile = await prisma.artistProfile.create({
      data: {
        staffId: a.id,
        level: ArtistLevel.MASTER,
      },
    });
    artistProfileId = profile.id;

    // 4. Service
    const s = await prisma.service.create({
      data: {
        name: 'کوپ و براشینگ تخصصی',
        description: 'کوپ ژورنالی همراه با براشینگ حرفه‌ای',
        priceType: ServicePriceType.FIXED,
        fixedPrice: 600000,
        durationMinutes: 60,
      },
    });
    serviceId = s.id;

    // Active Tariff
    await prisma.artistServiceTariff.create({
      data: {
        artistId: artistProfileId,
        serviceId,
        priceType: ServicePriceType.FIXED,
        fixedPrice: 600000,
        durationMinutes: 60,
        isActive: true,
      },
    });
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it('enforces RBAC: Manager can configure capacity rules, Receptionist is strictly forbidden (403)', async () => {
    // 1. Receptionist attempts to create shared resource -> 403
    await request(app.getHttpServer())
      .post('/api/admin/schedule/resources')
      .set('Authorization', `Bearer ${receptionistToken}`)
      .send({ name: 'تخت فیشیال', capacity: 3 })
      .expect(403);

    // 2. Manager successfully creates shared resource -> 201
    const resRes = await request(app.getHttpServer())
      .post('/api/admin/schedule/resources')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ name: 'تخت فیشیال', capacity: 3, description: 'تخت‌های لاین مراقبت پوست' })
      .expect(201);

    expect(resRes.body.name).toBe('تخت فیشیال');
    expect(resRes.body.capacity).toBe(3);

    // 3. Manager configures artist shift -> 201
    await request(app.getHttpServer())
      .post('/api/admin/schedule/shifts')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        artistId: artistProfileId,
        dayOfWeek: 0, // Saturday
        startTime: '09:00',
        endTime: '18:00',
      })
      .expect(201);

    // 4. Receptionist attempts to configure service phases -> 403
    await request(app.getHttpServer())
      .post(`/api/admin/schedule/services/${serviceId}/phases`)
      .set('Authorization', `Bearer ${receptionistToken}`)
      .send({
        phases: [
          { name: 'کوپ ژورنالی', sequenceOrder: 1, durationMinutes: 40, isPause: false },
          { name: 'براشینگ', sequenceOrder: 2, durationMinutes: 20, isPause: false },
        ],
      })
      .expect(403);

    // 5. Manager configures service phases -> 201
    const phaseRes = await request(app.getHttpServer())
      .post(`/api/admin/schedule/services/${serviceId}/phases`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        phases: [
          { name: 'کوپ ژورنالی', sequenceOrder: 1, durationMinutes: 40, isPause: false },
          { name: 'براشینگ', sequenceOrder: 2, durationMinutes: 20, isPause: false },
        ],
      })
      .expect(201);

    expect(phaseRes.body.length).toBe(2);
  });

  it('serves public available slots without authentication while guaranteeing zero privacy leakage (Story 4, 35)', async () => {
    // Setup shift and existing booking with another customer
    await prisma.workingShift.create({
      data: {
        artistId: artistProfileId,
        dayOfWeek: 0, // Saturday
        startTime: '09:00',
        endTime: '18:00',
      },
    });

    // An existing booking for another customer
    await prisma.serviceBooking.create({
      data: {
        serviceId,
        artistId: artistProfileId,
        customerName: 'Fatemeh Secret Customer',
        customerPhone: '09129998877',
        startTime: new Date('2026-11-07T09:00:00.000Z'),
        endTime: new Date('2026-11-07T10:00:00.000Z'),
        status: BookingStatus.CONFIRMED,
      },
    });

    // Public request to calculate slots for 2026-11-07 (Saturday)
    const res = await request(app.getHttpServer())
      .get(`/api/public/capacity/slots?serviceId=${serviceId}&date=2026-11-07`)
      .expect(200);

    const slots = res.body;
    expect(Array.isArray(slots)).toBe(true);
    expect(slots.length).toBeGreaterThan(0);

    // Strict confidentiality check: No other customer's name, phone, or private details in response!
    const jsonString = JSON.stringify(slots);
    expect(jsonString).not.toContain('Fatemeh');
    expect(jsonString).not.toContain('09129998877');
    expect(jsonString).not.toContain('Secret Customer');

    // Slot at 09:00 must NOT be available because artist is booked
    const slotAtNine = slots.find((s: any) => s.startTime === '2026-11-07T09:00:00.000Z');
    expect(slotAtNine).toBeUndefined();

    // Slot at 10:00 must be available
    const slotAtTen = slots.find((s: any) => s.startTime === '2026-11-07T10:00:00.000Z');
    expect(slotAtTen).toBeDefined();
    expect(slotAtTen.artistName).toBe('Mahsa Honarmand');
    expect(slotAtTen.totalDurationMinutes).toBe(60);
  });
});
