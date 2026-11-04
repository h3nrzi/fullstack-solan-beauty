import { Module } from '@nestjs/common';
import { PrismaClient } from '@salon/database';
import { PrismaService } from './prisma.service';
import { StaffAuthService } from './auth/staff-auth.service';
import { SessionService } from './auth/session.service';
import { StaffManagementService } from './auth/staff-management.service';
import { IndependentRecoveryService } from './auth/independent-recovery.service';
import { AuthController } from './auth/auth.controller';
import { StaffController } from './auth/staff.controller';
import { EmergencyRecoveryController } from './auth/emergency-recovery.controller';
import { AuthGuard } from './auth/guards/auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';

@Module({
  imports: [],
  controllers: [AuthController, StaffController, EmergencyRecoveryController],
  providers: [
    PrismaService,
    {
      provide: PrismaClient,
      useExisting: PrismaService,
    },
    StaffAuthService,
    SessionService,
    StaffManagementService,
    IndependentRecoveryService,
    AuthGuard,
    RolesGuard,
  ],
  exports: [
    StaffAuthService,
    SessionService,
    StaffManagementService,
    IndependentRecoveryService,
    AuthGuard,
    RolesGuard,
  ],
})
export class AppModule {}
