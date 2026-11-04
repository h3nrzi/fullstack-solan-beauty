import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaClient, SecurityEventType, Staff } from '@salon/database';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { authenticator } from 'otplib';
import { RequestContext } from './dto/auth.dto';

export interface LoginResult {
  mfaRequired: boolean;
  tempToken?: string;
  staffId: string;
}

export interface AuthSessionResult {
  sessionToken: string;
  staff: Staff;
}

interface MfaChallengePayload {
  staffId: string;
  expiresAt: number;
}

@Injectable()
export class StaffAuthService {
  private static mfaChallenges = new Map<string, MfaChallengePayload>();

  constructor(private readonly prisma: PrismaClient) {}

  async login(username: string, password: string, context?: RequestContext): Promise<LoginResult> {
    const staff = await this.prisma.staff.findUnique({
      where: { username },
    });

    if (!staff || !staff.isActive) {
      await this.prisma.auditLog.create({
        data: {
          eventType: SecurityEventType.LOGIN_FAILED,
          details: { username, reason: 'Staff not found or inactive' },
          ipAddress: context?.ipAddress,
        },
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await argon2.verify(staff.passwordHash, password);
    if (!isPasswordValid) {
      await this.prisma.auditLog.create({
        data: {
          staffId: staff.id,
          eventType: SecurityEventType.LOGIN_FAILED,
          details: { reason: 'Incorrect password' },
          ipAddress: context?.ipAddress,
        },
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    const tempToken = crypto.randomBytes(32).toString('hex');
    StaffAuthService.mfaChallenges.set(tempToken, {
      staffId: staff.id,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
    });

    await this.prisma.auditLog.create({
      data: {
        staffId: staff.id,
        eventType: SecurityEventType.MFA_CHALLENGE,
        details: { tempTokenIssued: true },
        ipAddress: context?.ipAddress,
      },
    });

    return {
      mfaRequired: true,
      tempToken,
      staffId: staff.id,
    };
  }

  async verifyMfa(tempToken: string, code: string, context?: RequestContext): Promise<AuthSessionResult> {
    const challenge = StaffAuthService.getMfaChallenge(tempToken);
    if (!challenge) {
      throw new UnauthorizedException('Invalid or expired MFA session');
    }

    const staff = await this.prisma.staff.findUnique({
      where: { id: challenge.staffId },
    });

    if (!staff || !staff.isActive || !staff.mfaSecret) {
      StaffAuthService.consumeMfaChallenge(tempToken);
      throw new UnauthorizedException('Staff account not active or misconfigured');
    }

    const isValid = authenticator.verify({
      token: code,
      secret: staff.mfaSecret,
    });

    if (!isValid) {
      await this.prisma.auditLog.create({
        data: {
          staffId: staff.id,
          eventType: SecurityEventType.MFA_FAILED,
          details: { reason: 'Incorrect TOTP code' },
          ipAddress: context?.ipAddress,
        },
      });
      throw new UnauthorizedException('Invalid MFA code');
    }

    StaffAuthService.consumeMfaChallenge(tempToken);

    const session = await this.issueSession(this.prisma, staff.id, context);

    await this.prisma.auditLog.create({
      data: {
        staffId: staff.id,
        eventType: SecurityEventType.MFA_SUCCESS,
        details: { method: 'TOTP' },
        ipAddress: context?.ipAddress,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        staffId: staff.id,
        eventType: SecurityEventType.LOGIN_SUCCESS,
        details: { method: 'PASSWORD_AND_MFA' },
        ipAddress: context?.ipAddress,
      },
    });

    return {
      sessionToken: session.sessionToken,
      staff,
    };
  }

  async verifyRecoveryCode(tempToken: string, recoveryCode: string, context?: RequestContext): Promise<AuthSessionResult> {
    const challenge = StaffAuthService.getMfaChallenge(tempToken);
    if (!challenge) {
      throw new UnauthorizedException('Invalid or expired MFA session');
    }

    const hashedCode = crypto.createHash('sha256').update(recoveryCode).digest('hex');

    return await this.prisma.$transaction(async (tx) => {
      const staff = await tx.staff.findUnique({
        where: { id: challenge.staffId },
      });

      if (!staff || !staff.isActive) {
        StaffAuthService.consumeMfaChallenge(tempToken);
        throw new UnauthorizedException('Staff account not active or misconfigured');
      }

      // Atomically burn the recovery code only if it has not been used or revoked yet.
      const updateResult = await tx.recoveryCode.updateMany({
        where: {
          staffId: staff.id,
          codeHash: hashedCode,
          usedAt: null,
          revokedAt: null,
        },
        data: {
          usedAt: new Date(),
        },
      });

      if (updateResult.count === 0) {
        await tx.auditLog.create({
          data: {
            staffId: staff.id,
            eventType: SecurityEventType.MFA_FAILED,
            details: { reason: 'Invalid or already used recovery code' },
            ipAddress: context?.ipAddress,
          },
        });
        throw new UnauthorizedException('Invalid or already used recovery code');
      }

      StaffAuthService.consumeMfaChallenge(tempToken);

      const session = await this.issueSession(tx, staff.id, context);

      await tx.auditLog.create({
        data: {
          staffId: staff.id,
          eventType: SecurityEventType.RECOVERY_CODE_USED,
          details: { codeHash: hashedCode },
          ipAddress: context?.ipAddress,
        },
      });

      await tx.auditLog.create({
        data: {
          staffId: staff.id,
          eventType: SecurityEventType.LOGIN_SUCCESS,
          details: { method: 'RECOVERY_CODE' },
          ipAddress: context?.ipAddress,
        },
      });

      return {
        sessionToken: session.sessionToken,
        staff,
      };
    });
  }

  /**
   * Helper to issue session and store SHA-256 hash in DB, avoiding code duplication.
   */
  private async issueSession(
    dbClient: any,
    staffId: string,
    context?: RequestContext
  ): Promise<{ sessionToken: string }> {
    const sessionToken = crypto.randomBytes(48).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(sessionToken).digest('hex');
    const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000);

    await dbClient.session.create({
      data: {
        staffId,
        tokenHash,
        ipAddress: context?.ipAddress,
        userAgent: context?.userAgent,
        expiresAt,
      },
    });

    return { sessionToken };
  }

  static getMfaChallenge(tempToken: string): MfaChallengePayload | null {
    const challenge = StaffAuthService.mfaChallenges.get(tempToken);
    if (!challenge) return null;
    if (Date.now() > challenge.expiresAt) {
      StaffAuthService.mfaChallenges.delete(tempToken);
      return null;
    }
    return challenge;
  }

  static consumeMfaChallenge(tempToken: string): MfaChallengePayload | null {
    const challenge = StaffAuthService.getMfaChallenge(tempToken);
    if (challenge) {
      StaffAuthService.mfaChallenges.delete(tempToken);
    }
    return challenge;
  }
}
