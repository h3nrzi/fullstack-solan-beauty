import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { PrismaClient, StaffRole } from '@salon/database';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { StaffAuthService } from '../src/auth/staff-auth.service';

describe('Concurrency - Seam 3: Database Concurrency Seam', () => {
  const prisma1 = new PrismaClient();
  const prisma2 = new PrismaClient();

  beforeEach(async () => {
    await prisma1.auditLog.deleteMany();
    await prisma1.session.deleteMany();
    await prisma1.recoveryCode.deleteMany();
    await prisma1.independentRecoveryRequest.deleteMany();
    await prisma1.staff.deleteMany();
  });

  afterAll(async () => {
    await prisma1.$disconnect();
    await prisma2.$disconnect();
  });

  it('prevents double-spending of a recovery code under concurrent parallel execution with independent DB connections', async () => {
    const rawRecoveryCode = 'RACE-1234-CODE-5678';
    const codeHash = crypto.createHash('sha256').update(rawRecoveryCode).digest('hex');

    const passwordHash = await argon2.hash('SecretPass123!');
    const staff = await prisma1.staff.create({
      data: {
        username: 'race_staff_user',
        fullName: 'Zahra Karimi',
        role: StaffRole.ARTIST,
        passwordHash,
        mfaEnabled: true,
        mfaSecret: 'JBSWY3DPEHPK3PXP',
        recoveryCodes: {
          create: [{ codeHash }],
        },
      },
    });

    const authService1 = new StaffAuthService(prisma1);
    const authService2 = new StaffAuthService(prisma2);

    const loginRes1 = await authService1.login('race_staff_user', 'SecretPass123!');
    const loginRes2 = await authService2.login('race_staff_user', 'SecretPass123!');

    const [result1, result2] = await Promise.allSettled([
      authService1.verifyRecoveryCode(loginRes1.tempToken!, rawRecoveryCode, {
        ipAddress: '192.168.1.1',
      }),
      authService2.verifyRecoveryCode(loginRes2.tempToken!, rawRecoveryCode, {
        ipAddress: '192.168.1.2',
      }),
    ]);

    const successes = [result1, result2].filter((r) => r.status === 'fulfilled');
    const failures = [result1, result2].filter((r) => r.status === 'rejected');

    expect(successes.length).toBe(1);
    expect(failures.length).toBe(1);

    const sessions = await prisma1.session.findMany({
      where: { staffId: staff.id },
    });
    expect(sessions.length).toBe(1);

    const usedCode = await prisma1.recoveryCode.findFirst({
      where: { staffId: staff.id },
    });
    expect(usedCode!.usedAt).not.toBeNull();
  });
});
