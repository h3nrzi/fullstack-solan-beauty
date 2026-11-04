import {
  CreateSharedResourceInput,
  CreateWorkingShiftInput,
  CreateArtistLeaveInput,
} from '@salon/shared';

export class CreateSharedResourceDto implements CreateSharedResourceInput {
  name!: string;
  capacity!: number;
  description?: string;
  isActive?: boolean;
}

export class UpdateResourceCapacityDto {
  capacity!: number;
}

export class CreateWorkingShiftDto implements CreateWorkingShiftInput {
  artistId!: string;
  dayOfWeek!: number;
  startTime!: string;
  endTime!: string;
  isActive?: boolean;
  specificDate?: string;
}

export class CreateArtistLeaveDto implements CreateArtistLeaveInput {
  artistId!: string;
  startDate!: string;
  endDate!: string;
  reason?: string;
  isApproved?: boolean;
}

export class ConfigureServicePhasesDto {
  phases!: {
    name: string;
    sequenceOrder: number;
    durationMinutes: number;
    isPause?: boolean;
    resourceId?: string;
    resourceUnits?: number;
    setupBufferMinutes?: number;
    cleanupBufferMinutes?: number;
  }[];
}
