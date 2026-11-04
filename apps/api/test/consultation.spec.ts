import { describe, it, expect, beforeEach } from 'vitest';
import {
  PrismaClient,
  StaffRole,
  ConsultationStatus,
  ConsultationEventType,
  SecurityEventType,
} from '@salon/database';
import { ConsultationService } from '../src/consultation/consultation.service';
import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';

const prisma = new PrismaClient();

describe('Domain Service Seam - Seam 1: Consultation Request, Follow-up & SLA Budget', () => {
  let consultationService: ConsultationService;
  let customer1Id: string;
  let customer2Id: string;
  let receptionistId: string;
  let consultantId: string;

  beforeEach(async () => {
    // Clean tables
    await prisma.consultationRequestEvent.deleteMany();
    await prisma.consultationRequest.deleteMany();
    await prisma.serviceBookingResourceAllocation.deleteMany();
    await prisma.serviceBooking.deleteMany();
    await prisma.customerSession.deleteMany();
    await prisma.customerOtp.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.staff.deleteMany();

    consultationService = new ConsultationService(prisma);

    // Create test customers
    const c1 = await prisma.customer.create({
      data: {
        phone: '09121111111',
        fullName: 'مینا رضایی',
      },
    });
    customer1Id = c1.id;

    const c2 = await prisma.customer.create({
      data: {
        phone: '09122222222',
        fullName: 'سارا حسینی',
      },
    });
    customer2Id = c2.id;

    // Create test staff (receptionist & consultant)
    const rec = await prisma.staff.create({
      data: {
        username: 'reception1',
        fullName: 'پذیرش سالن',
        passwordHash: 'dummy',
        role: StaffRole.RECEPTIONIST,
      },
    });
    receptionistId = rec.id;

    const cons = await prisma.staff.create({
      data: {
        username: 'consultant1',
        fullName: 'مشاور پوست و مو',
        passwordHash: 'dummy',
        role: StaffRole.ARTIST,
      },
    });
    consultantId = cons.id;
  });

  it('creates consultation request with 4 working hours budget (240 min) and NO capacity/deposit', async () => {
    const request = await consultationService.createRequest(customer1Id, {
      customerNotes: 'پوست من حساس است و نیاز به مشاوره قبل از فیشیال دارم.',
      customServiceTitle: 'فیشیال تخصصی',
      preferredSchedule: 'شنبه صبح',
    });

    expect(request.id).toBeDefined();
    expect(request.customerId).toBe(customer1Id);
    expect(request.status).toBe(ConsultationStatus.PENDING_REVIEW);
    expect(request.budgetTotalMinutes).toBe(240);
    expect(request.elapsedActiveMinutes).toBe(0);
    expect(request.remainingMinutes).toBe(240);
    expect(request.isPaused).toBe(false);
    expect(request.isBudgetBreached).toBe(false);

    // Zero capacity / booking assertion
    const bookingsCount = await prisma.serviceBooking.count();
    expect(bookingsCount).toBe(0);

    // Event log created
    expect(request.events?.length).toBe(1);
    expect(request.events?.[0].eventType).toBe(ConsultationEventType.CREATED);
    expect(request.events?.[0].toStatus).toBe(ConsultationStatus.PENDING_REVIEW);
  });

  it('simulates evaluator first action: 90 min elapsed, request info pauses timer, customer responds next day, reassigned with 150 min remaining', async () => {
    // 1. Customer creates request
    const req = await consultationService.createRequest(customer1Id, {
      customerNotes: 'رنگ و مش روی موی دکلره قبلی، بدون آسیب',
    });

    // 2. Simulate 90 minutes of active consultation review time
    const simulatedNow = new Date(Date.now() + 90 * 60 * 1000);
    const updatedStatusWith90Min = await consultationService.calculateBudgetState(req.id, simulatedNow);
    expect(updatedStatusWith90Min.elapsedActiveMinutes).toBe(90);
    expect(updatedStatusWith90Min.remainingMinutes).toBe(150);

    // 3. Receptionist requests supplementary info (at +90 min)
    const afterInfoReq = await consultationService.requestInfo(
      req.id,
      receptionistId,
      'لطفاً عکس واضح از پشت مو و تاریخ آخرین دکلره را بفرستید.',
      simulatedNow,
    );
    expect(afterInfoReq.status).toBe(ConsultationStatus.NEEDS_INFO);
    expect(afterInfoReq.isPaused).toBe(true);
    expect(afterInfoReq.elapsedActiveMinutes).toBe(90);
    expect(afterInfoReq.remainingMinutes).toBe(150);

    // 4. Time passes (e.g. next business day = +24 hours). Since timer is paused, remaining time MUST NOT decrease!
    const nextDay = new Date(simulatedNow.getTime() + 24 * 60 * 60 * 1000);
    const checkedNextDay = await consultationService.calculateBudgetState(req.id, nextDay);
    expect(checkedNextDay.isPaused).toBe(true);
    expect(checkedNextDay.elapsedActiveMinutes).toBe(90);
    expect(checkedNextDay.remainingMinutes).toBe(150);

    // 5. Customer responds with supplementary info on the next day
    const afterCustomerResponse = await consultationService.provideInfo(
      req.id,
      customer1Id,
      'آخرین دکلره ۶ ماه پیش بوده و موها در انتهای ساقه کمی خشک است.',
      nextDay,
    );
    expect(afterCustomerResponse.isPaused).toBe(false);
    expect(afterCustomerResponse.elapsedActiveMinutes).toBe(90);
    expect(afterCustomerResponse.remainingMinutes).toBe(150);

    // 6. Receptionist reassigns request to specialist consultant
    const afterReassignment = await consultationService.assignStaff(
      req.id,
      consultantId,
      receptionistId,
      'ارجاع به متخصص رنگ و مش',
      nextDay,
    );
    expect(afterReassignment.assignedStaffId).toBe(consultantId);
    expect(afterReassignment.status).toBe(ConsultationStatus.ASSIGNED_CONSULTANT);
    // CRITICAL: Reassignment must NOT refresh or reset budget! Exactly 150 minutes remaining!
    expect(afterReassignment.elapsedActiveMinutes).toBe(90);
    expect(afterReassignment.remainingMinutes).toBe(150);
    expect(afterReassignment.budgetTotalMinutes).toBe(240);

    // Zero capacity or deposit created throughout entire workflow
    const totalBookings = await prisma.serviceBooking.count();
    expect(totalBookings).toBe(0);

    // History trail contains all steps
    const detailed = await consultationService.getRequestById(req.id, customer1Id);
    expect(detailed.events?.map((e) => e.eventType)).toEqual([
      ConsultationEventType.CREATED,
      ConsultationEventType.INFO_REQUESTED,
      ConsultationEventType.INFO_PROVIDED,
      ConsultationEventType.ASSIGNED,
    ]);
  });

  it('detects budget breach when active elapsed time exceeds 240 minutes', async () => {
    const req = await consultationService.createRequest(customer1Id, {
      customerNotes: 'مشاوره کوتاهی ژورنالی',
    });

    // 250 minutes later without completion
    const overdueTime = new Date(Date.now() + 250 * 60 * 1000);
    const checked = await consultationService.calculateBudgetState(req.id, overdueTime);

    expect(checked.isBudgetBreached).toBe(true);
    expect(checked.remainingMinutes).toBe(0);
    expect(checked.elapsedActiveMinutes).toBe(250);
  });

  it('allows customer to withdraw request and records history', async () => {
    const req = await consultationService.createRequest(customer1Id, {
      customerNotes: 'مشاوره اصلاح ابرو',
    });

    const withdrawn = await consultationService.withdrawRequest(
      req.id,
      customer1Id,
      'برنامه‌ام عوض شد و تمایل به لغو دارم.',
    );

    expect(withdrawn.status).toBe(ConsultationStatus.WITHDRAWN);
    expect(withdrawn.withdrawalReason).toBe('برنامه‌ام عوض شد و تمایل به لغو دارم.');

    // Customer 2 cannot withdraw customer 1's request
    const req2 = await consultationService.createRequest(customer1Id, {
      customerNotes: 'درخواست دوم',
    });
    await expect(
      consultationService.withdrawRequest(req2.id, customer2Id, 'تلاش غیرمجاز'),
    ).rejects.toThrow(ForbiddenException);
  });

  it('communicates result and stops active budget countdown', async () => {
    const req = await consultationService.createRequest(customer1Id, {
      customerNotes: 'مشاوره کاشت مژه',
    });

    await consultationService.assignStaff(req.id, consultantId, receptionistId);
    await consultationService.prepareProposal(req.id, consultantId, {
      suggestedService: 'کاشت کلاسیک',
      estimatedDurationMinutes: 120,
      estimatedPriceRange: '800,000 - 1,200,000',
    });

    const communicated = await consultationService.communicateResult(
      req.id,
      consultantId,
      'با مشتری تماس گرفته شد و مدل کاشت کلاسیک تایید و توافق شد.',
      'PHONE',
    );

    expect(communicated.status).toBe(ConsultationStatus.RESULT_COMMUNICATED);
    expect(communicated.resultNotes).toBe('با مشتری تماس گرفته شد و مدل کاشت کلاسیک تایید و توافق شد.');
    expect(communicated.resultChannel).toBe('PHONE');
    expect(communicated.resultCommunicatedAt).toBeDefined();
  });

  it('reopens closed/withdrawn request with documented reason, assignee, and fresh 240m budget', async () => {
    const req = await consultationService.createRequest(customer1Id, {
      customerNotes: 'مشاوره اول',
    });
    await consultationService.withdrawRequest(req.id, customer1Id, 'انصراف موقت');

    // Reopen by receptionist
    const reopened = await consultationService.reopenRequest(
      req.id,
      receptionistId,
      'مشتری مجدداً تمایل خود را برای ادامه بررسی اعلام کرد.',
      consultantId,
    );

    expect(reopened.status).toBe(ConsultationStatus.ASSIGNED_CONSULTANT);
    expect(reopened.assignedStaffId).toBe(consultantId);
    expect(reopened.reopenReason).toBe('مشتری مجدداً تمایل خود را برای ادامه بررسی اعلام کرد.');
    // Fresh 240 minutes budget
    expect(reopened.budgetTotalMinutes).toBe(240);
    expect(reopened.elapsedActiveMinutes).toBe(0);
    expect(reopened.remainingMinutes).toBe(240);
    expect(reopened.isBudgetBreached).toBe(false);

    // History includes REOPENED event
    const lastEvent = reopened.events?.[reopened.events.length - 1];
    expect(lastEvent?.eventType).toBe(ConsultationEventType.REOPENED);
    expect(lastEvent?.note).toBe('مشتری مجدداً تمایل خود را برای ادامه بررسی اعلام کرد.');
  });
});
