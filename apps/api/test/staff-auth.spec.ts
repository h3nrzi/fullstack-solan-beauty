import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { PrismaClient, StaffRole } from '@salon/database';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { authenticator } from 'otplib';
import { StaffAuthService } from '../src/auth/staff-auth.service';

const prisma = new PrismaClient();

describe('StaffAuthService - Seam 2: Domain Service Seam', () => {
  let authService: StaffAuthService;

  beforeEach(async () => {
    await prisma.auditLog.deleteMany();
    await prisma.session.deleteMany();
    await prisma.recoveryCode.deleteMany();
    await prisma.independentRecoveryRequest.deleteMany();
    await prisma.staff.deleteMany();

    authService = new StaffAuthService(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('rejects login with invalid username or password', async () => {
    await expect(
      authService.login('nonexistent', 'password123')
    ).rejects.toThrow('Invalid credentials');
  });

  it('returns MFA challenge when credentials are valid and MFA is enabled', async () => {
    const passwordHash = await argon2.hash('SecretPass123!');
    const staff = await prisma.staff.create({
      data: {
        username: 'reception_user',
        fullName: 'Sara Rezaei',
        role: StaffRole.RECEPTIONIST,
        passwordHash,
        mfaEnabled: true,
        mfaSecret: 'JBSWY3DPEHPK3PXP',
      },
    });

    const result = await authService.login('reception_user', 'SecretPass123!');

    expect(result.mfaRequired).toBe(true);
    expect(result.tempToken).toBeDefined();

    const logs = await prisma.auditLog.findMany({
      where: { staffId: staff.id },
    });
    expect(logs.length).toBeGreaterThan(0);
    expect(logs[0].eventType).toBe('MFA_CHALLENGE');
  });

  it('rejects verifyMfa with invalid TOTP code', async () => {
    const passwordHash = await argon2.hash('SecretPass123!');
    const staff = await prisma.staff.create({
      data: {
        username: 'reception_user',
        fullName: 'Sara Rezaei',
        role: StaffRole.RECEPTIONIST,
        passwordHash,
        mfaEnabled: true,
        mfaSecret: 'JBSWY3DPEHPK3PXP',
      },
    });

    const loginRes = await authService.login('reception_user', 'SecretPass123!');

    await expect(
      authService.verifyMfa(loginRes.tempToken!, '000000')
    ).rejects.toThrow('Invalid MFA code');

    const logs = await prisma.auditLog.findMany({
      where: { staffId: staff.id, eventType: 'MFA_FAILED' },
    });
    expect(logs.length).toBe(1);
  });

  it('creates active revocable session on valid TOTP code', async () => {
    const secret = 'JBSWY3DPEHPK3PXP';
    const passwordHash = await argon2.hash('SecretPass123!');
    const staff = await prisma.staff.create({
      data: {
        username: 'reception_user',
        fullName: 'Sara Rezaei',
        role: StaffRole.RECEPTIONIST,
        passwordHash,
        mfaEnabled: true,
        mfaSecret: secret,
      },
    });

    const loginRes = await authService.login('reception_user', 'SecretPass123!');

    const validCode = authenticator.generate(secret);
    const sessionResult = await authService.verifyMfa(loginRes.tempToken!, validCode, {
      ipAddress: '127.0.0.1',
      userAgent: 'Vitest/Test-Agent',
    });

    expect(sessionResult.sessionToken).toBeDefined();
    expect(sessionResult.staff.id).toBe(staff.id);
    expect(sessionResult.staff.role).toBe(StaffRole.RECEPTIONIST);

    const sessionInDb = await prisma.session.findFirst({
      where: { staffId: staff.id },
    });
    expect(sessionInDb).toBeDefined();
    expect(sessionInDb!.revokedAt).toBeNull();
    expect(sessionInDb!.userAgent).toBe('Vitest/Test-Agent');

    // Temp token must be consumed and cannot be reused
    await expect(
      authService.verifyMfa(loginRes.tempToken!, validCode)
    ).rejects.toThrow('Invalid or expired MFA session');
  });

  it('allows login with a one-time recovery code, burns the code, and rejects reuse', async () => {
    const rawRecoveryCode = 'ABCD-1234-EFGH-5678';
    const codeHash = crypto.createHash('sha256').update(rawRecoveryCode).digest('hex');

    const passwordHash = await argon2.hash('SecretPass123!');
    const staff = await prisma.staff.create({
      data: {
        username: 'artist_user',
        fullName: 'Mina Karimi',
        role: StaffRole.ARTIST,
        passwordHash,
        mfaEnabled: true,
        mfaSecret: 'JBSWY3DPEHPK3PXP',
        recoveryCodes: {
          create: [{ codeHash }],
        },
      },
    });

    const loginRes = await authService.login('artist_user', 'SecretPass123!');

    const sessionResult = await authService.verifyRecoveryCode(
      loginRes.tempToken!,
      rawRecoveryCode,
      { ipAddress: '127.0.0.1' }
    );

    expect(sessionResult.sessionToken).toBeDefined();
    expect(sessionResult.staff.id).toBe(staff.id);

    const usedCode = await prisma.recoveryCode.findFirst({
      where: { staffId: staff.id },
    });
    expect(usedCode!.usedAt).not.toBeNull();

    const auditLogs = await prisma.auditLog.findMany({
      where: { staffId: staff.id, eventType: 'RECOVERY_CODE_USED' },
    });
    expect(auditLogs.length).toBe(1);

    // Reuse must be rejected
    const secondLogin = await authService.login('artist_user', 'SecretPass123!');

    await expect(
      authService.verifyRecoveryCode(secondLogin.tempToken!, rawRecoveryCode)
    ).rejects.toThrow('Invalid or already used recovery code');
  });
});
