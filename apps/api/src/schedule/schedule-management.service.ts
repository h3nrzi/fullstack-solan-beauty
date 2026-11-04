import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import {
  PrismaClient,
  SharedResource,
  WorkingShift,
  ArtistLeave,
  ServicePhase,
  ServiceBooking,
  BookingStatus,
} from '@salon/database';
import {
  CreateSharedResourceInput,
  CreateServicePhaseInput,
  CreateWorkingShiftInput,
  CreateArtistLeaveInput,
  SecurityEventType,
} from '@salon/shared';

@Injectable()
export class ScheduleManagementService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Create or update a shared resource (e.g. washing chair, facial bed)
   */
  async createResource(
    input: CreateSharedResourceInput,
    actorStaffId?: string
  ): Promise<SharedResource> {
    if (input.capacity <= 0) {
      throw new BadRequestException('ظرفیت منبع باید بزرگ‌تر از صفر باشد.');
    }

    const resource = await this.prisma.sharedResource.create({
      data: {
        name: input.name,
        capacity: input.capacity,
        description: input.description,
        isActive: input.isActive ?? true,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        staffId: actorStaffId,
        eventType: SecurityEventType.RESOURCE_CONFIGURED,
        details: {
          resourceId: resource.id,
          name: resource.name,
          capacity: resource.capacity,
        },
      },
    });

    return resource;
  }

  async listResources(): Promise<SharedResource[]> {
    return this.prisma.sharedResource.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * List all bookings that were marked as impacted by rule changes
   */
  async listImpactedBookings() {
    return this.prisma.serviceBooking.findMany({
      where: { isImpacted: true },
      include: {
        service: true,
        artist: { include: { staff: true } },
      },
      orderBy: { startTime: 'asc' },
    });
  }

  /**
   * Configure artist working shifts (0 = Saturday to 6 = Friday in Persian calendar)
   */
  async createShift(
    input: CreateWorkingShiftInput,
    actorStaffId?: string
  ): Promise<WorkingShift> {
    if (input.dayOfWeek < 0 || input.dayOfWeek > 6) {
      throw new BadRequestException('روز هفته باید بین ۰ (شنبه) تا ۶ (جمعه) باشد.');
    }

    const shift = await this.prisma.workingShift.create({
      data: {
        artistId: input.artistId,
        dayOfWeek: input.dayOfWeek,
        startTime: input.startTime,
        endTime: input.endTime,
        isActive: input.isActive ?? true,
        specificDate: input.specificDate ? new Date(input.specificDate) : null,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        staffId: actorStaffId,
        eventType: SecurityEventType.SHIFT_CONFIGURED,
        details: {
          shiftId: shift.id,
          artistId: shift.artistId,
          dayOfWeek: shift.dayOfWeek,
          timeRange: `${shift.startTime} - ${shift.endTime}`,
        },
      },
    });

    return shift;
  }

  async getShiftsForArtist(artistId: string): Promise<WorkingShift[]> {
    return this.prisma.workingShift.findMany({
      where: { artistId, isActive: true },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  /**
   * Register artist leave / time-off
   */
  async createLeave(
    input: CreateArtistLeaveInput,
    actorStaffId?: string
  ): Promise<ArtistLeave> {
    const startDate = new Date(input.startDate);
    const endDate = new Date(input.endDate);

    if (endDate <= startDate) {
      throw new BadRequestException('تاریخ پایان مرخصی باید پس از تاریخ شروع باشد.');
    }

    const leave = await this.prisma.artistLeave.create({
      data: {
        artistId: input.artistId,
        startDate,
        endDate,
        reason: input.reason,
        isApproved: input.isApproved ?? true,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        staffId: actorStaffId,
        eventType: SecurityEventType.LEAVE_CONFIGURED,
        details: {
          leaveId: leave.id,
          artistId: leave.artistId,
          start: leave.startDate.toISOString(),
          end: leave.endDate.toISOString(),
          reason: leave.reason,
        },
      },
    });

    return leave;
  }

  /**
   * Configure service phases (atomic replacement)
   */
  async configureServicePhases(
    serviceId: string,
    phases: CreateServicePhaseInput[],
    actorStaffId?: string
  ): Promise<ServicePhase[]> {
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
    });
    if (!service) {
      throw new NotFoundException('خدمت مورد نظر یافت نشد.');
    }

    if (phases.length === 0) {
      throw new BadRequestException('حداقل یک مرحله برای خدمت باید تعریف شود.');
    }

    const totalDuration = phases.reduce((acc, p) => acc + p.durationMinutes, 0);

    return this.prisma.$transaction(async (tx) => {
      // Remove old phases
      await tx.servicePhase.deleteMany({
        where: { serviceId },
      });

      // Insert new phases
      const createdPhases: ServicePhase[] = [];
      for (const p of phases) {
        const created = await tx.servicePhase.create({
          data: {
            serviceId,
            name: p.name,
            sequenceOrder: p.sequenceOrder,
            durationMinutes: p.durationMinutes,
            isPause: p.isPause ?? false,
            resourceId: p.resourceId ?? null,
            resourceUnits: p.resourceUnits ?? 1,
            setupBufferMinutes: p.setupBufferMinutes ?? 0,
            cleanupBufferMinutes: p.cleanupBufferMinutes ?? 0,
          },
        });
        createdPhases.push(created);
      }

      // Update overall service duration to match sum of phase durations
      await tx.service.update({
        where: { id: serviceId },
        data: { durationMinutes: totalDuration },
      });

      // Detect impact on existing future bookings if new duration exceeds previously scheduled window
      const futureBookings = await tx.serviceBooking.findMany({
        where: {
          serviceId,
          startTime: { gte: new Date() },
          status: { in: [BookingStatus.CONFIRMED, BookingStatus.PENDING] },
        },
      });

      for (const b of futureBookings) {
        const bookedDuration = (b.endTime.getTime() - b.startTime.getTime()) / (60 * 1000);
        if (totalDuration > bookedDuration) {
          await tx.serviceBooking.update({
            where: { id: b.id },
            data: {
              isImpacted: true,
              impactReason: `افزایش مدت زمان استاندارد خدمت یا تغییر مراحل (مدت قبلی: ${bookedDuration} دقیقه، مدت جدید: ${totalDuration} دقیقه)`,
            },
          });
        }
      }

      await tx.auditLog.create({
        data: {
          staffId: actorStaffId,
          eventType: SecurityEventType.SERVICE_PHASES_CONFIGURED,
          details: {
            serviceId,
            phaseCount: phases.length,
            totalDuration,
          },
        },
      });

      return createdPhases;
    });
  }

  /**
   * Create an appointment booking with atomic row-level locks and capacity enforcement
   */
  async createBooking(data: {
    serviceId: string;
    artistId: string;
    customerName: string;
    customerPhone?: string;
    startTime: Date;
    endTime: Date;
    allocations?: {
      resourceId: string;
      phaseOrder: number;
      startTime: Date;
      endTime: Date;
      unitsUsed?: number;
    }[];
  }): Promise<ServiceBooking> {
    return this.prisma.$transaction(async (tx) => {
      // 1. Lock artist profile row to serialize concurrent bookings for this artist
      await tx.$queryRaw`SELECT id FROM "ArtistProfile" WHERE id = ${data.artistId} FOR UPDATE`;

      const artistOverlaps = await tx.serviceBooking.findMany({
        where: {
          artistId: data.artistId,
          status: { in: [BookingStatus.CONFIRMED, BookingStatus.PENDING] },
          startTime: { lt: data.endTime },
          endTime: { gt: data.startTime },
        },
      });

      if (artistOverlaps.length > 0) {
        throw new ConflictException('آرتیست در این بازه زمانی نوبت رزروشده دارد.');
      }

      // 2. Lock each shared resource row and enforce real capacity
      if (data.allocations && data.allocations.length > 0) {
        for (const alloc of data.allocations) {
          const resLock: any = await tx.$queryRaw`SELECT id, capacity FROM "SharedResource" WHERE id = ${alloc.resourceId} FOR UPDATE`;
          if (!resLock || resLock.length === 0) {
            throw new NotFoundException('منبع مشترک یافت نشد.');
          }

          const capacity = resLock[0].capacity;

          const overlapping = await tx.serviceBookingResourceAllocation.findMany({
            where: {
              resourceId: alloc.resourceId,
              startTime: { lt: alloc.endTime },
              endTime: { gt: alloc.startTime },
            },
          });

          const currentUsed = overlapping.reduce((sum, a) => sum + a.unitsUsed, 0);
          const needed = alloc.unitsUsed ?? 1;

          if (currentUsed + needed > capacity) {
            throw new ConflictException('ظرفیت منبع مشترک در این بازه تکمیل شده است.');
          }
        }
      }

      // 3. Create booking and allocations atomically
      const booking = await tx.serviceBooking.create({
        data: {
          serviceId: data.serviceId,
          artistId: data.artistId,
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          startTime: data.startTime,
          endTime: data.endTime,
          status: BookingStatus.CONFIRMED,
        },
      });

      if (data.allocations && data.allocations.length > 0) {
        for (const alloc of data.allocations) {
          await tx.serviceBookingResourceAllocation.create({
            data: {
              bookingId: booking.id,
              resourceId: alloc.resourceId,
              phaseOrder: alloc.phaseOrder,
              startTime: alloc.startTime,
              endTime: alloc.endTime,
              unitsUsed: alloc.unitsUsed ?? 1,
            },
          });
        }
      }

      return booking;
    });
  }
}
