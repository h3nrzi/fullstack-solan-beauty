import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { PrismaClient, StaffRole } from '@salon/database';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { SessionService } from '../src/auth/session.service';
import { StaffManagementService } from '../src/auth/staff-management.service';

const prisma = new PrismaClient();

describe('SessionService & StaffManagementService - Seam 2: Domain Service Seam', () => {
  let sessionService: SessionService;
  let staffManagementService: StaffManagementService;

  beforeEach(async () => {
    await prisma.auditLog.deleteMany();
    await prisma.session.deleteMany();
    await prisma.recoveryCode.deleteMany();
    await prisma.independentRecoveryRequest.deleteMany();
    await prisma.staff.deleteMany();

    sessionService = new SessionService(prisma);
    staffManagementService = new StaffManagementService(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('validates active session and reflects immediate role change or revocation on the very next request', async () => {
    const passwordHash = await argon2.hash('SecretPass123!');
    const staff = await prisma.staff.create({
      data: {
        username: 'reception_user',
        fullName: 'Sara Rezaei',
        role: StaffRole.RECEPTIONIST,
        passwordHash,
        isActive: true,
      },
    });

    const sessionToken = crypto.randomBytes(48).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(sessionToken).digest('hex');
    await prisma.session.create({
      data: {
        staffId: staff.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
      },
    });

    // 1. Initial check
    const initialValidation = await sessionService.validateSession(sessionToken);
    expect(initialValidation.staff.id).toBe(staff.id);
    expect(initialValidation.staff.role).toBe(StaffRole.RECEPTIONIST);

    // 2. Role changes in database via StaffManagementService
    await staffManagementService.changeStaffRole({
      targetStaffId: staff.id,
      newRole: StaffRole.ARTIST,
      changedByStaffId: 'manager-admin-id',
    });

    // 3. Very next request with same session immediately reflects ARTIST
    const updatedValidation = await sessionService.validateSession(sessionToken);
    expect(updatedValidation.staff.role).toBe(StaffRole.ARTIST);

    // 4. Manager revokes staff sessions
    await sessionService.revokeAllStaffSessions(staff.id, 'manager-admin-id');

    // 5. Very next request is rejected with session revoked
    await expect(sessionService.validateSession(sessionToken)).rejects.toThrow(
      'Session revoked or expired'
    );

    // 6. Historical records preserved
    const sessionInDb = await prisma.session.findFirst({
      where: { tokenHash },
    });
    expect(sessionInDb).not.toBeNull();
    expect(sessionInDb!.revokedAt).not.toBeNull();
  });

  it('rejects deactivated staff immediately on active session', async () => {
    const passwordHash = await argon2.hash('SecretPass123!');
    const staff = await prisma.staff.create({
      data: {
        username: 'accountant_user',
        fullName: 'Ali Ahmadi',
        role: StaffRole.ACCOUNTANT,
        passwordHash,
        isActive: true,
      },
    });

    const sessionToken = crypto.randomBytes(48).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(sessionToken).digest('hex');
    await prisma.session.create({
      data: {
        staffId: staff.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
      },
    });

    await prisma.staff.update({
      where: { id: staff.id },
      data: { isActive: false },
    });

    await expect(sessionService.validateSession(sessionToken)).rejects.toThrow(
      'Staff account deactivated'
    );
  });
});
