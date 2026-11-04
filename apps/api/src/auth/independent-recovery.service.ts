import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import {
  PrismaClient,
  StaffRole,
  SecurityEventType,
  RecoveryRequestStatus,
  IndependentRecoveryRequest,
} from '@salon/database';
import { authenticator } from 'otplib';
import * as crypto from 'crypto';

export interface CreateRecoveryRequestDto {
  targetStaffId: string;
  requesterNote: string;
  ipAddress?: string;
}

export interface ApproveRecoveryRequestDto {
  requestId: string;
  approverStaffId: string;
  ipAddress?: string;
}

export interface ApprovedRecoveryResult {
  status: RecoveryRequestStatus;
  targetStaffId: string;
  newMfaSecret: string;
  newRecoveryCodes: string[];
}

export interface RejectRecoveryRequestDto {
  requestId: string;
  approverStaffId: string;
  reason: string;
  ipAddress?: string;
}

@Injectable()
export class IndependentRecoveryService {
  constructor(private readonly prisma: PrismaClient) {}

  async createRecoveryRequest(dto: CreateRecoveryRequestDto): Promise<IndependentRecoveryRequest> {
    const staff = await this.prisma.staff.findUnique({
      where: { id: dto.targetStaffId },
    });

    if (!staff) {
      throw new NotFoundException('Target staff member not found');
    }

    const request = await this.prisma.independentRecoveryRequest.create({
      data: {
        targetStaffId: staff.id,
        requesterNote: dto.requesterNote,
        status: RecoveryRequestStatus.PENDING,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        staffId: staff.id,
        eventType: SecurityEventType.INDEPENDENT_RECOVERY_REQUESTED,
        details: { requestId: request.id, note: dto.requesterNote },
        ipAddress: dto.ipAddress,
      },
    });

    return request;
  }

  async approveRecoveryRequest(dto: ApproveRecoveryRequestDto): Promise<ApprovedRecoveryResult> {
    const request = await this.prisma.independentRecoveryRequest.findUnique({
      where: { id: dto.requestId },
    });

    if (!request || request.status !== RecoveryRequestStatus.PENDING) {
      throw new BadRequestException('Recovery request not found or not in pending state');
    }

    if (request.targetStaffId === dto.approverStaffId) {
      throw new ForbiddenException(
        'Self-approval is forbidden. Independent manager verification required.'
      );
    }

    const approver = await this.prisma.staff.findUnique({
      where: { id: dto.approverStaffId },
    });

    if (!approver || !approver.isActive || approver.role !== StaffRole.MANAGER) {
      throw new ForbiddenException('Approver must be an active independent manager');
    }

    // Generate new MFA secret and new recovery codes
    const newMfaSecret = authenticator.generateSecret();
    const rawRecoveryCodes: string[] = [];
    const hashedCodesData: { codeHash: string }[] = [];

    for (let i = 0; i < 6; i++) {
      const codePart1 = crypto.randomBytes(2).toString('hex').toUpperCase();
      const codePart2 = crypto.randomBytes(2).toString('hex').toUpperCase();
      const codePart3 = crypto.randomBytes(2).toString('hex').toUpperCase();
      const code = `${codePart1}-${codePart2}-${codePart3}`;
      rawRecoveryCodes.push(code);

      const codeHash = crypto.createHash('sha256').update(code).digest('hex');
      hashedCodesData.push({ codeHash });
    }

    return await this.prisma.$transaction(async (tx) => {
      // 1. Invalidate all previous recovery codes
      await tx.recoveryCode.deleteMany({
        where: { staffId: request.targetStaffId },
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

      // 4. Revoke all open sessions for target staff immediately
      await tx.session.updateMany({
        where: {
          staffId: request.targetStaffId,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      });

      // 5. Mark request approved
      await tx.independentRecoveryRequest.update({
        where: { id: request.id },
        data: {
          status: RecoveryRequestStatus.APPROVED,
          approverStaffId: approver.id,
          resolvedAt: new Date(),
        },
      });

      // 6. Security audit logs
      await tx.auditLog.create({
        data: {
          staffId: request.targetStaffId,
          eventType: SecurityEventType.INDEPENDENT_RECOVERY_APPROVED,
          details: {
            requestId: request.id,
            approvedByStaffId: approver.id,
            action: 'MFA_SECRET_AND_RECOVERY_CODES_RESET',
          },
          ipAddress: dto.ipAddress,
        },
      });

      return {
        status: RecoveryRequestStatus.APPROVED,
        targetStaffId: request.targetStaffId,
        newMfaSecret,
        newRecoveryCodes: rawRecoveryCodes,
      };
    });
  }

  async rejectRecoveryRequest(dto: RejectRecoveryRequestDto): Promise<void> {
    const request = await this.prisma.independentRecoveryRequest.findUnique({
      where: { id: dto.requestId },
    });

    if (!request || request.status !== RecoveryRequestStatus.PENDING) {
      throw new BadRequestException('Recovery request not found or not in pending state');
    }

    if (request.targetStaffId === dto.approverStaffId) {
      throw new ForbiddenException('Self-rejection/action by target staff is forbidden');
    }

    const approver = await this.prisma.staff.findUnique({
      where: { id: dto.approverStaffId },
    });

    if (!approver || !approver.isActive || approver.role !== StaffRole.MANAGER) {
      throw new ForbiddenException('Approver must be an active manager');
    }

    await this.prisma.independentRecoveryRequest.update({
      where: { id: request.id },
      data: {
        status: RecoveryRequestStatus.REJECTED,
        approverStaffId: approver.id,
        rejectionReason: dto.reason,
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
          reason: dto.reason,
        },
        ipAddress: dto.ipAddress,
      },
    });
  }
}
