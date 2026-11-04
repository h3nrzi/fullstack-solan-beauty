import { Controller, Get, Post, Patch, Param, Body, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { Request } from 'express';
import { StaffRole, Staff } from '@salon/database';
import { AuthGuard } from './guards/auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { CurrentStaff } from './decorators/current-staff.decorator';
import { SessionService } from './session.service';

@Controller('api/staff')
@UseGuards(AuthGuard, RolesGuard)
export class StaffController {
  constructor(private readonly sessionService: SessionService) {}

  @Get('me')
  async getMe(@CurrentStaff() staff: Staff) {
    return {
      id: staff.id,
      username: staff.username,
      fullName: staff.fullName,
      role: staff.role,
      isActive: staff.isActive,
    };
  }

  @Post(':id/revoke-sessions')
  @HttpCode(HttpStatus.OK)
  @Roles(StaffRole.MANAGER)
  async revokeStaffSessions(
    @Param('id') targetStaffId: string,
    @CurrentStaff('id') managerStaffId: string,
    @Req() req: Request
  ) {
    const revokedCount = await this.sessionService.revokeAllStaffSessions(
      targetStaffId,
      managerStaffId,
      req.ip
    );
    return {
      message: 'Staff sessions revoked successfully',
      targetStaffId,
      revokedCount,
    };
  }

  @Patch(':id/role')
  @Roles(StaffRole.MANAGER)
  async updateStaffRole(
    @Param('id') targetStaffId: string,
    @Body('role') newRole: StaffRole,
    @Body('reason') reason: string,
    @CurrentStaff('id') managerStaffId: string,
    @Req() req: Request
  ) {
    const updatedStaff = await this.sessionService.changeStaffRole(
      {
        targetStaffId,
        newRole,
        changedByStaffId: managerStaffId,
        reason,
      },
      req.ip
    );

    return {
      message: 'Staff role updated successfully',
      staff: {
        id: updatedStaff.id,
        username: updatedStaff.username,
        role: updatedStaff.role,
      },
    };
  }
}
