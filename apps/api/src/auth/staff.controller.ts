import { Controller, Get, Post, Patch, Param, Body, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { Request } from 'express';
import { StaffRole, Staff } from '@salon/database';
import { AuthGuard } from './guards/auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { CurrentStaff } from './decorators/current-staff.decorator';
import { SessionService } from './session.service';
import { StaffManagementService } from './staff-management.service';
import { UpdateStaffRoleDto } from './dto/auth.dto';

@Controller('api/staff')
@UseGuards(AuthGuard, RolesGuard)
export class StaffController {
  constructor(
    private readonly sessionService: SessionService,
    private readonly staffManagementService: StaffManagementService
  ) {}

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

  @Get()
  @Roles(StaffRole.MANAGER)
  async listStaff() {
    return await this.staffManagementService.listStaff();
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
      {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      }
    );
    return {
      message: 'Staff sessions revoked successfully',
      targetStaffId,
      revokedCount,
    };
  }

  @Patch(':id/role')
  @HttpCode(HttpStatus.OK)
  @Roles(StaffRole.MANAGER)
  async updateStaffRole(
    @Param('id') targetStaffId: string,
    @Body() body: UpdateStaffRoleDto,
    @CurrentStaff('id') managerStaffId: string,
    @Req() req: Request
  ) {
    const updatedStaff = await this.staffManagementService.changeStaffRole(
      {
        targetStaffId,
        newRole: body.role,
        changedByStaffId: managerStaffId,
        reason: body.reason,
      },
      {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      }
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
