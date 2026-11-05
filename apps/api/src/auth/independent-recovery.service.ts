import { Injectable, ForbiddenException, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import {
  PrismaClient,
  StaffRole,
  SecurityEventType,
  RecoveryRequestStatus,
  IndependentRecoveryRequest,
} from '@salon/database';
import { authenticator } from 'otplib';
import * as crypto from 'crypto';
import { RequestContext } from './dto/auth.dto';

export interface CreateRecoveryRequestInput {
  targetStaffId: string;
  requesterNote: string;
}

export interface ApproveRecoveryRequestInput {
  requestId: string;
  approverStaffId: string;
}

export interface ApprovedRecoveryResult {
  status: RecoveryRequestStatus;
  requestId: string;
  targetStaffId: string;
  claimToken: string; // Used by target staff to activate
}

export interface ClaimRecoveryResult {
  targetStaffId: string;
  newMfaSecret: string;
  newRecoveryCodes: string[];
}

@Injectable()
export class IndependentRecoveryService {
  constructor(private readonly prisma: PrismaClient) {}

  async createRecoveryRequest(input: CreateRecoveryRequestInput, context?: RequestContext): Promise<IndependentRecoveryRequest> {
    const staff = await this.prisma.staff.findUnique({
      where: { id: input.targetStaffId },
    });

    if (!staff) {
      throw new NotFoundException('Target staff member not found');
    }

    const request = await this.prisma.independentRecoveryRequest.create({
      data: {
        targetStaffId: staff.id,
        requesterNote: input.requesterNote,
        status: RecoveryRequestStatus.PENDING,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        staffId: staff.id,
        eventType: SecurityEventType.INDEPENDENT_RECOVERY_REQUESTED,
        details: { requestId: request.id, note: input.requesterNote },
        ipAddress: context?.ipAddress,
      },
    });

    return request;
  }

  /**
   * Independent manager approves request.
   * Crucially, the approver manager does NOT receive the staff member's secrets!
   * A single-use claimToken is issued to allow the target staff member to claim their new credentials.
   */
  async approveRecoveryRequest(input: ApproveRecoveryRequestInput, context?: RequestContext): Promise<ApprovedRecoveryResult> {
    const request = await this.prisma.independentRecoveryRequest.findUnique({
      where: { id: input.requestId },
    });

    if (!request || request.status !== RecoveryRequestStatus.PENDING) {
      throw new BadRequestException('Recovery request not found or not in pending state');
    }

    if (request.targetStaffId === input.approverStaffId) {
      throw new ForbiddenException(
        'Self-approval is forbidden. Independent manager verification required.'
      );
    }

    const approver = await this.prisma.staff.findUnique({
      where: { id: input.approverStaffId },
    });

    if (!approver || !approver.isActive || approver.role !== StaffRole.MANAGER) {
      throw new ForbiddenException('Approver must be an active independent manager');
    }

    const claimToken = crypto.randomBytes(32).toString('hex');
    const claimTokenHash = crypto.createHash('sha256').update(claimToken).digest('hex');

    await this.prisma.independentRecoveryRequest.update({
      where: { id: request.id },
      data: {
        status: RecoveryRequestStatus.APPROVED,
        approverStaffId: approver.id,
        claimTokenHash,
        resolvedAt: new Date(),
      },
    });

    await this.prisma.auditLog.create({
      data: {
        staffId: request.targetStaffId,
        eventType: SecurityEventType.INDEPENDENT_RECOVERY_APPROVED,
        details: {
          requestId: request.id,
          approvedByStaffId: approver.id,
        },
        ipAddress: context?.ipAddress,
      },
    });

    return {
      status: RecoveryRequestStatus.APPROVED,
      requestId: request.id,
      targetStaffId: request.targetStaffId,
      claimToken,
    };
  }

  /**
   * Target staff member claims their approved recovery and receives their newly generated MFA secret & recovery codes.
   */
  async claimRecovery(requestId: string, claimToken: string, context?: RequestContext): Promise<ClaimRecoveryResult> {
    const request = await this.prisma.independentRecoveryRequest.findUnique({
      where: { id: requestId },
    });

    if (!request || request.status !== RecoveryRequestStatus.APPROVED || !request.claimTokenHash) {
      throw new BadRequestException('Invalid or unapproved recovery request');
    }

    const inputHash = crypto.createHash('sha256').update(claimToken).digest('hex');
    if (inputHash !== request.claimTokenHash) {
      throw new UnauthorizedException('Invalid claim token');
    }

    const newMfaSecret = authenticator.generateSecret();
    const rawRecoveryCodes: string[] = [];
    const hashedCodesData: { codeHash: string }[] = [];

    for (let i = 0; i < 6; i++) {
      const p1 = crypto.randomBytes(2).toString('hex').toUpperCase();
      const p2 = crypto.randomBytes(2).toString('hex').toUpperCase();
      const p3 = crypto.randomBytes(2).toString('hex').toUpperCase();
      const code = `${p1}-${p2}-${p3}`;
      rawRecoveryCodes.push(code);
      hashedCodesData.push({ codeHash: crypto.createHash('sha256').update(code).digest('hex') });
    }

    return await this.prisma.$transaction(async (tx) => {
      // 1. Soft-revoke existing recovery codes (preserving historical records)
      await tx.recoveryCode.updateMany({
        where: { staffId: request.targetStaffId, revokedAt: null },
        data: { revokedAt: new Date() },
      });

      // 2. Insert new recovery codes
      await tx.recoveryCode.createMany({
        data: hashedCodesData.map((c) => ({
          staffId: request.targetStaffId,
          codeHash: c.codeHash,
        })),
      });

      // 3. Update staff MFA secret
      await tx.staff.update({
        where: { id: request.targetStaffId },
        data: {
          mfaSecret: newMfaSecret,
          mfaEnabled: true,
        },
      });

      // 4. Revoke active sessions
      await tx.session.updateMany({
        where: { staffId: request.targetStaffId, revokedAt: null },
        data: { revokedAt: new Date() },
      });

      // 5. Invalidate claim token so it cannot be used again
      await tx.independentRecoveryRequest.update({
        where: { id: request.id },
        data: { claimTokenHash: null },
      });

      await tx.auditLog.create({
        data: {
          staffId: request.targetStaffId,
          eventType: SecurityEventType.PASSWORD_CHANGED,
          details: { action: 'MFA_SECRET_AND_RECOVERY_CODES_CLAIMED' },
          ipAddress: context?.ipAddress,
        },
      });

      return {
        targetStaffId: request.targetStaffId,
        newMfaSecret,
        newRecoveryCodes: rawRecoveryCodes,
      };
    });
  }

  async rejectRecoveryRequest(requestId: string, approverStaffId: string, reason: string, context?: RequestContext): Promise<void> {
    const request = await this.prisma.independentRecoveryRequest.findUnique({
      where: { id: requestId },
    });

    if (!request || request.status !== RecoveryRequestStatus.PENDING) {
      throw new BadRequestException('Recovery request not found or not in pending state');
    }

    if (request.targetStaffId === approverStaffId) {
      throw new ForbiddenException('Self-rejection/action by target staff is forbidden');
    }

    const approver = await this.prisma.staff.findUnique({
      where: { id: approverStaffId },
    });

    if (!approver || !approver.isActive || approver.role !== StaffRole.MANAGER) {
      throw new ForbiddenException('Approver must be an active manager');
    }

    await this.prisma.independentRecoveryRequest.update({
      where: { id: request.id },
      data: {
        status: RecoveryRequestStatus.REJECTED,
        approverStaffId: approver.id,
        rejectionReason: reason,
        resolvedAt: new Date(),
      },
    });

    await this.prisma.auditLog.create({
      data: {
        staffId: request.targetStaffId,
        eventType: SecurityEventType.INDEPENDENT_RECOVERY_REJECTED,
        details: {
          requestId: request.id,
          rejectedByStaffId: approver.id,
          reason,
        },
        ipAddress: context?.ipAddress,
      },
    });
  }

  async listPendingRequests() {
    return await this.prisma.independentRecoveryRequest.findMany({
      where: {
        status: RecoveryRequestStatus.PENDING,
      },
      include: {
        targetStaff: {
          select: {
            id: true,
            username: true,
            fullName: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
