import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { StaffRole } from '@salon/database';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ScheduleManagementService } from './schedule-management.service';
import { ImpactDetectionService } from './impact-detection.service';
import {
  CreateSharedResourceDto,
  UpdateResourceCapacityDto,
  CreateWorkingShiftDto,
  CreateArtistLeaveDto,
  ConfigureServicePhasesDto,
} from './dto/schedule.dto';

@Controller('api/admin/schedule')
@UseGuards(AuthGuard, RolesGuard)
export class AdminScheduleController {
  constructor(
    private readonly scheduleService: ScheduleManagementService,
    private readonly impactService: ImpactDetectionService
  ) {}

  @Post('resources')
  @Roles(StaffRole.MANAGER)
  @HttpCode(HttpStatus.CREATED)
  async createResource(@Body() body: CreateSharedResourceDto, @Req() req: any) {
    return this.scheduleService.createResource(body, req.staff.id);
  }

  @Get('resources')
  @Roles(StaffRole.MANAGER, StaffRole.RECEPTIONIST)
  async listResources() {
    return this.scheduleService.listResources();
  }

  @Patch('resources/:id/capacity')
  @Roles(StaffRole.MANAGER)
  async updateResourceCapacity(
    @Param('id') resourceId: string,
    @Body() body: UpdateResourceCapacityDto,
    @Req() req: any
  ) {
    return this.impactService.updateResourceCapacityAndDetectImpact(
      resourceId,
      body.capacity,
      req.staff.id
    );
  }

  @Post('shifts')
  @Roles(StaffRole.MANAGER)
  @HttpCode(HttpStatus.CREATED)
  async createShift(@Body() body: CreateWorkingShiftDto, @Req() req: any) {
    return this.scheduleService.createShift(body, req.staff.id);
  }

  @Get('shifts/artist/:artistId')
  @Roles(StaffRole.MANAGER, StaffRole.RECEPTIONIST)
  async getArtistShifts(@Param('artistId') artistId: string) {
    return this.scheduleService.getShiftsForArtist(artistId);
  }

  @Post('leaves')
  @Roles(StaffRole.MANAGER)
  @HttpCode(HttpStatus.CREATED)
  async createLeave(@Body() body: CreateArtistLeaveDto, @Req() req: any) {
    return this.impactService.applyLeaveAndDetectImpact(body, req.staff.id);
  }

  @Post('services/:serviceId/phases')
  @Roles(StaffRole.MANAGER)
  @HttpCode(HttpStatus.CREATED)
  async configureServicePhases(
    @Param('serviceId') serviceId: string,
    @Body() body: ConfigureServicePhasesDto,
    @Req() req: any
  ) {
    return this.scheduleService.configureServicePhases(serviceId, body.phases, req.staff.id);
  }

  @Get('impacted-bookings')
  @Roles(StaffRole.MANAGER, StaffRole.RECEPTIONIST)
  async listImpactedBookings() {
    return this.scheduleService.listImpactedBookings();
  }
}
