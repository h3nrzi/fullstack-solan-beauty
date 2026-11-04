import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { PrismaClient, StaffRole, ServicePriceType, ArtistLevel, BookingStatus } from '@salon/database';
import { CapacityService } from '../src/schedule/capacity.service';
import { ScheduleManagementService } from '../src/schedule/schedule-management.service';
import { ImpactDetectionService } from '../src/schedule/impact-detection.service';

describe('Domain Scheduling & Capacity Seam - Seam 1: Single Service Capacity & Shifts', () => {
  const prisma = new PrismaClient();
  let capacityService: CapacityService;
  let scheduleService: ScheduleManagementService;
  let impactService: ImpactDetectionService;

  let managerId: string;
  let artist1Id: string;
  let artist2Id: string;
  let artist3Id: string;
  let serviceId: string;
  let washingChairId: string;

  beforeEach(async () => {
    // Clean up tables in reverse dependency order
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

    scheduleService = new ScheduleManagementService(prisma);
    capacityService = new CapacityService(prisma);
    impactService = new ImpactDetectionService(prisma);

    // Create Manager
    const manager = await prisma.staff.create({
      data: {
        username: 'salon_manager',
        fullName: 'Zahra Modir',
        role: StaffRole.MANAGER,
        passwordHash: 'dummy',
      },
    });
    managerId = manager.id;

    // Create 3 Artists
    const staff1 = await prisma.staff.create({
      data: { username: 'artist_1', fullName: 'Shima Artist', role: StaffRole.ARTIST, passwordHash: 'dummy' },
    });
    const profile1 = await prisma.artistProfile.create({
      data: { staffId: staff1.id, level: ArtistLevel.SENIOR },
    });
    artist1Id = profile1.id;

    const staff2 = await prisma.staff.create({
      data: { username: 'artist_2', fullName: 'Roya Artist', role: StaffRole.ARTIST, passwordHash: 'dummy' },
    });
    const profile2 = await prisma.artistProfile.create({
      data: { staffId: staff2.id, level: ArtistLevel.SENIOR },
    });
    artist2Id = profile2.id;

    const staff3 = await prisma.staff.create({
      data: { username: 'artist_3', fullName: 'Niloofar Artist', role: StaffRole.ARTIST, passwordHash: 'dummy' },
    });
    const profile3 = await prisma.artistProfile.create({
      data: { staffId: staff3.id, level: ArtistLevel.SENIOR },
    });
    artist3Id = profile3.id;

    // Create Shared Resource: 2 Washing Chairs
    const resource = await scheduleService.createResource(
      { name: 'صندلی سرشور', capacity: 2, description: 'صندلی شست‌وشوی مو' },
      managerId
    );
    washingChairId = resource.id;

    // Create Service: Hair Coloring (105 min total)
    const service = await prisma.service.create({
      data: {
        name: 'رنگ موی تخصصی',
        description: 'رنگ و لایت همراه با شست‌وشو',
        priceType: ServicePriceType.FIXED,
        fixedPrice: 1500000,
        durationMinutes: 105,
      },
    });
    serviceId = service.id;

    // Configure 3 Service Phases:
    // Phase 1: Application (30m, no resource)
    // Phase 2: Pause / Processing (45m, isPause: true, no resource)
    // Phase 3: Wash & Finish (30m, requires 1 washing chair)
    await scheduleService.configureServicePhases(
      serviceId,
      [
        { name: 'آماده‌سازی و رنگ‌گذاری', sequenceOrder: 1, durationMinutes: 30, isPause: false },
        { name: 'مکث مواد رنگ', sequenceOrder: 2, durationMinutes: 45, isPause: true },
        {
          name: 'شست‌وشو و براشینگ',
          sequenceOrder: 3,
          durationMinutes: 30,
          isPause: false,
          resourceId: washingChairId,
          resourceUnits: 1,
          setupBufferMinutes: 0,
          cleanupBufferMinutes: 0,
        },
      ],
      managerId
    );

    // Give all 3 artists active shifts for Saturday (dayOfWeek 0: 09:00 - 18:00)
    for (const aId of [artist1Id, artist2Id, artist3Id]) {
      await scheduleService.createShift(
        {
          artistId: aId,
          dayOfWeek: 0,
          startTime: '09:00',
          endTime: '18:00',
        },
        managerId
      );
      // Also register active tariff so artists are qualified
      await prisma.artistServiceTariff.create({
        data: {
          artistId: aId,
          serviceId,
          priceType: ServicePriceType.FIXED,
          fixedPrice: 1500000,
          durationMinutes: 105,
          isActive: true,
        },
      });
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('calculates available slots for single service respecting shifts and lead time without committing capacity', async () => {
    // Target date: a Saturday at 10:00 (assume server time is early morning of that date, e.g. 06:00 UTC)
    // 120 min lead time requirement: slots must start >= 08:00
    const testDate = '2026-11-07'; // Saturday
    const fakeNow = new Date('2026-11-07T05:00:00.000Z');

    const slots = await capacityService.calculateAvailableSlots({
      serviceId,
      date: testDate,
      now: fakeNow,
    });

    expect(slots.length).toBeGreaterThan(0);
    // Every slot duration must be 105 minutes
    const firstSlot = slots[0];
    expect(firstSlot.totalDurationMinutes).toBe(105);
    expect(firstSlot.serviceId).toBe(serviceId);
    expect(firstSlot.phaseDetails?.length).toBe(3);

    // Verify read-only: no booking records created
    const bookingCount = await prisma.serviceBooking.count();
    expect(bookingCount).toBe(0);
  });

  it('keeps artist occupied for the entire duration including pause phase (Story 6, Story 35)', async () => {
    const bookingDate = new Date('2026-11-07T09:00:00.000Z');
    const bookingEndDate = new Date('2026-11-07T10:45:00.000Z'); // 105 min

    // Book artist 1 from 09:00 to 10:45
    await scheduleService.createBooking({
      serviceId,
      artistId: artist1Id,
      customerName: 'Customer A',
      startTime: bookingDate,
      endTime: bookingEndDate,
    });

    // Check if artist 1 is available during the pause phase (e.g. 09:30 to 10:15)
    const isArtist1AvailableAtPause = await capacityService.isArtistAvailable(
      artist1Id,
      new Date('2026-11-07T09:30:00.000Z'),
      new Date('2026-11-07T10:15:00.000Z')
    );

    // Artist must NOT be considered free during pause phase
    expect(isArtist1AvailableAtPause).toBe(false);
  });

  it('blocks slot when shared resource capacity is exhausted, even if a 3rd artist is free (Evaluator First Action)', async () => {
    // Resource capacity is 2 washing chairs.
    // Booking 1: Artist 1, 09:00 - 10:45. Phase 3 (Wash) is from 10:15 to 10:45. (Uses Chair 1)
    await scheduleService.createBooking({
      serviceId,
      artistId: artist1Id,
      customerName: 'Customer 1',
      startTime: new Date('2026-11-07T09:00:00.000Z'),
      endTime: new Date('2026-11-07T10:45:00.000Z'),
      allocations: [
        {
          resourceId: washingChairId,
          phaseOrder: 3,
          startTime: new Date('2026-11-07T10:15:00.000Z'),
          endTime: new Date('2026-11-07T10:45:00.000Z'),
          unitsUsed: 1,
        },
      ],
    });

    // Booking 2: Artist 2, 09:00 - 10:45. Phase 3 (Wash) is from 10:15 to 10:45. (Uses Chair 2)
    await scheduleService.createBooking({
      serviceId,
      artistId: artist2Id,
      customerName: 'Customer 2',
      startTime: new Date('2026-11-07T09:00:00.000Z'),
      endTime: new Date('2026-11-07T10:45:00.000Z'),
      allocations: [
        {
          resourceId: washingChairId,
          phaseOrder: 3,
          startTime: new Date('2026-11-07T10:15:00.000Z'),
          endTime: new Date('2026-11-07T10:45:00.000Z'),
          unitsUsed: 1,
        },
      ],
    });

    // Now, Artist 3 is completely free from 09:00 to 10:45.
    // BUT during 10:15 - 10:45, both washing chairs are in use!
    // Therefore, Artist 3 CANNOT be suggested for slot 09:00 - 10:45!
    const slots = await capacityService.calculateAvailableSlots({
      serviceId,
      date: '2026-11-07',
      artistId: artist3Id,
      now: new Date('2026-11-07T05:00:00.000Z'),
    });

    const conflictingSlot = slots.find(
      (s) => s.startTime === '2026-11-07T09:00:00.000Z' && s.artistId === artist3Id
    );
    expect(conflictingSlot).toBeUndefined();
  });

  it('updates available slots when artist takes leave or buffers change', async () => {
    // Artist 3 takes leave for the whole day
    await scheduleService.createLeave(
      {
        artistId: artist3Id,
        startDate: new Date('2026-11-07T00:00:00.000Z'),
        endDate: new Date('2026-11-07T23:59:59.000Z'),
        reason: 'مرخصی استعلاجی',
        isApproved: true,
      },
      managerId
    );

    const slotsArtist3 = await capacityService.calculateAvailableSlots({
      serviceId,
      date: '2026-11-07',
      artistId: artist3Id,
      now: new Date('2026-11-07T05:00:00.000Z'),
    });

    // No slots available for artist 3 on their leave day
    expect(slotsArtist3.length).toBe(0);
  });

  it('surfaces affected existing bookings upon rule change without silently deleting or shifting them', async () => {
    // Existing confirmed booking for artist 1
    const booking = await scheduleService.createBooking({
      serviceId,
      artistId: artist1Id,
      customerName: 'Customer Impacted',
      customerPhone: '09123456789',
      startTime: new Date('2026-11-07T11:00:00.000Z'),
      endTime: new Date('2026-11-07T12:45:00.000Z'),
    });

    expect(booking.isImpacted).toBe(false);

    // Manager registers a leave for artist 1 that covers this time window
    const impactResult = await impactService.applyLeaveAndDetectImpact(
      {
        artistId: artist1Id,
        startDate: new Date('2026-11-07T10:00:00.000Z'),
        endDate: new Date('2026-11-07T14:00:00.000Z'),
        reason: 'مرخصی اضطراری',
        isApproved: true,
      },
      managerId
    );

    // Impact must be detected and surfaced
    expect(impactResult.impactedCount).toBe(1);
    expect(impactResult.impactedBookings[0].id).toBe(booking.id);

    // Verify in database: booking is NOT deleted, status remains CONFIRMED, but flagged as isImpacted
    const refreshedBooking = await prisma.serviceBooking.findUnique({
      where: { id: booking.id },
    });
    expect(refreshedBooking).not.toBeNull();
    expect(refreshedBooking?.status).toBe(BookingStatus.CONFIRMED);
    expect(refreshedBooking?.isImpacted).toBe(true);
    expect(refreshedBooking?.impactReason).toContain('مرخصی');

    // Audit log must record the rule change
    const auditLogs = await prisma.auditLog.findMany({
      where: { eventType: 'SCHEDULE_RULE_CHANGED' },
    });
    expect(auditLogs.length).toBeGreaterThan(0);
  });
});
