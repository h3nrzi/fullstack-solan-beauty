import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { StaffController } from './staff.controller';
import { EmergencyRecoveryController } from './emergency-recovery.controller';
import { StaffAuthService } from './staff-auth.service';
import { SessionService } from './session.service';
import { StaffManagementService } from './staff-management.service';
import { IndependentRecoveryService } from './independent-recovery.service';
import { AuthGuard } from './guards/auth.guard';
import { RolesGuard } from './guards/roles.guard';

@Module({
  controllers: [AuthController, StaffController, EmergencyRecoveryController],
  providers: [
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
export class AuthModule {}
