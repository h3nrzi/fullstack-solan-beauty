import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaClient, SecurityEventType, Staff } from '@salon/database';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { authenticator } from 'otplib';

export interface LoginDto {
  username: string;
  password: string;
  ipAddress?: string;
}

export interface VerifyMfaDto {
  tempToken: string;
  code: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface VerifyRecoveryCodeDto {
  tempToken: string;
  recoveryCode: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuthSessionResult {
  sessionToken: string;
  staff: Staff;
}

export interface LoginResult {
  mfaRequired: boolean;
  tempToken?: string;
  staffId: string;
}

// In-memory or cache store for tempTokens during MFA challenge (5 minutes TTL)
interface MfaChallengePayload {
  staffId: string;
  expiresAt: number;
}

@Injectable()
export class StaffAuthService {
  private static mfaChallenges = new Map<string, MfaChallengePayload>();

  constructor(private readonly prisma: PrismaClient) {}

  async login(dto: LoginDto): Promise<LoginResult> {
    const staff = await this.prisma.staff.findUnique({
      where: { username: dto.username },
    });

    if (!staff || !staff.isActive) {
      await this.prisma.auditLog.create({
        data: {
          eventType: SecurityEventType.LOGIN_FAILED,
          details: { username: dto.username, reason: 'Staff not found or inactive' },
          ipAddress: dto.ipAddress,
        },
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await argon2.verify(staff.passwordHash, dto.password);
    if (!isPasswordValid) {
      await this.prisma.auditLog.create({
        data: {
          staffId: staff.id,
          eventType: SecurityEventType.LOGIN_FAILED,
          details: { reason: 'Incorrect password' },
          ipAddress: dto.ipAddress,
        },
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    if (staff.mfaEnabled) {
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
          ipAddress: dto.ipAddress,
        },
      });

      return {
        mfaRequired: true,
        tempToken,
        staffId: staff.id,
      };
    }

    // If MFA was not enabled (not typical for staff, but supported)
    return {
      mfaRequired: false,
      staffId: staff.id,
    };
  }

  async verifyMfa(dto: VerifyMfaDto): Promise<AuthSessionResult> {
    const challenge = StaffAuthService.getMfaChallenge(dto.tempToken);
    if (!challenge) {
      throw new UnauthorizedException('Invalid or expired MFA session');
    }

    const staff = await this.prisma.staff.findUnique({
      where: { id: challenge.staffId },
    });

    if (!staff || !staff.isActive || !staff.mfaSecret) {
      StaffAuthService.consumeMfaChallenge(dto.tempToken);
      throw new UnauthorizedException('Staff account not active or misconfigured');
    }

    const isValid = authenticator.verify({
      token: dto.code,
      secret: staff.mfaSecret,
    });

    if (!isValid) {
      await this.prisma.auditLog.create({
        data: {
          staffId: staff.id,
          eventType: SecurityEventType.MFA_FAILED,
          details: { reason: 'Incorrect TOTP code' },
          ipAddress: dto.ipAddress,
        },
      });
      throw new UnauthorizedException('Invalid MFA code');
    }

    // Burn tempToken so it cannot be used again
    StaffAuthService.consumeMfaChallenge(dto.tempToken);

    // Create session token and store sha256 hash in DB
    const sessionToken = crypto.randomBytes(48).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(sessionToken).digest('hex');

    // 12 hours expiration
    const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000);

    await this.prisma.session.create({
      data: {
        staffId: staff.id,
        tokenHash,
        ipAddress: dto.ipAddress,
        userAgent: dto.userAgent,
        expiresAt,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        staffId: staff.id,
        eventType: SecurityEventType.MFA_SUCCESS,
        details: { method: 'TOTP' },
        ipAddress: dto.ipAddress,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        staffId: staff.id,
        eventType: SecurityEventType.LOGIN_SUCCESS,
        details: { method: 'PASSWORD_AND_MFA' },
        ipAddress: dto.ipAddress,
      },
    });

    return {
      sessionToken,
      staff,
    };
  }

  async verifyRecoveryCode(dto: VerifyRecoveryCodeDto): Promise<AuthSessionResult> {
    const challenge = StaffAuthService.getMfaChallenge(dto.tempToken);
    if (!challenge) {
      throw new UnauthorizedException('Invalid or expired MFA session');
    }

    const hashedCode = crypto.createHash('sha256').update(dto.recoveryCode).digest('hex');

    // Run in atomic transaction to prevent race conditions / double spend
    return await this.prisma.$transaction(async (tx) => {
      const staff = await tx.staff.findUnique({
        where: { id: challenge.staffId },
      });

      if (!staff || !staff.isActive) {
        StaffAuthService.consumeMfaChallenge(dto.tempToken);
        throw new UnauthorizedException('Staff account not active or misconfigured');
      }

      // Atomically burn the recovery code only if it has not been used yet.
      // In PostgreSQL, this locks the row and ensures exactly one concurrent transaction succeeds.
      const updateResult = await tx.recoveryCode.updateMany({
        where: {
          staffId: staff.id,
          codeHash: hashedCode,
          usedAt: null,
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
            ipAddress: dto.ipAddress,
          },
        });
        throw new UnauthorizedException('Invalid or already used recovery code');
      }

      // Burn the temp challenge token
      StaffAuthService.consumeMfaChallenge(dto.tempToken);

      // Create session
      const sessionToken = crypto.randomBytes(48).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(sessionToken).digest('hex');
      const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000);

      await tx.session.create({
        data: {
          staffId: staff.id,
          tokenHash,
          ipAddress: dto.ipAddress,
          userAgent: dto.userAgent,
          expiresAt,
        },
      });

      await tx.auditLog.create({
        data: {
          staffId: staff.id,
          eventType: SecurityEventType.RECOVERY_CODE_USED,
          details: { codeHash: hashedCode },
          ipAddress: dto.ipAddress,
        },
      });

      await tx.auditLog.create({
        data: {
          staffId: staff.id,
          eventType: SecurityEventType.LOGIN_SUCCESS,
          details: { method: 'RECOVERY_CODE' },
          ipAddress: dto.ipAddress,
        },
      });

      return {
        sessionToken,
        staff,
      };
    });
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
