import { StaffRole } from '@salon/database';

export interface RequestContext {
  ipAddress?: string;
  userAgent?: string;
}

export class LoginDto {
  username!: string;
  password!: string;
}

export class VerifyMfaDto {
  tempToken!: string;
  code!: string;
}

export class VerifyRecoveryCodeDto {
  tempToken!: string;
  recoveryCode!: string;
}

export class EmergencyRecoveryRequestDto {
  targetStaffId!: string;
  requesterNote!: string;
}

export class ApproveEmergencyRecoveryDto {
  requestId!: string;
}

export class ClaimEmergencyRecoveryDto {
  requestId!: string;
  claimToken!: string;
}

export class UpdateStaffRoleDto {
  role!: StaffRole;
  reason!: string;
}
