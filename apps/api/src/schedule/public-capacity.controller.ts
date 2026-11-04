import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { CapacityService } from './capacity.service';
import { ScheduleManagementService } from './schedule-management.service';

@Controller('api/public/capacity')
export class PublicCapacityController {
  constructor(
    private readonly capacityService: CapacityService,
    private readonly scheduleService: ScheduleManagementService
  ) {}

  @Get('slots')
  async getAvailableSlots(
    @Query('serviceId') serviceId: string,
    @Query('date') date: string,
    @Query('artistId') artistId?: string
  ) {
    if (!serviceId) {
      throw new BadRequestException('شناسه خدمت الزامی است.');
    }
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new BadRequestException('تاریخ نامعتبر است (فرمت مجاز: YYYY-MM-DD).');
    }

    return this.capacityService.calculateAvailableSlots({
      serviceId,
      date,
      artistId,
    });
  }

  @Get('resources')
  async getPublicResources() {
    return this.scheduleService.listResources();
  }
}
