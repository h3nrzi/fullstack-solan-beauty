import { Module } from '@nestjs/common';
import { ScheduleManagementService } from './schedule-management.service';
import { CapacityService } from './capacity.service';
import { ImpactDetectionService } from './impact-detection.service';
import { AdminScheduleController } from './admin-schedule.controller';
import { PublicCapacityController } from './public-capacity.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [AdminScheduleController, PublicCapacityController],
  providers: [ScheduleManagementService, CapacityService, ImpactDetectionService],
  exports: [ScheduleManagementService, CapacityService, ImpactDetectionService],
})
export class ScheduleModule {}
