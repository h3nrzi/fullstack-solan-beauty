import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { PrismaClient, StaffRole, ServicePriceType, ArtistLevel } from '@salon/database';
import { ScheduleManagementService } from '../src/schedule/schedule-management.service';

describe('Database Concurrency Seam - Seam 3: Resource Capacity Under Independent Connections', () => {
  // 3 Independent PostgreSQL connections
  const prisma1 = new PrismaClient();
  const prisma2 = new PrismaClient();
  const prisma3 = new PrismaClient();

  let serviceId: string;
  let resourceId: string;
  let artist1Id: string;
  let artist2Id: string;
  let artist3Id: string;

  beforeEach(async () => {
    await prisma1.serviceBookingResourceAllocation.deleteMany();
    await prisma1.serviceBooking.deleteMany();
    await prisma1.servicePhase.deleteMany();
    await prisma1.sharedResource.deleteMany();
    await prisma1.artistLeave.deleteMany();
    await prisma1.workingShift.deleteMany();
    await prisma1.artistServiceTariff.deleteMany();
    await prisma1.commissionContract.deleteMany();
    await prisma1.artistProfile.deleteMany();
    await prisma1.service.deleteMany();
    await prisma1.auditLog.deleteMany();
    await prisma1.session.deleteMany();
    await prisma1.recoveryCode.deleteMany();
    await prisma1.independentRecoveryRequest.deleteMany();
    await prisma1.staff.deleteMany();

    // 1. Create Service
    const srv = await prisma1.service.create({
      data: {
        name: 'شست‌وشو و احیای مو',
        priceType: ServicePriceType.FIXED,
        fixedPrice: 800000,
        durationMinutes: 45,
      },
    });
    serviceId = srv.id;

    // 2. Create Shared Resource with EXACT CAPACITY of 2 units (Story 6)
    const res = await prisma1.sharedResource.create({
      data: {
        name: 'سرشور لوکس',
        capacity: 2,
      },
    });
    resourceId = res.id;

    // 3. Create 3 Artists
    for (let i = 1; i <= 3; i++) {
      const staff = await prisma1.staff.create({
        data: {
          username: `concurrent_artist_${i}`,
          fullName: `Artist ${i}`,
          role: StaffRole.ARTIST,
          passwordHash: 'dummy',
        },
      });
      const profile = await prisma1.artistProfile.create({
        data: {
          staffId: staff.id,
          level: ArtistLevel.SENIOR,
        },
      });
      if (i === 1) artist1Id = profile.id;
      if (i === 2) artist2Id = profile.id;
      if (i === 3) artist3Id = profile.id;
    }
  });

  afterAll(async () => {
    await prisma1.$disconnect();
    await prisma2.$disconnect();
    await prisma3.$disconnect();
  });

  it('handles 3 concurrent demands for 2 resource units across independent DB connections with exactly 2 allocations (Story 6)', async () => {
    const service1 = new ScheduleManagementService(prisma1);
    const service2 = new ScheduleManagementService(prisma2);
    const service3 = new ScheduleManagementService(prisma3);

    const slotStart = new Date('2026-11-08T10:00:00.000Z');
    const slotEnd = new Date('2026-11-08T10:45:00.000Z');

    // 3 concurrent booking requests from independent connections competing for the 2 resource units
    const request1 = service1.createBooking({
      serviceId,
      artistId: artist1Id,
      customerName: 'Customer A',
      startTime: slotStart,
      endTime: slotEnd,
      allocations: [
        {
          resourceId,
          phaseOrder: 1,
          startTime: slotStart,
          endTime: slotEnd,
          unitsUsed: 1,
        },
      ],
    });

    const request2 = service2.createBooking({
      serviceId,
      artistId: artist2Id,
      customerName: 'Customer B',
      startTime: slotStart,
      endTime: slotEnd,
      allocations: [
        {
          resourceId,
          phaseOrder: 1,
          startTime: slotStart,
          endTime: slotEnd,
          unitsUsed: 1,
        },
      ],
    });

    const request3 = service3.createBooking({
      serviceId,
      artistId: artist3Id,
      customerName: 'Customer C',
      startTime: slotStart,
      endTime: slotEnd,
      allocations: [
        {
          resourceId,
          phaseOrder: 1,
          startTime: slotStart,
          endTime: slotEnd,
          unitsUsed: 1,
        },
      ],
    });

    const results = await Promise.allSettled([request1, request2, request3]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    // Crucial Story 6 assertion:
    // Exactly 2 requests must succeed and exactly 1 must be rejected due to capacity limit
    expect(fulfilled.length).toBe(2);
    expect(rejected.length).toBe(1);

    // Verify rejection reason is capacity exhaustion
    const rejectedError: any = (rejected[0] as PromiseRejectedResult).reason;
    expect(rejectedError.message).toContain('ظرفیت منبع مشترک');

    // Verify DB integrity: Exactly 2 bookings and 2 allocations exist
    const totalBookings = await prisma1.serviceBooking.count();
    const totalAllocations = await prisma1.serviceBookingResourceAllocation.count();
    expect(totalBookings).toBe(2);
    expect(totalAllocations).toBe(2);
  });
});
