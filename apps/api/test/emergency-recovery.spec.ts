import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { PrismaClient, StaffRole } from '@salon/database';
import * as argon2 from 'argon2';
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

    // Manager requests emergency recovery because MFA factor and recovery codes were lost
    const request = await recoveryService.createRecoveryRequest({
      targetStaffId: manager1.id,
      requesterNote: 'Lost mobile device and recovery codes',
    });

    expect(request.status).toBe('PENDING');

    // Self-approval must be rejected
    await expect(
      recoveryService.approveRecoveryRequest({
        requestId: request.id,
        approverStaffId: manager1.id, // Same manager!
      })
    ).rejects.toThrow('Self-approval is forbidden');
  });

  it('allows approval by an independent manager, revoking old sessions and generating new factor credentials', async () => {
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

    // Create an old active session for manager1
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

    // Manager 2 approves
    const approved = await recoveryService.approveRecoveryRequest({
      requestId: request.id,
      approverStaffId: manager2.id,
    });

    expect(approved.status).toBe('APPROVED');
    expect(approved.newRecoveryCodes.length).toBeGreaterThan(0);

    // Old session must have been revoked
    const oldSessions = await prisma.session.findMany({
      where: { staffId: manager1.id, revokedAt: null },
    });
    expect(oldSessions.length).toBe(0);

    // Audit logs must record both request and approval
    const logs = await prisma.auditLog.findMany({
      where: { staffId: manager1.id },
    });
    const eventTypes = logs.map((l) => l.eventType);
    expect(eventTypes).toContain('INDEPENDENT_RECOVERY_REQUESTED');
    expect(eventTypes).toContain('INDEPENDENT_RECOVERY_APPROVED');
  });
});
