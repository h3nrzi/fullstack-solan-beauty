import { Controller, Post, Body, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { Request } from 'express';
import { StaffRole } from '@salon/database';
import { IndependentRecoveryService } from './independent-recovery.service';
import { AuthGuard } from './guards/auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { CurrentStaff } from './decorators/current-staff.decorator';
import {
  EmergencyRecoveryRequestDto,
  ApproveEmergencyRecoveryDto,
  ClaimEmergencyRecoveryDto,
} from './dto/auth.dto';

@Controller('api/staff/emergency-recovery')
export class EmergencyRecoveryController {
  constructor(private readonly recoveryService: IndependentRecoveryService) {}

  @Post('request')
  @HttpCode(HttpStatus.CREATED)
  async createRequest(@Body() body: EmergencyRecoveryRequestDto, @Req() req: Request) {
    return await this.recoveryService.createRecoveryRequest(
      {
        targetStaffId: body.targetStaffId,
        requesterNote: body.requesterNote,
      },
      {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      }
    );
  }

  @Post('approve')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(StaffRole.MANAGER)
  async approveRequest(
    @Body() body: ApproveEmergencyRecoveryDto,
    @CurrentStaff('id') approverStaffId: string,
    @Req() req: Request
  ) {
    return await this.recoveryService.approveRecoveryRequest(
      {
        requestId: body.requestId,
        approverStaffId,
      },
      {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      }
    );
  }

  @Post('claim')
  @HttpCode(HttpStatus.OK)
  async claimRecovery(@Body() body: ClaimEmergencyRecoveryDto, @Req() req: Request) {
    return await this.recoveryService.claimRecovery(
      body.requestId,
      body.claimToken,
      {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      }
    );
  }

  @Post('reject')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(StaffRole.MANAGER)
  async rejectRequest(
    @Body('requestId') requestId: string,
    @Body('reason') reason: string,
    @CurrentStaff('id') approverStaffId: string,
    @Req() req: Request
  ) {
    await this.recoveryService.rejectRecoveryRequest(
      requestId,
      approverStaffId,
      reason,
      {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      }
    );
    return { message: 'Emergency recovery request rejected' };
  }
}
