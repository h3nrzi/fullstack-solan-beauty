import { Injectable } from '@nestjs/common';
import { PrismaClient, BookingStatus, ServiceBooking } from '@salon/database';
import {
  CreateArtistLeaveInput,
  RuleImpactResultDto,
  SecurityEventType,
  ImpactedBookingDto,
} from '@salon/shared';

@Injectable()
export class ImpactDetectionService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Helper to map a raw booking record to a standardized ImpactedBookingDto
   */
  private mapToImpactedDto(
    booking: ServiceBooking & {
      service?: { name: string } | null;
      artist?: { staff?: { fullName: string } | null } | null;
    }
  ): ImpactedBookingDto {
    return {
      id: booking.id,
      serviceId: booking.serviceId,
      serviceName: booking.service?.name,
      artistId: booking.artistId,
      artistName: booking.artist?.staff?.fullName,
      customerName: booking.customerName,
      customerPhone: booking.customerPhone,
      startTime: booking.startTime,
      endTime: booking.endTime,
      status: booking.status as BookingStatus,
      isImpacted: booking.isImpacted,
      impactReason: booking.impactReason,
    };
  }

  /**
   * Applies an artist leave and surfaces any conflicting bookings without deleting or rewriting them.
   */
  async applyLeaveAndDetectImpact(
    input: CreateArtistLeaveInput,
    actorStaffId?: string
  ): Promise<RuleImpactResultDto> {
    const startDate = new Date(input.startDate);
    const endDate = new Date(input.endDate);

    return this.prisma.$transaction(async (tx) => {
      // 1. Create the leave record
      const leave = await tx.artistLeave.create({
        data: {
          artistId: input.artistId,
          startDate,
          endDate,
          reason: input.reason,
          isApproved: input.isApproved ?? true,
        },
      });

      // 2. Find overlapping bookings for this artist
      const overlappingBookings = await tx.serviceBooking.findMany({
        where: {
          artistId: input.artistId,
          status: { in: [BookingStatus.CONFIRMED, BookingStatus.PENDING] },
          startTime: { lt: endDate },
          endTime: { gt: startDate },
        },
        include: {
          service: true,
          artist: { include: { staff: true } },
        },
      });

      const impactedBookings: ImpactedBookingDto[] = [];

      for (const booking of overlappingBookings) {
        const updated = await tx.serviceBooking.update({
          where: { id: booking.id },
          data: {
            isImpacted: true,
            impactReason: `تداخل با مرخصی ثبت‌شده آرتیست (${input.reason || 'بدون ذکر دلیل'})`,
          },
          include: {
            service: true,
            artist: { include: { staff: true } },
          },
        });

        impactedBookings.push(this.mapToImpactedDto(updated));
      }

      // 3. Write Audit Log
      await tx.auditLog.create({
        data: {
          staffId: actorStaffId,
          eventType: SecurityEventType.SCHEDULE_RULE_CHANGED,
          details: {
            action: 'LEAVE_REGISTERED',
            leaveId: leave.id,
            artistId: input.artistId,
            impactedBookingIds: impactedBookings.map((b) => b.id),
            impactedCount: impactedBookings.length,
          },
        },
      });

      return {
        ruleChange: 'LEAVE_REGISTERED',
        impactedCount: impactedBookings.length,
        impactedBookings,
      };
    });
  }

  /**
   * Modifies resource capacity and detects overbooked allocations without destructive writes.
   */
  async updateResourceCapacityAndDetectImpact(
    resourceId: string,
    newCapacity: number,
    actorStaffId?: string
  ): Promise<RuleImpactResultDto> {
    return this.prisma.$transaction(async (tx) => {
      // 1. Update resource capacity
      const resource = await tx.sharedResource.update({
        where: { id: resourceId },
        data: { capacity: newCapacity },
      });

      // 2. Fetch all future active allocations for this resource
      const futureAllocations = await tx.serviceBookingResourceAllocation.findMany({
        where: {
          resourceId,
          endTime: { gte: new Date() },
          booking: { status: { in: [BookingStatus.CONFIRMED, BookingStatus.PENDING] } },
        },
        include: {
          booking: {
            include: {
              service: true,
              artist: { include: { staff: true } },
            },
          },
        },
        orderBy: { startTime: 'asc' },
      });

      // Check each allocation for concurrency overflow
      const impactedBookingsMap = new Map<string, ImpactedBookingDto>();

      for (const alloc of futureAllocations) {
        const overlapping = futureAllocations.filter(
          (other) =>
            other.id !== alloc.id &&
            other.startTime < alloc.endTime &&
            other.endTime > alloc.startTime
        );

        const totalConcurrentUnits = alloc.unitsUsed + overlapping.reduce((sum, o) => sum + o.unitsUsed, 0);

        if (totalConcurrentUnits > newCapacity) {
          if (!impactedBookingsMap.has(alloc.booking.id)) {
            const updated = await tx.serviceBooking.update({
              where: { id: alloc.booking.id },
              data: {
                isImpacted: true,
                impactReason: `تجاوز تقاضا از ظرفیت جدید منبع (${resource.name} - ظرفیت جدید: ${newCapacity})`,
              },
              include: {
                service: true,
                artist: { include: { staff: true } },
              },
            });

            impactedBookingsMap.set(alloc.booking.id, this.mapToImpactedDto(updated));
          }
        }
      }

      const impactedBookings = Array.from(impactedBookingsMap.values());

      // 3. Write Audit Log
      await tx.auditLog.create({
        data: {
          staffId: actorStaffId,
          eventType: SecurityEventType.SCHEDULE_RULE_CHANGED,
          details: {
            action: 'RESOURCE_CAPACITY_REDUCED',
            resourceId,
            newCapacity,
            impactedBookingIds: impactedBookings.map((b) => b.id),
            impactedCount: impactedBookings.length,
          },
        },
      });

      return {
        ruleChange: 'RESOURCE_CAPACITY_REDUCED',
        impactedCount: impactedBookings.length,
        impactedBookings,
      };
    });
  }

  /**
   * Detects impacts on existing bookings when service phases or buffers are modified
   */
  async detectPhaseChangeImpact(
    serviceId: string,
    newDurationMinutes: number,
    actorStaffId?: string
  ): Promise<RuleImpactResultDto> {
    return this.prisma.$transaction(async (tx) => {
      // Find all upcoming bookings for this service
      const futureBookings = await tx.serviceBooking.findMany({
        where: {
          serviceId,
          startTime: { gte: new Date() },
          status: { in: [BookingStatus.CONFIRMED, BookingStatus.PENDING] },
        },
        include: {
          service: true,
          artist: { include: { staff: true } },
        },
      });

      const impactedBookings: ImpactedBookingDto[] = [];

      for (const booking of futureBookings) {
        const bookedDuration = (booking.endTime.getTime() - booking.startTime.getTime()) / (60 * 1000);
        // If the new required duration exceeds the previously allocated duration:
        if (newDurationMinutes > bookedDuration) {
          const updated = await tx.serviceBooking.update({
            where: { id: booking.id },
            data: {
              isImpacted: true,
              impactReason: `افزایش مدت زمان استاندارد خدمت (مدت قبلی: ${bookedDuration} دقیقه، مدت جدید: ${newDurationMinutes} دقیقه)`,
            },
            include: {
              service: true,
              artist: { include: { staff: true } },
            },
          });
          impactedBookings.push(this.mapToImpactedDto(updated));
        }
      }

      if (impactedBookings.length > 0) {
        await tx.auditLog.create({
          data: {
            staffId: actorStaffId,
            eventType: SecurityEventType.SCHEDULE_RULE_CHANGED,
            details: {
              action: 'SERVICE_PHASES_MODIFIED',
              serviceId,
              newDurationMinutes,
              impactedBookingIds: impactedBookings.map((b) => b.id),
              impactedCount: impactedBookings.length,
            },
          },
        });
      }

      return {
        ruleChange: 'SERVICE_PHASES_MODIFIED',
        impactedCount: impactedBookings.length,
        impactedBookings,
      };
    });
  }
}
