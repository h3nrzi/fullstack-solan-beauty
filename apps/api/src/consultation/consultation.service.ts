import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  PrismaClient,
  ConsultationStatus,
  ConsultationEventType,
  SecurityEventType,
} from '@salon/database';
import {
  ConsultationRequestDto,
  ConsultationRequestEventDto,
  CreateConsultationRequestDto,
} from '@salon/shared';

@Injectable()
export class ConsultationService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Helper to compute dynamic SLA countdown and breach status.
   */
  private computeBudget(
    req: {
      budgetTotalMinutes: number;
      elapsedActiveMinutes: number;
      lastActiveTimerStartedAt: Date | null;
      isPaused: boolean;
      status: ConsultationStatus;
      isBudgetBreached: boolean;
    },
    atTime: Date = new Date(),
  ): { elapsedActiveMinutes: number; remainingMinutes: number; isBudgetBreached: boolean } {
    let totalElapsed = req.elapsedActiveMinutes;

    const isTerminal = ([
      ConsultationStatus.RESULT_COMMUNICATED,
      ConsultationStatus.CLOSED_WITHOUT_BOOKING,
      ConsultationStatus.WITHDRAWN,
    ] as ConsultationStatus[]).includes(req.status);

    if (!req.isPaused && !isTerminal && req.lastActiveTimerStartedAt) {
      const deltaMs = Math.max(0, atTime.getTime() - new Date(req.lastActiveTimerStartedAt).getTime());
      const deltaMinutes = Math.floor(deltaMs / (60 * 1000));
      totalElapsed += deltaMinutes;
    }

    const remainingMinutes = Math.max(0, req.budgetTotalMinutes - totalElapsed);
    const isBudgetBreached = totalElapsed > req.budgetTotalMinutes;

    return {
      elapsedActiveMinutes: totalElapsed,
      remainingMinutes,
      isBudgetBreached,
    };
  }

  /**
   * Format entity into DTO
   */
  private formatDto(req: any, atTime: Date = new Date()): ConsultationRequestDto {
    const budget = this.computeBudget(req, atTime);

    return {
      id: req.id,
      customerId: req.customerId,
      customerName: req.customer?.fullName ?? null,
      customerPhone: req.customer?.phone ?? null,
      serviceId: req.serviceId ?? null,
      serviceName: req.service?.name ?? null,
      customServiceTitle: req.customServiceTitle ?? null,
      customerNotes: req.customerNotes,
      preferredSchedule: req.preferredSchedule ?? null,
      status: req.status,
      assignedStaffId: req.assignedStaffId ?? null,
      assignedStaffName: req.assignedStaff?.fullName ?? null,
      budgetTotalMinutes: req.budgetTotalMinutes,
      elapsedActiveMinutes: budget.elapsedActiveMinutes,
      remainingMinutes: budget.remainingMinutes,
      isPaused: req.isPaused,
      isBudgetBreached: budget.isBudgetBreached,
      proposalDetails: req.proposalDetails ?? undefined,
      resultNotes: req.resultNotes ?? null,
      resultCommunicatedAt: req.resultCommunicatedAt ?? null,
      resultChannel: req.resultChannel ?? null,
      reopenReason: req.reopenReason ?? null,
      withdrawalReason: req.withdrawalReason ?? null,
      createdAt: req.createdAt,
      updatedAt: req.updatedAt,
      events: req.events
        ? req.events.map((e: any): ConsultationRequestEventDto => ({
            id: e.id,
            requestId: e.requestId,
            eventType: e.eventType,
            fromStatus: e.fromStatus ?? null,
            toStatus: e.toStatus,
            actorStaffId: e.actorStaffId ?? null,
            actorStaffName: e.actorStaff?.fullName ?? null,
            actorCustomerId: e.actorCustomerId ?? null,
            note: e.note ?? null,
            metadata: e.metadata ?? undefined,
            createdAt: e.createdAt,
          }))
        : undefined,
    };
  }

  /**
   * Customer creates a new consultation request.
   * Absolutely NO booking, capacity allocation, or deposit is created!
   */
  async createRequest(
    customerId: string,
    dto: CreateConsultationRequestDto,
    atTime: Date = new Date(),
  ): Promise<ConsultationRequestDto> {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });
    if (!customer) {
      throw new NotFoundException('مشتری یافت نشد');
    }

    if (dto.serviceId) {
      const service = await this.prisma.service.findUnique({
        where: { id: dto.serviceId },
      });
      if (!service) {
        throw new NotFoundException('خدمت انتخابی یافت نشد');
      }
    }

    const created = await this.prisma.$transaction(async (tx) => {
      const req = await tx.consultationRequest.create({
        data: {
          customerId,
          serviceId: dto.serviceId ?? null,
          customServiceTitle: dto.customServiceTitle ?? null,
          customerNotes: dto.customerNotes,
          preferredSchedule: dto.preferredSchedule ?? null,
          status: ConsultationStatus.PENDING_REVIEW,
          budgetTotalMinutes: 240,
          elapsedActiveMinutes: 0,
          lastActiveTimerStartedAt: atTime,
          isPaused: false,
          isBudgetBreached: false,
        },
        include: {
          customer: true,
          service: true,
          assignedStaff: true,
        },
      });

      await tx.consultationRequestEvent.create({
        data: {
          requestId: req.id,
          eventType: ConsultationEventType.CREATED,
          toStatus: ConsultationStatus.PENDING_REVIEW,
          actorCustomerId: customerId,
          note: 'ثبت اولیه درخواست بررسی توسط مشتری',
          createdAt: atTime,
        },
      });

      await tx.auditLog.create({
        data: {
          customerId,
          eventType: SecurityEventType.CONSULTATION_REQUEST_CREATED,
          details: {
            requestId: req.id,
            serviceId: dto.serviceId,
            customServiceTitle: dto.customServiceTitle,
          },
          createdAt: atTime,
        },
      });

      return req;
    });

    const full = await this.prisma.consultationRequest.findUnique({
      where: { id: created.id },
      include: {
        customer: true,
        service: true,
        assignedStaff: true,
        events: { orderBy: { createdAt: 'asc' } },
      },
    });

    return this.formatDto(full, atTime);
  }

  /**
   * Calculate real-time budget state and synchronize breach flag if needed.
   */
  async calculateBudgetState(requestId: string, atTime: Date = new Date()): Promise<ConsultationRequestDto> {
    const req = await this.prisma.consultationRequest.findUnique({
      where: { id: requestId },
      include: {
        customer: true,
        service: true,
        assignedStaff: true,
        events: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!req) {
      throw new NotFoundException('درخواست بررسی یافت نشد');
    }

    const budget = this.computeBudget(req, atTime);
    if (budget.isBudgetBreached && !req.isBudgetBreached) {
      await this.prisma.consultationRequest.update({
        where: { id: requestId },
        data: {
          isBudgetBreached: true,
          budgetBreachedAt: atTime,
        },
      });
      await this.prisma.auditLog.create({
        data: {
          eventType: SecurityEventType.CONSULTATION_REQUEST_BUDGET_BREACHED,
          details: { requestId, elapsedMinutes: budget.elapsedActiveMinutes },
          createdAt: atTime,
        },
      });
      req.isBudgetBreached = true;
    }

    return this.formatDto(req, atTime);
  }

  /**
   * Request supplementary information from customer.
   * Pauses the SLA countdown and preserves already consumed active minutes.
   */
  async requestInfo(
    requestId: string,
    actorStaffId: string,
    question: string,
    atTime: Date = new Date(),
  ): Promise<ConsultationRequestDto> {
    const updated = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.consultationRequest.findUnique({
        where: { id: requestId },
      });
      if (!existing) {
        throw new NotFoundException('درخواست بررسی یافت نشد');
      }

      if (([ConsultationStatus.WITHDRAWN, ConsultationStatus.RESULT_COMMUNICATED, ConsultationStatus.CLOSED_WITHOUT_BOOKING] as ConsultationStatus[]).includes(existing.status)) {
        throw new BadRequestException('امکان درخواست اطلاعات در این وضعیت وجود ندارد');
      }

      const budget = this.computeBudget(existing, atTime);

      const reqResult = await tx.consultationRequest.updateMany({
        where: {
          id: requestId,
          status: {
            notIn: [
              ConsultationStatus.WITHDRAWN,
              ConsultationStatus.RESULT_COMMUNICATED,
              ConsultationStatus.CLOSED_WITHOUT_BOOKING,
              ConsultationStatus.NEEDS_INFO,
            ],
          },
        },
        data: {
          status: ConsultationStatus.NEEDS_INFO,
          isPaused: true,
          pausedAt: atTime,
          elapsedActiveMinutes: budget.elapsedActiveMinutes,
          lastActiveTimerStartedAt: null,
          version: { increment: 1 },
        },
      });

      if (reqResult.count === 0) {
        throw new BadRequestException('امکان درخواست اطلاعات در این وضعیت وجود ندارد');
      }

      await tx.consultationRequestEvent.create({
        data: {
          requestId,
          eventType: ConsultationEventType.INFO_REQUESTED,
          fromStatus: existing.status,
          toStatus: ConsultationStatus.NEEDS_INFO,
          actorStaffId,
          note: question,
          createdAt: atTime,
        },
      });

      await tx.auditLog.create({
        data: {
          staffId: actorStaffId,
          eventType: SecurityEventType.CONSULTATION_REQUEST_INFO_REQUESTED,
          details: { requestId, question },
          createdAt: atTime,
        },
      });

      return reqResult;
    });

    const full = await this.prisma.consultationRequest.findUnique({
      where: { id: requestId },
      include: {
        customer: true,
        service: true,
        assignedStaff: true,
        events: { orderBy: { createdAt: 'asc' } },
      },
    });

    return this.formatDto(full, atTime);
  }

  /**
   * Customer provides requested supplementary info.
   * Resumes the SLA countdown with remaining budget intact.
   */
  async provideInfo(
    requestId: string,
    customerId: string,
    answer: string,
    atTime: Date = new Date(),
  ): Promise<ConsultationRequestDto> {
    const updated = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.consultationRequest.findUnique({
        where: { id: requestId },
      });
      if (!existing) {
        throw new NotFoundException('درخواست بررسی یافت نشد');
      }

      if (existing.customerId !== customerId) {
        await tx.auditLog.create({
          data: {
            customerId,
            eventType: SecurityEventType.CUSTOMER_UNAUTHORIZED_ACCESS_ATTEMPT,
            details: { targetRequestId: requestId, action: 'PROVIDE_INFO_CROSS_ACCOUNT' },
            createdAt: atTime,
          },
        });
        throw new ForbiddenException('دسترسی غیرمجاز به درخواست سایر مشتریان');
      }

      if (existing.status !== ConsultationStatus.NEEDS_INFO) {
        throw new BadRequestException('درخواست در انتظار اطلاعات نیست');
      }

      const nextStatus = existing.assignedStaffId
        ? ConsultationStatus.ASSIGNED_CONSULTANT
        : ConsultationStatus.PENDING_REVIEW;

      const reqResult = await tx.consultationRequest.updateMany({
        where: {
          id: requestId,
          status: ConsultationStatus.NEEDS_INFO,
          customerId,
        },
        data: {
          status: nextStatus,
          isPaused: false,
          pausedAt: null,
          lastActiveTimerStartedAt: atTime,
          version: { increment: 1 },
        },
      });

      if (reqResult.count === 0) {
        throw new BadRequestException('درخواست در انتظار اطلاعات نیست یا دسترسی غیرمجاز است');
      }

      await tx.consultationRequestEvent.create({
        data: {
          requestId,
          eventType: ConsultationEventType.INFO_PROVIDED,
          fromStatus: ConsultationStatus.NEEDS_INFO,
          toStatus: nextStatus,
          actorCustomerId: customerId,
          note: answer,
          createdAt: atTime,
        },
      });

      await tx.auditLog.create({
        data: {
          customerId,
          eventType: SecurityEventType.CONSULTATION_REQUEST_INFO_PROVIDED,
          details: { requestId, answerLength: answer.length },
          createdAt: atTime,
        },
      });

      return reqResult;
    });

    const full = await this.prisma.consultationRequest.findUnique({
      where: { id: requestId },
      include: {
        customer: true,
        service: true,
        assignedStaff: true,
        events: { orderBy: { createdAt: 'asc' } },
      },
    });

    return this.formatDto(full, atTime);
  }

  /**
   * Assign or reassign responsible staff/consultant.
   * CRITICAL: Reassignment does NOT reset or refresh the budget!
   */
  async assignStaff(
    requestId: string,
    newStaffId: string,
    actorStaffId: string,
    note?: string,
    atTime: Date = new Date(),
  ): Promise<ConsultationRequestDto> {
    const existing = await this.prisma.consultationRequest.findUnique({
      where: { id: requestId },
    });
    if (!existing) {
      throw new NotFoundException('درخواست بررسی یافت نشد');
    }

    const targetStaff = await this.prisma.staff.findUnique({
      where: { id: newStaffId },
    });
    if (!targetStaff) {
      throw new NotFoundException('کارمند انتخاب‌شده یافت نشد');
    }

    const budget = this.computeBudget(existing, atTime);
    const nextStatus = existing.status === ConsultationStatus.PENDING_REVIEW
      ? ConsultationStatus.ASSIGNED_CONSULTANT
      : existing.status;

    const updated = await this.prisma.$transaction(async (tx) => {
      const req = await tx.consultationRequest.update({
        where: { id: requestId },
        data: {
          assignedStaffId: newStaffId,
          status: nextStatus,
          elapsedActiveMinutes: budget.elapsedActiveMinutes,
          lastActiveTimerStartedAt: existing.isPaused ? null : atTime,
          version: { increment: 1 },
        },
        include: {
          customer: true,
          service: true,
          assignedStaff: true,
        },
      });

      await tx.consultationRequestEvent.create({
        data: {
          requestId,
          eventType: ConsultationEventType.ASSIGNED,
          fromStatus: existing.status,
          toStatus: nextStatus,
          actorStaffId,
          note: note ?? `ارجاع به ${targetStaff.fullName}`,
          metadata: { assignedStaffId: newStaffId },
          createdAt: atTime,
        },
      });

      await tx.auditLog.create({
        data: {
          staffId: actorStaffId,
          eventType: SecurityEventType.CONSULTATION_REQUEST_ASSIGNED,
          details: { requestId, newStaffId },
          createdAt: atTime,
        },
      });

      return req;
    });

    const full = await this.prisma.consultationRequest.findUnique({
      where: { id: requestId },
      include: {
        customer: true,
        service: true,
        assignedStaff: true,
        events: { orderBy: { createdAt: 'asc' } },
      },
    });

    return this.formatDto(full, atTime);
  }

  /**
   * Prepare proposal details.
   * Note: Timer does not stop when proposal is ready!
   */
  async prepareProposal(
    requestId: string,
    actorStaffId: string,
    proposalDetails: Record<string, any>,
    note?: string,
    atTime: Date = new Date(),
  ): Promise<ConsultationRequestDto> {
    const existing = await this.prisma.consultationRequest.findUnique({
      where: { id: requestId },
    });
    if (!existing) {
      throw new NotFoundException('درخواست بررسی یافت نشد');
    }

    const budget = this.computeBudget(existing, atTime);

    const updated = await this.prisma.$transaction(async (tx) => {
      const req = await tx.consultationRequest.update({
        where: { id: requestId },
        data: {
          status: ConsultationStatus.PROPOSAL_READY,
          proposalDetails,
          elapsedActiveMinutes: budget.elapsedActiveMinutes,
          lastActiveTimerStartedAt: existing.isPaused ? null : atTime,
          version: { increment: 1 },
        },
        include: {
          customer: true,
          service: true,
          assignedStaff: true,
        },
      });

      await tx.consultationRequestEvent.create({
        data: {
          requestId,
          eventType: ConsultationEventType.PROPOSAL_PREPARED,
          fromStatus: existing.status,
          toStatus: ConsultationStatus.PROPOSAL_READY,
          actorStaffId,
          note: note ?? 'پیشنهاد مشاوره آماده شد',
          metadata: proposalDetails,
          createdAt: atTime,
        },
      });

      await tx.auditLog.create({
        data: {
          staffId: actorStaffId,
          eventType: SecurityEventType.CONSULTATION_REQUEST_PROPOSAL_READY,
          details: { requestId },
          createdAt: atTime,
        },
      });

      return req;
    });

    const full = await this.prisma.consultationRequest.findUnique({
      where: { id: requestId },
      include: {
        customer: true,
        service: true,
        assignedStaff: true,
        events: { orderBy: { createdAt: 'asc' } },
      },
    });

    return this.formatDto(full, atTime);
  }

  /**
   * Communicate actual result to customer.
   * Completes the consultation review and stops active timer countdown.
   */
  async communicateResult(
    requestId: string,
    actorStaffId: string,
    resultNotes: string,
    channel: string = 'PHONE',
    atTime: Date = new Date(),
  ): Promise<ConsultationRequestDto> {
    const existing = await this.prisma.consultationRequest.findUnique({
      where: { id: requestId },
    });
    if (!existing) {
      throw new NotFoundException('درخواست بررسی یافت نشد');
    }

    const budget = this.computeBudget(existing, atTime);

    const updated = await this.prisma.$transaction(async (tx) => {
      const req = await tx.consultationRequest.update({
        where: { id: requestId },
        data: {
          status: ConsultationStatus.RESULT_COMMUNICATED,
          resultNotes,
          resultChannel: channel,
          resultCommunicatedAt: atTime,
          completedAt: atTime,
          elapsedActiveMinutes: budget.elapsedActiveMinutes,
          lastActiveTimerStartedAt: null,
          isPaused: false,
          version: { increment: 1 },
        },
        include: {
          customer: true,
          service: true,
          assignedStaff: true,
        },
      });

      await tx.consultationRequestEvent.create({
        data: {
          requestId,
          eventType: ConsultationEventType.RESULT_COMMUNICATED,
          fromStatus: existing.status,
          toStatus: ConsultationStatus.RESULT_COMMUNICATED,
          actorStaffId,
          note: resultNotes,
          metadata: { channel },
          createdAt: atTime,
        },
      });

      await tx.auditLog.create({
        data: {
          staffId: actorStaffId,
          eventType: SecurityEventType.CONSULTATION_REQUEST_RESULT_COMMUNICATED,
          details: { requestId, channel },
          createdAt: atTime,
        },
      });

      return req;
    });

    const full = await this.prisma.consultationRequest.findUnique({
      where: { id: requestId },
      include: {
        customer: true,
        service: true,
        assignedStaff: true,
        events: { orderBy: { createdAt: 'asc' } },
      },
    });

    return this.formatDto(full, atTime);
  }

  /**
   * Customer withdraws their consultation request.
   */
  async withdrawRequest(
    requestId: string,
    customerId: string,
    reason?: string,
    atTime: Date = new Date(),
  ): Promise<ConsultationRequestDto> {
    const updated = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.consultationRequest.findUnique({
        where: { id: requestId },
      });
      if (!existing) {
        throw new NotFoundException('درخواست بررسی یافت نشد');
      }

      if (existing.customerId !== customerId) {
        await tx.auditLog.create({
          data: {
            customerId,
            eventType: SecurityEventType.CUSTOMER_UNAUTHORIZED_ACCESS_ATTEMPT,
            details: { targetRequestId: requestId, action: 'WITHDRAW_CROSS_ACCOUNT' },
            createdAt: atTime,
          },
        });
        throw new ForbiddenException('امکان پس‌گرفتن درخواست سایر مشتریان وجود ندارد');
      }

      if (([ConsultationStatus.WITHDRAWN, ConsultationStatus.CLOSED_WITHOUT_BOOKING] as ConsultationStatus[]).includes(existing.status)) {
        throw new BadRequestException('درخواست قبلاً لغو یا بسته شده است');
      }

      const budget = this.computeBudget(existing, atTime);

      const reqResult = await tx.consultationRequest.updateMany({
        where: {
          id: requestId,
          customerId,
          status: {
            notIn: [
              ConsultationStatus.WITHDRAWN,
              ConsultationStatus.CLOSED_WITHOUT_BOOKING,
            ],
          },
        },
        data: {
          status: ConsultationStatus.WITHDRAWN,
          withdrawalReason: reason ?? null,
          completedAt: atTime,
          elapsedActiveMinutes: budget.elapsedActiveMinutes,
          lastActiveTimerStartedAt: null,
          version: { increment: 1 },
        },
      });

      if (reqResult.count === 0) {
        throw new BadRequestException('درخواست قبلاً لغو یا بسته شده است');
      }

      await tx.consultationRequestEvent.create({
        data: {
          requestId,
          eventType: ConsultationEventType.WITHDRAWN,
          fromStatus: existing.status,
          toStatus: ConsultationStatus.WITHDRAWN,
          actorCustomerId: customerId,
          note: reason ?? 'انصراف و پس‌گرفتن درخواست توسط مشتری',
          createdAt: atTime,
        },
      });

      await tx.auditLog.create({
        data: {
          customerId,
          eventType: SecurityEventType.CONSULTATION_REQUEST_WITHDRAWN,
          details: { requestId, reason },
          createdAt: atTime,
        },
      });

      return reqResult;
    });

    const full = await this.prisma.consultationRequest.findUnique({
      where: { id: requestId },
      include: {
        customer: true,
        service: true,
        assignedStaff: true,
        events: { orderBy: { createdAt: 'asc' } },
      },
    });

    return this.formatDto(full, atTime);
  }

  /**
   * Reopen a closed or withdrawn request with documented reason, assignee, and fresh 4-hour budget.
   */
  async reopenRequest(
    requestId: string,
    actorStaffId: string,
    reason: string,
    assignedStaffId: string,
    atTime: Date = new Date(),
  ): Promise<ConsultationRequestDto> {
    if (!reason || reason.trim().length === 0) {
      throw new BadRequestException('ثبت دلیل برای بازگشایی الزامی است');
    }

    const targetStaff = await this.prisma.staff.findUnique({
      where: { id: assignedStaffId },
    });
    if (!targetStaff) {
      throw new NotFoundException('مشاور مسئول تعیین‌شده یافت نشد');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.consultationRequest.findUnique({
        where: { id: requestId },
      });
      if (!existing) {
        throw new NotFoundException('درخواست بررسی یافت نشد');
      }

      if (!([
        ConsultationStatus.RESULT_COMMUNICATED,
        ConsultationStatus.WITHDRAWN,
        ConsultationStatus.CLOSED_WITHOUT_BOOKING,
      ] as ConsultationStatus[]).includes(existing.status)) {
        throw new BadRequestException('تنها درخواست‌های پایان‌یافته، لغو یا بسته‌شده قابل بازگشایی هستند');
      }

      const reqResult = await tx.consultationRequest.updateMany({
        where: {
          id: requestId,
          status: {
            in: [
              ConsultationStatus.RESULT_COMMUNICATED,
              ConsultationStatus.WITHDRAWN,
              ConsultationStatus.CLOSED_WITHOUT_BOOKING,
            ],
          },
        },
        data: {
          status: ConsultationStatus.ASSIGNED_CONSULTANT,
          assignedStaffId,
          reopenReason: reason,
          budgetTotalMinutes: 240,
          elapsedActiveMinutes: 0,
          lastActiveTimerStartedAt: atTime,
          isPaused: false,
          pausedAt: null,
          isBudgetBreached: false,
          budgetBreachedAt: null,
          completedAt: null,
          version: { increment: 1 },
        },
      });

      if (reqResult.count === 0) {
        throw new BadRequestException('تنها درخواست‌های لغو یا بسته‌شده قابل بازگشایی هستند');
      }

      await tx.consultationRequestEvent.create({
        data: {
          requestId,
          eventType: ConsultationEventType.REOPENED,
          fromStatus: existing.status,
          toStatus: ConsultationStatus.ASSIGNED_CONSULTANT,
          actorStaffId,
          note: reason,
          metadata: { assignedStaffId, newBudgetMinutes: 240 },
          createdAt: atTime,
        },
      });

      await tx.auditLog.create({
        data: {
          staffId: actorStaffId,
          eventType: SecurityEventType.CONSULTATION_REQUEST_REOPENED,
          details: { requestId, reason, assignedStaffId },
          createdAt: atTime,
        },
      });

      return reqResult;
    });

    const full = await this.prisma.consultationRequest.findUnique({
      where: { id: requestId },
      include: {
        customer: true,
        service: true,
        assignedStaff: true,
        events: { orderBy: { createdAt: 'asc' } },
      },
    });

    return this.formatDto(full, atTime);
  }

  /**
   * Close without booking.
   */
  async closeWithoutBooking(
    requestId: string,
    actorStaffId: string,
    note?: string,
    atTime: Date = new Date(),
  ): Promise<ConsultationRequestDto> {
    const existing = await this.prisma.consultationRequest.findUnique({
      where: { id: requestId },
    });
    if (!existing) {
      throw new NotFoundException('درخواست بررسی یافت نشد');
    }

    const budget = this.computeBudget(existing, atTime);

    const updated = await this.prisma.$transaction(async (tx) => {
      const req = await tx.consultationRequest.update({
        where: { id: requestId },
        data: {
          status: ConsultationStatus.CLOSED_WITHOUT_BOOKING,
          completedAt: atTime,
          elapsedActiveMinutes: budget.elapsedActiveMinutes,
          lastActiveTimerStartedAt: null,
          isPaused: false,
          version: { increment: 1 },
        },
        include: {
          customer: true,
          service: true,
          assignedStaff: true,
        },
      });

      await tx.consultationRequestEvent.create({
        data: {
          requestId,
          eventType: ConsultationEventType.CLOSED,
          fromStatus: existing.status,
          toStatus: ConsultationStatus.CLOSED_WITHOUT_BOOKING,
          actorStaffId,
          note: note ?? 'بسته‌شده بدون تبدیل به رزرو',
          createdAt: atTime,
        },
      });

      await tx.auditLog.create({
        data: {
          staffId: actorStaffId,
          eventType: SecurityEventType.CONSULTATION_REQUEST_CLOSED,
          details: { requestId, note },
          createdAt: atTime,
        },
      });

      return req;
    });

    const full = await this.prisma.consultationRequest.findUnique({
      where: { id: requestId },
      include: {
        customer: true,
        service: true,
        assignedStaff: true,
        events: { orderBy: { createdAt: 'asc' } },
      },
    });

    return this.formatDto(full, atTime);
  }

  /**
   * Fetch a single request with IDOR boundary protection.
   */
  async getRequestById(requestId: string, requesterCustomerId?: string, atTime: Date = new Date()): Promise<ConsultationRequestDto> {
    const req = await this.prisma.consultationRequest.findUnique({
      where: { id: requestId },
      include: {
        customer: true,
        service: true,
        assignedStaff: true,
        events: {
          include: { actorStaff: true, actorCustomer: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!req) {
      throw new NotFoundException('درخواست بررسی یافت نشد');
    }

    if (requesterCustomerId && req.customerId !== requesterCustomerId) {
      await this.prisma.auditLog.create({
        data: {
          customerId: requesterCustomerId,
          eventType: SecurityEventType.CUSTOMER_UNAUTHORIZED_ACCESS_ATTEMPT,
          details: { targetRequestId: requestId, action: 'GET_REQUEST_CROSS_ACCOUNT' },
          createdAt: atTime,
        },
      });
      throw new ForbiddenException('دسترسی غیرمجاز به درخواست سایر مشتریان');
    }

    return this.formatDto(req, atTime);
  }

  /**
   * List customer's own consultation requests.
   */
  async listCustomerRequests(customerId: string, atTime: Date = new Date()): Promise<ConsultationRequestDto[]> {
    const requests = await this.prisma.consultationRequest.findMany({
      where: { customerId },
      include: {
        customer: true,
        service: true,
        assignedStaff: true,
        events: { orderBy: { createdAt: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return requests.map((r) => this.formatDto(r, atTime));
  }

  /**
   * Staff query for salon requests.
   */
  async listStaffRequests(
    filters?: { status?: ConsultationStatus; assignedStaffId?: string },
    atTime: Date = new Date(),
  ): Promise<ConsultationRequestDto[]> {
    const where: any = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.assignedStaffId) where.assignedStaffId = filters.assignedStaffId;

    const requests = await this.prisma.consultationRequest.findMany({
      where,
      include: {
        customer: true,
        service: true,
        assignedStaff: true,
        events: { orderBy: { createdAt: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return requests.map((r) => this.formatDto(r, atTime));
  }
}
