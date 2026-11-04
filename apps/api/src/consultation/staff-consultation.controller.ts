import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Staff, StaffRole, ConsultationStatus } from '@salon/database';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentStaff } from '../auth/decorators/current-staff.decorator';
import { ConsultationService } from './consultation.service';
import {
  AssignStaffDto,
  RequestInfoDto,
  PrepareProposalDto,
  CommunicateResultDto,
  ReopenDto,
  CloseDto,
} from './dto/consultation.dto';
import { ConsultationRequestDto } from '@salon/shared';

@Controller('api/admin/consultations')
@UseGuards(AuthGuard, RolesGuard)
export class StaffConsultationController {
  constructor(private readonly consultationService: ConsultationService) {}

  @Get()
  @Roles(StaffRole.MANAGER, StaffRole.RECEPTIONIST, StaffRole.ARTIST)
  async list(
    @Query('status') status?: ConsultationStatus,
    @Query('assignedStaffId') assignedStaffId?: string,
  ): Promise<ConsultationRequestDto[]> {
    return this.consultationService.listStaffRequests({ status, assignedStaffId });
  }

  @Get(':id')
  @Roles(StaffRole.MANAGER, StaffRole.RECEPTIONIST, StaffRole.ARTIST)
  async getOne(@Param('id') id: string): Promise<ConsultationRequestDto> {
    return this.consultationService.getRequestById(id);
  }

  @Post(':id/assign')
  @HttpCode(HttpStatus.OK)
  @Roles(StaffRole.MANAGER, StaffRole.RECEPTIONIST)
  async assign(
    @CurrentStaff() staff: Staff,
    @Param('id') id: string,
    @Body() dto: AssignStaffDto,
  ): Promise<ConsultationRequestDto> {
    return this.consultationService.assignStaff(id, dto.staffId, staff.id, dto.note);
  }

  @Post(':id/request-info')
  @HttpCode(HttpStatus.OK)
  @Roles(StaffRole.MANAGER, StaffRole.RECEPTIONIST, StaffRole.ARTIST)
  async requestInfo(
    @CurrentStaff() staff: Staff,
    @Param('id') id: string,
    @Body() dto: RequestInfoDto,
  ): Promise<ConsultationRequestDto> {
    return this.consultationService.requestInfo(id, staff.id, dto.question);
  }

  @Post(':id/proposal')
  @HttpCode(HttpStatus.OK)
  @Roles(StaffRole.MANAGER, StaffRole.RECEPTIONIST, StaffRole.ARTIST)
  async prepareProposal(
    @CurrentStaff() staff: Staff,
    @Param('id') id: string,
    @Body() dto: PrepareProposalDto,
  ): Promise<ConsultationRequestDto> {
    return this.consultationService.prepareProposal(id, staff.id, dto.proposalDetails, dto.note);
  }

  @Post(':id/communicate-result')
  @HttpCode(HttpStatus.OK)
  @Roles(StaffRole.MANAGER, StaffRole.RECEPTIONIST, StaffRole.ARTIST)
  async communicateResult(
    @CurrentStaff() staff: Staff,
    @Param('id') id: string,
    @Body() dto: CommunicateResultDto,
  ): Promise<ConsultationRequestDto> {
    return this.consultationService.communicateResult(id, staff.id, dto.resultNotes, dto.channel);
  }

  @Post(':id/reopen')
  @HttpCode(HttpStatus.OK)
  @Roles(StaffRole.MANAGER, StaffRole.RECEPTIONIST)
  async reopen(
    @CurrentStaff() staff: Staff,
    @Param('id') id: string,
    @Body() dto: ReopenDto,
  ): Promise<ConsultationRequestDto> {
    return this.consultationService.reopenRequest(id, staff.id, dto.reason, dto.assignedStaffId);
  }

  @Post(':id/close')
  @HttpCode(HttpStatus.OK)
  @Roles(StaffRole.MANAGER, StaffRole.RECEPTIONIST)
  async close(
    @CurrentStaff() staff: Staff,
    @Param('id') id: string,
    @Body() dto: CloseDto,
  ): Promise<ConsultationRequestDto> {
    return this.consultationService.closeWithoutBooking(id, staff.id, dto.note);
  }
}
