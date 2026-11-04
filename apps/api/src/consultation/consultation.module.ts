import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ConsultationService } from './consultation.service';
import { CustomerConsultationController } from './customer-consultation.controller';
import { StaffConsultationController } from './staff-consultation.controller';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [CustomerConsultationController, StaffConsultationController],
  providers: [ConsultationService],
  exports: [ConsultationService],
})
export class ConsultationModule {}
