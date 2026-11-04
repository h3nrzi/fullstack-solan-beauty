import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaClient, BookingStatus } from '@salon/database';
import { AvailableSlotDto } from '@salon/shared';

export interface CalculateSlotsQuery {
  serviceId: string;
  date: string; // YYYY-MM-DD
  artistId?: string;
  now?: Date;
  stepMinutes?: number;
}

@Injectable()
export class CapacityService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Maps a JavaScript UTC day (0=Sunday..6=Saturday) to Persian calendar dayOfWeek
   * 0=Saturday (Shanbeh) .. 6=Friday (Jomeh)
   */
  private getPersianDayOfWeek(date: Date): number {
    return (date.getUTCDay() + 1) % 7;
  }

  /**
   * Parses time string "HH:mm" into minutes since start of day
   */
  private timeToMinutes(timeStr: string): number {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  }

  /**
   * Checks if an artist is available for a given time window.
   * Note: The artist is considered busy for the ENTIRE duration (Story 6, 35).
   */
  async isArtistAvailable(artistId: string, startTime: Date, endTime: Date): Promise<boolean> {
    const dayOfWeek = this.getPersianDayOfWeek(startTime);
    const startMins = startTime.getUTCHours() * 60 + startTime.getUTCMinutes();
    const endMins = endTime.getUTCHours() * 60 + endTime.getUTCMinutes();

    // 1. Check Shift Coverage
    const shifts = await this.prisma.workingShift.findMany({
      where: {
        artistId,
        isActive: true,
        OR: [
          { dayOfWeek, specificDate: null },
          {
            specificDate: {
              gte: new Date(Date.UTC(startTime.getUTCFullYear(), startTime.getUTCMonth(), startTime.getUTCDate())),
              lt: new Date(Date.UTC(startTime.getUTCFullYear(), startTime.getUTCMonth(), startTime.getUTCDate() + 1)),
            },
          },
        ],
      },
    });

    if (shifts.length === 0) {
      return false;
    }

    const coversShift = shifts.some((s) => {
      const sStart = this.timeToMinutes(s.startTime);
      const sEnd = this.timeToMinutes(s.endTime);
      return startMins >= sStart && endMins <= sEnd;
    });

    if (!coversShift) {
      return false;
    }

    // 2. Check Leaves / Time-off
    const leaves = await this.prisma.artistLeave.findMany({
      where: {
        artistId,
        isApproved: true,
        startDate: { lt: endTime },
        endDate: { gt: startTime },
      },
    });

    if (leaves.length > 0) {
      return false;
    }

    // 3. Check Overlapping Bookings
    const overlappingBookings = await this.prisma.serviceBooking.findMany({
      where: {
        artistId,
        status: { in: [BookingStatus.CONFIRMED, BookingStatus.PENDING] },
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
    });

    return overlappingBookings.length === 0;
  }

  /**
   * Checks if a shared resource has sufficient remaining capacity during a time window
   */
  async isResourceAvailable(
    resourceId: string,
    startTime: Date,
    endTime: Date,
    neededUnits = 1
  ): Promise<boolean> {
    const resource = await this.prisma.sharedResource.findUnique({
      where: { id: resourceId },
    });

    if (!resource || !resource.isActive) {
      return false;
    }

    // Find all overlapping allocations
    const overlappingAllocations = await this.prisma.serviceBookingResourceAllocation.findMany({
      where: {
        resourceId,
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
    });

    const usedUnits = overlappingAllocations.reduce((acc, alloc) => acc + alloc.unitsUsed, 0);
    return usedUnits + neededUnits <= resource.capacity;
  }

  /**
   * Calculate available time slots for a single service on a target date.
   * Strictly read-only; does not commit capacity or lock slots.
   */
  async calculateAvailableSlots(query: CalculateSlotsQuery): Promise<AvailableSlotDto[]> {
    const now = query.now ?? new Date();
    const stepMinutes = query.stepMinutes ?? 30;

    // Minimum lead time: 120 minutes (2 hours)
    const minBookingTime = new Date(now.getTime() + 120 * 60 * 1000);
    // Maximum booking horizon: 60 days (1440 hours)
    const maxBookingTime = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

    // Fetch Service & Phases
    const service = await this.prisma.service.findUnique({
      where: { id: query.serviceId },
      include: {
        phases: {
          orderBy: { sequenceOrder: 'asc' },
          include: { resource: true },
        },
      },
    });

    if (!service || !service.isPublished) {
      throw new BadRequestException('خدمت معتبر یافت نشد.');
    }

    const phases = service.phases.length > 0
      ? service.phases
      : [
          {
            id: 'default',
            serviceId: service.id,
            name: service.name,
            sequenceOrder: 1,
            durationMinutes: service.durationMinutes ?? 60,
            isPause: false,
            resourceId: null,
            resource: null,
            resourceUnits: 1,
            setupBufferMinutes: 0,
            cleanupBufferMinutes: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ];

    const totalDurationMinutes = phases.reduce((acc, p) => acc + p.durationMinutes, 0);

    // Fetch qualified artists
    const artistQuery: {
      id?: string;
      staff: { isActive: boolean };
      tariffs: { some: { serviceId: string; isActive: boolean } };
    } = {
      staff: { isActive: true },
      tariffs: {
        some: {
          serviceId: service.id,
          isActive: true,
        },
      },
    };

    if (query.artistId) {
      artistQuery.id = query.artistId;
    }

    const artists = await this.prisma.artistProfile.findMany({
      where: artistQuery,
      include: { staff: true },
    });

    if (artists.length === 0) {
      return [];
    }

    // Parse target date (UTC midnight)
    const [year, month, day] = query.date.split('-').map(Number);
    const availableSlots: AvailableSlotDto[] = [];

    // Evaluate candidate start times throughout the day (08:00 to 19:00 UTC)
    // In actual salon hours this spans the operating schedule.
    for (let minute = 8 * 60; minute <= 19 * 60; minute += stepMinutes) {
      const slotHours = Math.floor(minute / 60);
      const slotMins = minute % 60;
      const slotStart = new Date(Date.UTC(year, month - 1, day, slotHours, slotMins, 0, 0));
      const slotEnd = new Date(slotStart.getTime() + totalDurationMinutes * 60 * 1000);

      // Check lead time constraints
      if (slotStart < minBookingTime || slotStart > maxBookingTime) {
        continue;
      }

      // Check each qualified artist for this slot
      for (const artist of artists) {
        // 1. Is artist available for the entire duration?
        const artistFree = await this.isArtistAvailable(artist.id, slotStart, slotEnd);
        if (!artistFree) {
          continue;
        }

        // 2. Are shared resources available for all phases?
        let phaseOffset = 0;
        let allPhasesAvailable = true;
        const phaseDetails: AvailableSlotDto['phaseDetails'] = [];

        for (const phase of phases) {
          const phaseStart = new Date(slotStart.getTime() + phaseOffset * 60 * 1000);
          const phaseEnd = new Date(phaseStart.getTime() + phase.durationMinutes * 60 * 1000);

          if (phase.resourceId) {
            const resWindowStart = new Date(phaseStart.getTime() - phase.setupBufferMinutes * 60 * 1000);
            const resWindowEnd = new Date(phaseEnd.getTime() + phase.cleanupBufferMinutes * 60 * 1000);

            const resourceFree = await this.isResourceAvailable(
              phase.resourceId,
              resWindowStart,
              resWindowEnd,
              phase.resourceUnits
            );

            if (!resourceFree) {
              allPhasesAvailable = false;
              break;
            }
          }

          phaseDetails.push({
            phaseOrder: phase.sequenceOrder,
            phaseName: phase.name,
            isPause: phase.isPause,
            startTime: phaseStart.toISOString(),
            endTime: phaseEnd.toISOString(),
            resourceName: phase.resource?.name ?? null,
          });

          phaseOffset += phase.durationMinutes;
        }

        if (allPhasesAvailable) {
          availableSlots.push({
            startTime: slotStart.toISOString(),
            endTime: slotEnd.toISOString(),
            artistId: artist.id,
            artistName: artist.staff.fullName,
            serviceId: service.id,
            serviceName: service.name,
            totalDurationMinutes,
            phaseDetails,
          });
        }
      }
    }

    return availableSlots;
  }
}
