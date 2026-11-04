import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { PrismaClient, StaffRole } from '@salon/database';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { IndependentRecoveryService } from '../src/auth/independent-recovery.service';

const prisma = new PrismaClient();

describe('IndependentRecoveryService - Seam 2: Domain Service Seam', () => {
  let recoveryService: IndependentRecoveryService;

  beforeEach(async () => {
    await prisma.auditLog.deleteMany();
    await prisma.session.deleteMany();
    await prisma.recoveryCode.deleteMany();
    await prisma.independentRecoveryRequest.deleteMany();
    await prisma.staff.deleteMany();

    recoveryService = new IndependentRecoveryService(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('prohibits self-approval when a manager requests emergency account recovery', async () => {
    const passwordHash = await argon2.hash('ManagerPass123!');
    const manager1 = await prisma.staff.create({
      data: {
        username: 'head_manager',
        fullName: 'Maryam Tehrani',
        role: StaffRole.MANAGER,
        passwordHash,
        mfaEnabled: true,
        mfaSecret: 'JBSWY3DPEHPK3PXP',
      },
    });

    const request = await recoveryService.createRecoveryRequest({
      targetStaffId: manager1.id,
      requesterNote: 'Lost mobile device and recovery codes',
    });

    expect(request.status).toBe('PENDING');

    // Self-approval must be rejected
    await expect(
      recoveryService.approveRecoveryRequest({
        requestId: request.id,
        approverStaffId: manager1.id,
      })
    ).rejects.toThrow('Self-approval is forbidden');
  });

  it('allows approval by an independent manager, delivering claimToken to target staff and preserving recovery code history via soft revocation', async () => {
    const passwordHash = await argon2.hash('ManagerPass123!');
    const manager1 = await prisma.staff.create({
      data: {
        username: 'head_manager',
        fullName: 'Maryam Tehrani',
        role: StaffRole.MANAGER,
        passwordHash,
        mfaEnabled: true,
        mfaSecret: 'OLD_MFA_SECRET',
      },
    });

    const manager2 = await prisma.staff.create({
      data: {
        username: 'co_manager',
        fullName: 'Neda Rad',
        role: StaffRole.MANAGER,
        passwordHash,
        mfaEnabled: true,
        mfaSecret: 'CO_MFA_SECRET',
      },
    });

    // Seed old recovery code for manager1
    const oldCodeHash = crypto.createHash('sha256').update('OLD-RECOVERY-CODE').digest('hex');
    await prisma.recoveryCode.create({
      data: {
        staffId: manager1.id,
        codeHash: oldCodeHash,
      },
    });

    // Seed active session for manager1
    await prisma.session.create({
      data: {
        staffId: manager1.id,
        tokenHash: 'dummy_token_hash_1',
        expiresAt: new Date(Date.now() + 100000),
      },
    });

    const request = await recoveryService.createRecoveryRequest({
      targetStaffId: manager1.id,
      requesterNote: 'Device lost, verified in person by co-manager',
    });

    // 1. Manager 2 approves (receives claimToken, NOT manager1's secret credentials!)
    const approved = await recoveryService.approveRecoveryRequest({
      requestId: request.id,
      approverStaffId: manager2.id,
    });

    expect(approved.status).toBe('APPROVED');
    expect(approved.claimToken).toBeDefined();

    // 2. Target manager claims their recovery credentials
    const claimed = await recoveryService.claimRecovery(request.id, approved.claimToken);
    expect(claimed.targetStaffId).toBe(manager1.id);
    expect(claimed.newRecoveryCodes.length).toBeGreaterThan(0);
    expect(claimed.newMfaSecret).toBeDefined();

    // 3. Old recovery codes must be SOFT-REVOKED (revokedAt is set, not deleted!)
    const oldCodes = await prisma.recoveryCode.findMany({
      where: { staffId: manager1.id, codeHash: oldCodeHash },
    });
    expect(oldCodes.length).toBe(1);
    expect(oldCodes[0].revokedAt).not.toBeNull();

    // 4. Old sessions revoked
    const activeSessions = await prisma.session.findMany({
      where: { staffId: manager1.id, revokedAt: null },
    });
    expect(activeSessions.length).toBe(0);

    // 5. Audit logs recorded
    const logs = await prisma.auditLog.findMany({
      where: { staffId: manager1.id },
    });
    const eventTypes = logs.map((l) => l.eventType);
    expect(eventTypes).toContain('INDEPENDENT_RECOVERY_REQUESTED');
    expect(eventTypes).toContain('INDEPENDENT_RECOVERY_APPROVED');
  });
});
