import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  PrismaClient,
  SecurityEventType,
  Customer,
} from '@salon/database';
import { CustomerAuthService, ISmsService } from '../src/auth/customer-auth.service';
import { UnauthorizedException, HttpException } from '@nestjs/common';

const prisma = new PrismaClient();

class MockSmsService implements ISmsService {
  public lastSentPhone: string | null = null;
  public lastSentCode: string | null = null;
  public shouldFail = false;

  async sendOtp(phone: string, code: string): Promise<void> {
    if (this.shouldFail) {
      throw new Error('KavehNegar gateway connection timeout');
    }
    this.lastSentPhone = phone;
    this.lastSentCode = code;
  }
}

describe('Domain Service Seam - Seam 1: Customer Auth & OTP Lifecycle', () => {
  let customerAuthService: CustomerAuthService;
  let mockSmsService: MockSmsService;

  beforeEach(async () => {
    await prisma.customerSession.deleteMany();
    await prisma.customerOtp.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.customer.deleteMany();

    mockSmsService = new MockSmsService();
    customerAuthService = new CustomerAuthService(prisma, mockSmsService);
  });

  it('generates OTP, sends via SMS, and verifies successfully to create persistent customer', async () => {
    const phone = '09123456789';

    const reqResult = await customerAuthService.requestOtp(phone);
    expect(reqResult.success).toBe(true);
    expect(reqResult.expiresInSeconds).toBe(120);
    expect(mockSmsService.lastSentPhone).toBe(phone);
    expect(mockSmsService.lastSentCode).toBeDefined();
    expect(mockSmsService.lastSentCode?.length).toBe(6);

    // Verify OTP
    const code = mockSmsService.lastSentCode!;
    const loginResult = await customerAuthService.verifyOtp(phone, code);

    expect(loginResult.sessionToken).toBeDefined();
    expect(loginResult.customer.phone).toBe(phone);
    expect(loginResult.customer.isActive).toBe(true);

    // Verify Audit Logs
    const logs = await prisma.auditLog.findMany({
      where: { eventType: { in: [SecurityEventType.CUSTOMER_OTP_REQUESTED, SecurityEventType.CUSTOMER_LOGIN_SUCCESS] } },
    });
    expect(logs.length).toBe(2);

    // Re-login with the same phone in future reuses the same customer identity
    const secondReq = await customerAuthService.requestOtp(phone, undefined, true); // force allow for test
    const secondLogin = await customerAuthService.verifyOtp(phone, mockSmsService.lastSentCode!);
    expect(secondLogin.customer.id).toBe(loginResult.customer.id);
  });

  it('prevents replay attack: reusing an OTP code is rejected', async () => {
    const phone = '09123456789';
    await customerAuthService.requestOtp(phone);
    const code = mockSmsService.lastSentCode!;

    // First use passes
    await customerAuthService.verifyOtp(phone, code);

    // Second use must fail
    await expect(customerAuthService.verifyOtp(phone, code)).rejects.toThrow(UnauthorizedException);
  });

  it('rejects expired OTP tokens', async () => {
    const phone = '09123456789';
    await customerAuthService.requestOtp(phone);
    const code = mockSmsService.lastSentCode!;

    // Artificially expire the token in DB
    await prisma.customerOtp.updateMany({
      where: { phone },
      data: { expiresAt: new Date(Date.now() - 10000) },
    });

    await expect(customerAuthService.verifyOtp(phone, code)).rejects.toThrow(UnauthorizedException);
  });

  it('enforces attempt limits: invalid attempts increment counter and block further tries', async () => {
    const phone = '09123456789';
    await customerAuthService.requestOtp(phone);

    // 5 failed attempts with wrong code
    for (let i = 0; i < 5; i++) {
      await expect(customerAuthService.verifyOtp(phone, '000000')).rejects.toThrow(UnauthorizedException);
    }

    // Now even with correct code, it must be locked out
    const correctCode = mockSmsService.lastSentCode!;
    await expect(customerAuthService.verifyOtp(phone, correctCode)).rejects.toThrow(
      /Too many failed attempts|بیش از حد مجاز/,
    );
  });

  it('enforces request cooldown: requesting new OTP within cooldown throws error', async () => {
    const phone = '09123456789';
    await customerAuthService.requestOtp(phone);

    // Immediately request again without bypass
    await expect(customerAuthService.requestOtp(phone)).rejects.toThrow(HttpException);
  });

  it('fails safe when SMS gateway suffers an outage, never bypassing authentication', async () => {
    const phone = '09123456789';
    mockSmsService.shouldFail = true;

    await expect(customerAuthService.requestOtp(phone)).rejects.toThrow(/SMS service unavailable|سامانه پیامک/);

    // Assert no usable OTP exists in database
    const validOtps = await prisma.customerOtp.findMany({
      where: { phone, usedAt: null, expiresAt: { gt: new Date() } },
    });
    expect(validOtps.length).toBe(0);
  });
});
