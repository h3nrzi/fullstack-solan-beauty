import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient, SecurityEventType, Staff, StaffRole } from '@salon/database';
import { RequestContext } from './dto/auth.dto';

export interface ChangeStaffRoleInput {
  targetStaffId: string;
  newRole: StaffRole;
  changedByStaffId?: string;
  reason?: string;
}

@Injectable()
export class StaffManagementService {
  constructor(private readonly prisma: PrismaClient) {}

  async changeStaffRole(input: ChangeStaffRoleInput, context?: RequestContext): Promise<Staff> {
    const staff = await this.prisma.staff.findUnique({
      where: { id: input.targetStaffId },
    });

    if (!staff) {
      throw new NotFoundException('Staff member not found');
    }

    const previousRole = staff.role;

    const updatedStaff = await this.prisma.staff.update({
      where: { id: staff.id },
      data: { role: input.newRole },
    });

    await this.prisma.auditLog.create({
      data: {
        staffId: staff.id,
        eventType: SecurityEventType.ROLE_CHANGED,
        details: {
          previousRole,
          newRole: input.newRole,
          changedByStaffId: input.changedByStaffId,
          reason: input.reason,
        },
        ipAddress: context?.ipAddress,
      },
    });

    return updatedStaff;
  }

  async listStaff(): Promise<Pick<Staff, 'id' | 'username' | 'fullName' | 'role' | 'isActive'>[]> {
    return await this.prisma.staff.findMany({
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        isActive: true,
      },
    });
  }
}
