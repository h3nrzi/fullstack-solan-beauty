import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { StaffRole } from '@salon/database';
import { IndependentRecoveryService } from './independent-recovery.service';
import { AuthGuard } from './guards/auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { CurrentStaff } from './decorators/current-staff.decorator';

@Controller('api/staff/emergency-recovery')
export class EmergencyRecoveryController {
  constructor(private readonly recoveryService: IndependentRecoveryService) {}

  @Post('request')
  async createRequest(@Body() body: any, @Req() req: Request) {
    return await this.recoveryService.createRecoveryRequest({
      targetStaffId: body.targetStaffId,
      requesterNote: body.requesterNote,
      ipAddress: req.ip,
    });
  }

  @Post('approve')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(StaffRole.MANAGER)
  async approveRequest(
    @Body('requestId') requestId: string,
    @CurrentStaff('id') approverStaffId: string,
    @Req() req: Request
  ) {
    return await this.recoveryService.approveRecoveryRequest({
      requestId,
      approverStaffId,
      ipAddress: req.ip,
    });
  }

  @Post('reject')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(StaffRole.MANAGER)
  async rejectRequest(
    @Body('requestId') requestId: string,
    @Body('reason') reason: string,
    @CurrentStaff('id') approverStaffId: string,
    @Req() req: Request
  ) {
    await this.recoveryService.rejectRecoveryRequest({
      requestId,
      approverStaffId,
      reason,
      ipAddress: req.ip,
    });
    return { message: 'Emergency recovery request rejected' };
  }
}
