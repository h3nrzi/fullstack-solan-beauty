import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';

export class CreateConsultationDto {
  @IsString()
  @IsOptional()
  serviceId?: string;

  @IsString()
  @IsOptional()
  customServiceTitle?: string;

  @IsString()
  @IsNotEmpty()
  customerNotes!: string;

  @IsString()
  @IsOptional()
  preferredSchedule?: string;
}

export class AssignStaffDto {
  @IsString()
  @IsNotEmpty()
  staffId!: string;

  @IsString()
  @IsOptional()
  note?: string;
}

export class RequestInfoDto {
  @IsString()
  @IsNotEmpty()
  question!: string;
}

export class ProvideInfoDto {
  @IsString()
  @IsNotEmpty()
  answer!: string;
}

export class PrepareProposalDto {
  @IsObject()
  @IsNotEmpty()
  proposalDetails!: Record<string, any>;

  @IsString()
  @IsOptional()
  note?: string;
}

export class CommunicateResultDto {
  @IsString()
  @IsNotEmpty()
  resultNotes!: string;

  @IsString()
  @IsOptional()
  channel?: string;
}

export class ReopenDto {
  @IsString()
  @IsNotEmpty()
  reason!: string;

  @IsString()
  @IsNotEmpty()
  assignedStaffId!: string;
}

export class WithdrawDto {
  @IsString()
  @IsOptional()
  reason?: string;
}

export class CloseDto {
  @IsString()
  @IsOptional()
  note?: string;
}
