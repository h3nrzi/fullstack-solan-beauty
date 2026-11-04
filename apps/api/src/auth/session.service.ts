import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { PrismaClient, SecurityEventType, Session, Staff, StaffRole } from '@salon/database';
import * as crypto from 'crypto';

export interface ValidatedSession {
  staff: Staff;
  session: Session;
}

export interface ChangeStaffRoleDto {
  targetStaffId: string;
  newRole: StaffRole;
  changedByStaffId?: string;
  reason?: string;
}

@Injectable()
export class SessionService {
  constructor(private readonly prisma: PrismaClient) {}

  async validateSession(sessionToken: string): Promise<ValidatedSession> {
    if (!sessionToken) {
      throw new UnauthorizedException('Session token missing');
    }

    const tokenHash = crypto.createHash('sha256').update(sessionToken).digest('hex');

    const session = await this.prisma.session.findUnique({
      where: { tokenHash },
      include: { staff: true },
    });

    if (!session || session.revokedAt || new Date() > session.expiresAt) {
      throw new UnauthorizedException('Session revoked or expired');
    }

    if (!session.staff || !session.staff.isActive) {
      throw new UnauthorizedException('Staff account deactivated');
    }

    return {
      staff: session.staff,
      session,
    };
  }

  async revokeSession(sessionToken: string, ipAddress?: string): Promise<void> {
    const tokenHash = crypto.createHash('sha256').update(sessionToken).digest('hex');

    const session = await this.prisma.session.findUnique({
      where: { tokenHash },
    });

    if (session && !session.revokedAt) {
      await this.prisma.session.update({
        where: { id: session.id },
        data: { revokedAt: new Date() },
      });

      await this.prisma.auditLog.create({
        data: {
          staffId: session.staffId,
          eventType: SecurityEventType.SESSION_REVOKED,
          details: { sessionId: session.id, reason: 'LOGOUT' },
          ipAddress,
        },
      });
    }
  }

  async revokeAllStaffSessions(staffId: string, revokedByStaffId?: string, ipAddress?: string): Promise<number> {
    const now = new Date();

    const result = await this.prisma.session.updateMany({
      where: {
        staffId,
        revokedAt: null,
      },
      data: {
        revokedAt: now,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        staffId,
        eventType: SecurityEventType.SESSION_REVOKED,
        details: {
          revokedCount: result.count,
          revokedByStaffId,
          reason: 'ADMIN_REVOCATION',
        },
        ipAddress,
      },
    });

    return result.count;
  }

  async changeStaffRole(dto: ChangeStaffRoleDto, ipAddress?: string): Promise<Staff> {
    const staff = await this.prisma.staff.findUnique({
      where: { id: dto.targetStaffId },
    });

    if (!staff) {
      throw new NotFoundException('Staff member not found');
    }

    const previousRole = staff.role;

    const updatedStaff = await this.prisma.staff.update({
      where: { id: staff.id },
      data: { role: dto.newRole },
    });

    await this.prisma.auditLog.create({
      data: {
        staffId: staff.id,
        eventType: SecurityEventType.ROLE_CHANGED,
        details: {
          previousRole,
          newRole: dto.newRole,
          changedByStaffId: dto.changedByStaffId,
          reason: dto.reason,
        },
        ipAddress,
      },
    });

    return updatedStaff;
  }
}
