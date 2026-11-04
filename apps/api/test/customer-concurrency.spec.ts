import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { PrismaClient } from '@salon/database';
import { CustomerAuthService, ISmsService } from '../src/auth/customer-auth.service';

describe('Concurrency - Seam 2: Database Concurrency & Atomic OTP Consumption', () => {
  const prisma1 = new PrismaClient();
  const prisma2 = new PrismaClient();

  class MockSms implements ISmsService {
    public lastCode: string | null = null;
    async sendOtp(phone: string, code: string): Promise<void> {
      this.lastCode = code;
    }
  }

  const mockSms = new MockSms();

  beforeEach(async () => {
    await prisma1.customerSession.deleteMany();
    await prisma1.customerOtp.deleteMany();
    await prisma1.auditLog.deleteMany();
    await prisma1.customer.deleteMany();
  });

  afterAll(async () => {
    await prisma1.$disconnect();
    await prisma2.$disconnect();
  });

  it('prevents race conditions: concurrent requests to verify the same OTP allow only one successful login', async () => {
    const authService1 = new CustomerAuthService(prisma1, mockSms);
    const authService2 = new CustomerAuthService(prisma2, mockSms);

    const phone = '09129876543';
    await authService1.requestOtp(phone);
    const code = mockSms.lastCode!;

    // Execute verifyOtp concurrently on independent DB connections
    const [res1, res2] = await Promise.allSettled([
      authService1.verifyOtp(phone, code, { ipAddress: '10.0.0.1' }),
      authService2.verifyOtp(phone, code, { ipAddress: '10.0.0.2' }),
    ]);

    const successes = [res1, res2].filter((r) => r.status === 'fulfilled');
    const failures = [res1, res2].filter((r) => r.status === 'rejected');

    expect(successes.length).toBe(1);
    expect(failures.length).toBe(1);

    // Exactly one session created in DB
    const sessions = await prisma1.customerSession.findMany();
    expect(sessions.length).toBe(1);

    // Exactly one customer created
    const customers = await prisma1.customer.findMany({ where: { phone } });
    expect(customers.length).toBe(1);

    // OTP is marked used
    const otpRecord = await prisma1.customerOtp.findFirst({ where: { phone } });
    expect(otpRecord?.usedAt).not.toBeNull();
  });
});
