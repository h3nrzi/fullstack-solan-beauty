import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import {
  PrismaClient,
  StaffRole,
  ConsultationStatus,
  ConsultationEventType,
} from '@salon/database';
import { ConsultationService } from '../src/consultation/consultation.service';

describe('Concurrency - Seam 3: Consultation Request Concurrent State Transitions & Isolation', () => {
  const prisma1 = new PrismaClient();
  const prisma2 = new PrismaClient();

  let customerId: string;
  let receptionist1Id: string;
  let receptionist2Id: string;
  let consultantId: string;

  beforeEach(async () => {
    await prisma1.consultationRequestEvent.deleteMany();
    await prisma1.consultationRequest.deleteMany();
    await prisma1.auditLog.deleteMany();
    await prisma1.customerSession.deleteMany();
    await prisma1.customer.deleteMany();
    await prisma1.session.deleteMany();
    await prisma1.staff.deleteMany();

    const c = await prisma1.customer.create({
      data: { phone: '09123334455', fullName: 'مشتری آزمون رقابت' },
    });
    customerId = c.id;

    const r1 = await prisma1.staff.create({
      data: {
        username: 'rec_conn1',
        fullName: 'پذیرش اول',
        passwordHash: 'dummy',
        role: StaffRole.RECEPTIONIST,
      },
    });
    receptionist1Id = r1.id;

    const r2 = await prisma1.staff.create({
      data: {
        username: 'rec_conn2',
        fullName: 'پذیرش دوم',
        passwordHash: 'dummy',
        role: StaffRole.RECEPTIONIST,
      },
    });
    receptionist2Id = r2.id;

    const cons = await prisma1.staff.create({
      data: {
        username: 'consultant_conn',
        fullName: 'مشاور متخصص',
        passwordHash: 'dummy',
        role: StaffRole.ARTIST,
      },
    });
    consultantId = cons.id;
  });

  afterAll(async () => {
    await prisma1.$disconnect();
    await prisma2.$disconnect();
  });

  it('prevents race conditions: concurrent info submissions on independent DB connections allow only one transition and maintain history integrity', async () => {
    const service1 = new ConsultationService(prisma1);
    const service2 = new ConsultationService(prisma2);

    // 1. Create request and put in NEEDS_INFO
    const req = await service1.createRequest(customerId, {
      customerNotes: 'مشاوره مزوتراپی',
    });
    await service1.requestInfo(req.id, receptionist1Id, 'آیا سابقه آلرژی پوستی دارید؟');

    // 2. Concurrently attempt to provide info from two independent connections
    const [res1, res2] = await Promise.allSettled([
      service1.provideInfo(req.id, customerId, 'پاسخ ارسالی از ارتباط اول'),
      service2.provideInfo(req.id, customerId, 'پاسخ ارسالی از ارتباط دوم'),
    ]);

    const successes = [res1, res2].filter((r) => r.status === 'fulfilled');
    const failures = [res1, res2].filter((r) => r.status === 'rejected');

    expect(successes.length).toBe(1);
    expect(failures.length).toBe(1);

    // Check DB state
    const finalReq = await prisma1.consultationRequest.findUnique({
      where: { id: req.id },
      include: { events: true },
    });

    expect(finalReq?.status).toBe(ConsultationStatus.PENDING_REVIEW);
    expect(finalReq?.isPaused).toBe(false);

    // Exactly one INFO_PROVIDED event in DB
    const infoEvents = finalReq?.events.filter(
      (e) => e.eventType === ConsultationEventType.INFO_PROVIDED,
    );
    expect(infoEvents?.length).toBe(1);
  });

  it('prevents race conditions: concurrent reopen attempts on withdrawn request allow only one reopen cycle', async () => {
    const service1 = new ConsultationService(prisma1);
    const service2 = new ConsultationService(prisma2);

    const req = await service1.createRequest(customerId, {
      customerNotes: 'مشاوره هایفوتراپی',
    });
    await service1.withdrawRequest(req.id, customerId, 'انصراف موقت');

    // Concurrently attempt to reopen
    const [res1, res2] = await Promise.allSettled([
      service1.reopenRequest(req.id, receptionist1Id, 'بازگشایی از پذیرش ۱', consultantId),
      service2.reopenRequest(req.id, receptionist2Id, 'بازگشایی از پذیرش ۲', consultantId),
    ]);

    const successes = [res1, res2].filter((r) => r.status === 'fulfilled');
    const failures = [res1, res2].filter((r) => r.status === 'rejected');

    expect(successes.length).toBe(1);
    expect(failures.length).toBe(1);

    // Final state is ASSIGNED_CONSULTANT with exactly 240 minutes budget
    const finalReq = await prisma1.consultationRequest.findUnique({
      where: { id: req.id },
      include: { events: true },
    });
    expect(finalReq?.status).toBe(ConsultationStatus.ASSIGNED_CONSULTANT);
    expect(finalReq?.budgetTotalMinutes).toBe(240);

    const reopenEvents = finalReq?.events.filter(
      (e) => e.eventType === ConsultationEventType.REOPENED,
    );
    expect(reopenEvents?.length).toBe(1);
  });
});
