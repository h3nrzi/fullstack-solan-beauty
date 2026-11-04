import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  PrismaClient,
  CommissionContract,
  ContractStatus,
  StaffRole,
  SecurityEventType,
} from '@salon/database';

export interface ProposeContractParams {
  artistId: string;
  creatorStaffId: string;
  commissionRate: number; // e.g. 0.40
  deductMaterialCost?: boolean;
  effectiveFrom: Date;
  effectiveTo?: Date | null;
}

@Injectable()
export class CommissionContractsService {
  constructor(private readonly prisma: PrismaClient) {}

  async proposeContract(params: ProposeContractParams): Promise<CommissionContract> {
    const creator = await this.prisma.staff.findUnique({
      where: { id: params.creatorStaffId },
    });
    if (!creator || creator.role !== StaffRole.MANAGER) {
      throw new ForbiddenException('فقط مدیر سالن مجاز به ثبت قرارداد کمیسیون است');
    }

    if (params.commissionRate <= 0 || params.commissionRate > 1.0) {
      throw new BadRequestException('نرخ کمیسیون باید بزرگتر از صفر و حداکثر ۱.۰ (۱۰۰ درصد) باشد');
    }

    const artist = await this.prisma.artistProfile.findUnique({
      where: { id: params.artistId },
    });
    if (!artist) {
      throw new NotFoundException('آرتیست مورد نظر یافت نشد');
    }

    const latest = await this.prisma.commissionContract.findFirst({
      where: { artistId: params.artistId },
      orderBy: { version: 'desc' },
    });

    const version = latest ? latest.version + 1 : 1;

    const contract = await this.prisma.commissionContract.create({
      data: {
        artistId: params.artistId,
        creatorStaffId: params.creatorStaffId,
        commissionRate: params.commissionRate,
        deductMaterialCost: params.deductMaterialCost ?? true,
        effectiveFrom: params.effectiveFrom,
        effectiveTo: params.effectiveTo,
        status: ContractStatus.PENDING_APPROVAL,
        version,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        staffId: params.creatorStaffId,
        eventType: SecurityEventType.CONTRACT_PROPOSED,
        details: { contractId: contract.id, artistId: params.artistId, version },
      },
    });

    return contract;
  }

  async approveContract(contractId: string, approverStaffId: string): Promise<CommissionContract> {
    const approver = await this.prisma.staff.findUnique({
      where: { id: approverStaffId },
    });
    if (!approver || approver.role !== StaffRole.MANAGER) {
      throw new ForbiddenException('فقط مدیر سالن مجاز به تأیید قرارداد کمیسیون است');
    }

    const contract = await this.prisma.commissionContract.findUnique({
      where: { id: contractId },
    });
    if (!contract) {
      throw new NotFoundException('قرارداد مورد نظر یافت نشد');
    }

    // Rule: منع خودتأییدی (Self-approval strictly prohibited)
    if (contract.creatorStaffId === approverStaffId) {
      throw new ForbiddenException('منع خودتأییدی: تأییدکننده قرارداد نمی‌تواند همان ثبت‌کننده باشد');
    }

    if (contract.status !== ContractStatus.PENDING_APPROVAL) {
      throw new BadRequestException(`قرارداد در وضعیت ${contract.status} قابل تأیید نیست`);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      // Atomic conditional update to prevent double-approval race condition
      const updateResult = await tx.commissionContract.updateMany({
        where: {
          id: contractId,
          status: ContractStatus.PENDING_APPROVAL,
        },
        data: {
          status: ContractStatus.ACTIVE,
          approverStaffId,
          approvedAt: new Date(),
        },
      });

      if (updateResult.count === 0) {
        throw new BadRequestException('قرارداد قبلاً تعیین وضعیت شده است');
      }

      // Mark previously active contracts for this artist as SUPERSEDED (excluding the current one)
      await tx.commissionContract.updateMany({
        where: {
          artistId: contract.artistId,
          status: ContractStatus.ACTIVE,
          id: { not: contractId },
        },
        data: {
          status: ContractStatus.SUPERSEDED,
          effectiveTo: contract.effectiveFrom,
        },
      });

      const res = await tx.commissionContract.findUnique({
        where: { id: contractId },
      });
      return res!;
    });

    await this.prisma.auditLog.create({
      data: {
        staffId: approverStaffId,
        eventType: SecurityEventType.CONTRACT_APPROVED,
        details: { contractId: updated.id, artistId: updated.artistId, version: updated.version },
      },
    });

    return updated;
  }

  async rejectContract(
    contractId: string,
    approverStaffId: string,
    reason: string,
  ): Promise<CommissionContract> {
    const approver = await this.prisma.staff.findUnique({
      where: { id: approverStaffId },
    });
    if (!approver || approver.role !== StaffRole.MANAGER) {
      throw new ForbiddenException('فقط مدیر سالن مجاز به تعیین تکلیف قرارداد کمیسیون است');
    }

    const contract = await this.prisma.commissionContract.findUnique({
      where: { id: contractId },
    });
    if (!contract) {
      throw new NotFoundException('قرارداد مورد نظر یافت نشد');
    }

    if (contract.creatorStaffId === approverStaffId) {
      throw new ForbiddenException('منع خودتأییدی: ردکننده قرارداد نمی‌تواند همان ثبت‌کننده باشد');
    }

    if (contract.status !== ContractStatus.PENDING_APPROVAL) {
      throw new BadRequestException(`قرارداد در وضعیت ${contract.status} قابل رد نیست`);
    }

    const rejected = await this.prisma.commissionContract.update({
      where: { id: contractId },
      data: {
        status: ContractStatus.REJECTED,
        approverStaffId,
        rejectionReason: reason,
        approvedAt: new Date(),
      },
    });

    await this.prisma.auditLog.create({
      data: {
        staffId: approverStaffId,
        eventType: SecurityEventType.CONTRACT_REJECTED,
        details: { contractId: rejected.id, reason },
      },
    });

    return rejected;
  }

  async getActiveContract(
    artistId: string,
    atDate: Date = new Date(),
  ): Promise<CommissionContract | null> {
    return this.prisma.commissionContract.findFirst({
      where: {
        artistId,
        status: ContractStatus.ACTIVE,
        effectiveFrom: { lte: atDate },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: atDate } }],
      },
      orderBy: { effectiveFrom: 'desc' },
    });
  }

  async listContractsForArtist(artistId: string): Promise<CommissionContract[]> {
    return this.prisma.commissionContract.findMany({
      where: { artistId },
      orderBy: { version: 'desc' },
      include: {
        creator: { select: { fullName: true, username: true } },
        approver: { select: { fullName: true, username: true } },
      },
    });
  }
}
