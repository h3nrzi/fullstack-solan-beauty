import { IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { StaffRole } from '@salon/database';

export interface RequestContext {
  ipAddress?: string;
  userAgent?: string;
}

export class LoginDto {
  @IsString()
  @IsNotEmpty({ message: 'Username is required' })
  username!: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  password!: string;
}

export class VerifyMfaDto {
  @IsString()
  @IsNotEmpty({ message: 'Temporary session token is required' })
  tempToken!: string;

  @IsString()
  @IsNotEmpty({ message: 'MFA verification code is required' })
  code!: string;
}

export class VerifyRecoveryCodeDto {
  @IsString()
  @IsNotEmpty({ message: 'Temporary session token is required' })
  tempToken!: string;

  @IsString()
  @IsNotEmpty({ message: 'Recovery code is required' })
  recoveryCode!: string;
}

export class EmergencyRecoveryRequestDto {
  @IsString()
  @IsNotEmpty({ message: 'Target staff member ID is required' })
  targetStaffId!: string;

  @IsString()
  @IsNotEmpty({ message: 'Reason or note for emergency recovery is required' })
  requesterNote!: string;
}

export class ApproveEmergencyRecoveryDto {
  @IsString()
  @IsNotEmpty({ message: 'Request ID is required' })
  requestId!: string;
}

export class ClaimEmergencyRecoveryDto {
  @IsString()
  @IsNotEmpty({ message: 'Request ID is required' })
  requestId!: string;

  @IsString()
  @IsNotEmpty({ message: 'Claim token is required' })
  claimToken!: string;
}

export class UpdateStaffRoleDto {
  @IsEnum(StaffRole, { message: 'A valid staff role must be specified' })
  role!: StaffRole;

  @IsOptional()
  @IsString()
  reason?: string;
}
