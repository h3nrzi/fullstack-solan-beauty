import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  BadGatewayException,
  HttpException,
  HttpStatus,
  Inject,
  Optional,
} from '@nestjs/common';
import {
  PrismaClient,
  SecurityEventType,
  Customer,
  CustomerSession,
} from '@salon/database';
import * as crypto from 'crypto';
import { RequestContext } from './dto/auth.dto';

export interface ISmsService {
  sendOtp(phone: string, code: string): Promise<void>;
}

export const SMS_SERVICE = 'SMS_SERVICE';

@Injectable()
export class DefaultSmsService implements ISmsService {
  async sendOtp(phone: string, code: string): Promise<void> {
    // In production, integrate with KavehNegar, Ghasedak, or Magfa.
    // In dev / test, log the OTP safely.
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[SMS-MOCK] Sending OTP ${code} to ${phone}`);
    }
  }
}

export interface CustomerAuthResult {
  sessionToken: string;
  customer: Customer;
}

export interface ValidatedCustomerSession {
  customer: Customer;
  session: CustomerSession;
}

@Injectable()
export class CustomerAuthService {
  constructor(
    private readonly prisma: PrismaClient,
    @Optional()
    @Inject(SMS_SERVICE)
    private readonly smsService: ISmsService = new DefaultSmsService(),
  ) {}

  normalizePhone(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('98') && cleaned.length === 12) {
      return '0' + cleaned.slice(2);
    }
    if (cleaned.length === 10 && cleaned.startsWith('9')) {
      return '0' + cleaned;
    }
    return cleaned;
  }

  async requestOtp(
    phone: string,
    context?: RequestContext,
    ignoreCooldown = false,
  ): Promise<{ success: boolean; expiresInSeconds: number }> {
    const normalized = this.normalizePhone(phone);
    if (!normalized.startsWith('09') || normalized.length !== 11) {
      throw new HttpException('شماره موبایل وارد شده معتبر نیست', HttpStatus.BAD_REQUEST);
    }

    // Cooldown check (60 seconds)
    if (!ignoreCooldown) {
      const recentOtp = await this.prisma.customerOtp.findFirst({
        where: {
          phone: normalized,
          usedAt: null,
          createdAt: { gt: new Date(Date.now() - 60 * 1000) },
        },
      });

      if (recentOtp) {
        throw new HttpException(
          'لطفاً تا پایان زمان انتظار شکیبا باشید و سپس مجدداً تلاش کنید',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    const code = crypto.randomInt(100000, 999999).toString();
    const codeHash = crypto.createHash('sha256').update(code).digest('hex');
    const expiresInSeconds = 120; // 2 minutes
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

    const otp = await this.prisma.customerOtp.create({
      data: {
        phone: normalized,
        codeHash,
        expiresAt,
        maxAttempts: 5,
      },
    });

    try {
      await this.smsService.sendOtp(normalized, code);
    } catch (error) {
      // Fail-safe: SMS outage must NEVER permit unauthenticated bypass. Invalidate the created OTP immediately.
      await this.prisma.customerOtp.delete({
        where: { id: otp.id },
      }).catch(() => null);

      await this.prisma.auditLog.create({
        data: {
          eventType: SecurityEventType.CUSTOMER_OTP_FAILED,
          details: {
            phone: normalized,
            error: error instanceof Error ? error.message : 'Unknown SMS error',
            reason: 'SMS_GATEWAY_OUTAGE',
          },
          ipAddress: context?.ipAddress,
        },
      });

      throw new BadGatewayException('سامانه پیامک در دسترس نیست؛ ورود ناممکن است. (SMS service unavailable)');
    }

    await this.prisma.auditLog.create({
      data: {
        eventType: SecurityEventType.CUSTOMER_OTP_REQUESTED,
        details: { phone: normalized, otpId: otp.id },
        ipAddress: context?.ipAddress,
      },
    });

    return {
      success: true,
      expiresInSeconds,
    };
  }

  async verifyOtp(
    phone: string,
    code: string,
    context?: RequestContext,
  ): Promise<CustomerAuthResult> {
    const normalized = this.normalizePhone(phone);

    // Fetch the latest unconsumed OTP
    const latestOtp = await this.prisma.customerOtp.findFirst({
      where: {
        phone: normalized,
        usedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!latestOtp || new Date() > latestOtp.expiresAt) {
      throw new UnauthorizedException('کد تأیید منقضی شده است یا یافت نشد (OTP expired or not found)');
    }

    if (latestOtp.attempts >= latestOtp.maxAttempts) {
      throw new UnauthorizedException('تعداد تلاش‌های ناموفق بیش از حد مجاز است. لطفاً کد جدید دریافت کنید (Too many failed attempts)');
    }

    const inputHash = crypto.createHash('sha256').update(code).digest('hex');

    if (inputHash !== latestOtp.codeHash) {
      const updatedOtp = await this.prisma.customerOtp.update({
        where: { id: latestOtp.id },
        data: { attempts: { increment: 1 } },
      });

      await this.prisma.auditLog.create({
        data: {
          eventType: SecurityEventType.CUSTOMER_OTP_FAILED,
          details: { phone: normalized, attempts: updatedOtp.attempts },
          ipAddress: context?.ipAddress,
        },
      });

      if (updatedOtp.attempts >= updatedOtp.maxAttempts) {
        throw new UnauthorizedException('تعداد تلاش‌های ناموفق بیش از حد مجاز است. لطفاً کد جدید دریافت کنید (Too many failed attempts)');
      }

      throw new UnauthorizedException('کد وارد شده صحیح نمی‌باشد (Invalid OTP code)');
    }

    // Atomic transaction for single-use consumption & persistent identity
    return await this.prisma.$transaction(async (tx) => {
      // Atomic conditional update to prevent double spending under concurrency
      const updateResult = await tx.customerOtp.updateMany({
        where: {
          id: latestOtp.id,
          usedAt: null,
        },
        data: { usedAt: new Date() },
      });

      if (updateResult.count === 0) {
        throw new UnauthorizedException('کد تأیید قبلاً استفاده شده است (OTP already used)');
      }

      let customer = await tx.customer.findUnique({
        where: { phone: normalized },
      });

      if (!customer) {
        customer = await tx.customer.create({
          data: {
            phone: normalized,
            isActive: true,
          },
        });
      } else if (!customer.isActive) {
        throw new UnauthorizedException('حساب کاربری مسدود است (Customer account deactivated)');
      }

      // Create session
      const sessionToken = crypto.randomBytes(48).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(sessionToken).digest('hex');
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

      await tx.customerSession.create({
        data: {
          customerId: customer.id,
          tokenHash,
          expiresAt,
          ipAddress: context?.ipAddress,
          userAgent: context?.userAgent,
        },
      });

      await tx.auditLog.create({
        data: {
          customerId: customer.id,
          eventType: SecurityEventType.CUSTOMER_LOGIN_SUCCESS,
          details: { phone: normalized, method: 'OTP' },
          ipAddress: context?.ipAddress,
        },
      });

      return {
        sessionToken,
        customer,
      };
    });
  }

  async validateSession(sessionToken: string): Promise<ValidatedCustomerSession> {
    if (!sessionToken) {
      throw new UnauthorizedException('Session token missing');
    }

    const tokenHash = crypto.createHash('sha256').update(sessionToken).digest('hex');

    const session = await this.prisma.customerSession.findUnique({
      where: { tokenHash },
      include: { customer: true },
    });

    if (!session || session.revokedAt || new Date() > session.expiresAt) {
      throw new UnauthorizedException('Customer session expired or revoked');
    }

    if (!session.customer || !session.customer.isActive) {
      throw new UnauthorizedException('Customer account inactive');
    }

    return {
      customer: session.customer,
      session,
    };
  }

  async revokeSession(sessionToken: string, context?: RequestContext): Promise<void> {
    const tokenHash = crypto.createHash('sha256').update(sessionToken).digest('hex');

    const session = await this.prisma.customerSession.findUnique({
      where: { tokenHash },
    });

    if (session && !session.revokedAt) {
      await this.prisma.customerSession.update({
        where: { id: session.id },
        data: { revokedAt: new Date() },
      });

      await this.prisma.auditLog.create({
        data: {
          customerId: session.customerId,
          eventType: SecurityEventType.CUSTOMER_SESSION_REVOKED,
          details: { sessionId: session.id, reason: 'CUSTOMER_LOGOUT' },
          ipAddress: context?.ipAddress,
        },
      });
    }
  }

  async getProfile(
    targetCustomerId: string,
    currentCustomer: Customer,
    context?: RequestContext,
  ): Promise<{ customer: Customer }> {
    if (targetCustomerId !== currentCustomer.id) {
      await this.prisma.auditLog.create({
        data: {
          customerId: currentCustomer.id,
          eventType: SecurityEventType.CUSTOMER_UNAUTHORIZED_ACCESS_ATTEMPT,
          details: {
            attemptedCustomerId: targetCustomerId,
            actualCustomerId: currentCustomer.id,
            reason: 'IDOR_VIOLATION',
          },
          ipAddress: context?.ipAddress,
        },
      });

      throw new ForbiddenException(
        'دسترسی غیرمجاز به اطلاعات مشتری دیگر (Forbidden: IDOR protection)',
      );
    }

    return { customer: currentCustomer };
  }

  async getCustomerBookings(customerId: string) {
    return this.prisma.serviceBooking.findMany({
      where: { customerId },
      include: {
        service: true,
        artist: {
          include: {
            staff: {
              select: {
                fullName: true,
              },
            },
          },
        },
      },
      orderBy: { startTime: 'desc' },
    });
  }
}
