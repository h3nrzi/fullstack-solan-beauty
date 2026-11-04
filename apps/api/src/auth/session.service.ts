import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaClient, SecurityEventType, Session, Staff } from '@salon/database';
import * as crypto from 'crypto';
import { RequestContext } from './dto/auth.dto';

export interface ValidatedSession {
  staff: Staff;
  session: Session;
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

  async revokeSession(sessionToken: string, context?: RequestContext): Promise<void> {
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
          ipAddress: context?.ipAddress,
        },
      });
    }
  }

  async revokeAllStaffSessions(staffId: string, revokedByStaffId?: string, context?: RequestContext): Promise<number> {
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
        ipAddress: context?.ipAddress,
      },
    });

    return result.count;
  }
}
