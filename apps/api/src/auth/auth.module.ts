import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { StaffController } from './staff.controller';
import { EmergencyRecoveryController } from './emergency-recovery.controller';
import { CustomerController } from './customer.controller';
import { StaffAuthService } from './staff-auth.service';
import { SessionService } from './session.service';
import { StaffManagementService } from './staff-management.service';
import { IndependentRecoveryService } from './independent-recovery.service';
import { CustomerAuthService, DefaultSmsService, SMS_SERVICE } from './customer-auth.service';
import { AuthGuard } from './guards/auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { CustomerAuthGuard } from './guards/customer-auth.guard';

@Module({
  controllers: [
    AuthController,
    StaffController,
    EmergencyRecoveryController,
    CustomerController,
  ],
  providers: [
    StaffAuthService,
    SessionService,
    StaffManagementService,
    IndependentRecoveryService,
    CustomerAuthService,
    CustomerAuthGuard,
    {
      provide: SMS_SERVICE,
      useClass: DefaultSmsService,
    },
    AuthGuard,
    RolesGuard,
  ],
  exports: [
    StaffAuthService,
    SessionService,
    StaffManagementService,
    IndependentRecoveryService,
    CustomerAuthService,
    CustomerAuthGuard,
    SMS_SERVICE,
    AuthGuard,
    RolesGuard,
  ],
})
export class AuthModule {}
