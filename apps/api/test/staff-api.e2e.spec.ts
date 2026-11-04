import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { authenticator } from 'otplib';
import { PrismaClient, StaffRole } from '@salon/database';
import { AppModule } from '../src/app.module';

const prisma = new PrismaClient();

describe('HTTP API Seam - Seam 1: Staff Access E2E Endpoints', () => {
  let app: INestApplication;

  beforeEach(async () => {
    await prisma.auditLog.deleteMany();
    await prisma.session.deleteMany();
    await prisma.recoveryCode.deleteMany();
    await prisma.independentRecoveryRequest.deleteMany();
    await prisma.staff.deleteMany();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it('verifies the full evaluator workflow: login, immediate server-side revocation on next request, and recovery code reuse rejection', async () => {
    const passwordHash = await argon2.hash('SecretPass123!');
    const managerSecret = 'JBSWY3DPEHPK3PXP';
    const receptionSecret = 'JBSWY3DPEHPK3PXQ';

    const rawRecoveryCode = 'RECP-1234-CODE-5678';
    const recoveryCodeHash = crypto.createHash('sha256').update(rawRecoveryCode).digest('hex');

    // 1. Seed Manager and Receptionist staff
    const manager = await prisma.staff.create({
      data: {
        username: 'admin_manager',
        fullName: 'Zahra Modir',
        role: StaffRole.MANAGER,
        passwordHash,
        mfaEnabled: true,
        mfaSecret: managerSecret,
      },
    });

    const receptionist = await prisma.staff.create({
      data: {
        username: 'reception_staff',
        fullName: 'Niloofar Pazireshi',
        role: StaffRole.RECEPTIONIST,
        passwordHash,
        mfaEnabled: true,
        mfaSecret: receptionSecret,
        recoveryCodes: {
          create: [{ codeHash: recoveryCodeHash }],
        },
      },
    });

    // 2. Login Manager (Password + TOTP)
    const mgrLoginRes = await request(app.getHttpServer())
      .post('/api/auth/staff/login')
      .send({ username: 'admin_manager', password: 'SecretPass123!' })
      .expect(200);

    expect(mgrLoginRes.body.mfaRequired).toBe(true);
    const mgrTempToken = mgrLoginRes.body.tempToken;

    const mgrTotpCode = authenticator.generate(managerSecret);
    const mgrMfaRes = await request(app.getHttpServer())
      .post('/api/auth/staff/mfa-verify')
      .send({ tempToken: mgrTempToken, code: mgrTotpCode })
      .expect(200);

    const mgrCookie = mgrMfaRes.headers['set-cookie'];
    expect(mgrCookie).toBeDefined();

    // 3. Login Receptionist with Recovery Code
    const recLoginRes = await request(app.getHttpServer())
      .post('/api/auth/staff/login')
      .send({ username: 'reception_staff', password: 'SecretPass123!' })
      .expect(200);

    const recTempToken = recLoginRes.body.tempToken;

    const recRecoveryRes = await request(app.getHttpServer())
      .post('/api/auth/staff/recovery-verify')
      .send({ tempToken: recTempToken, recoveryCode: rawRecoveryCode })
      .expect(200);

    const recCookie = recRecoveryRes.headers['set-cookie'];
    expect(recCookie).toBeDefined();

    // 4. Receptionist makes protected request GET /api/staff/me -> 200 OK
    const meResBefore = await request(app.getHttpServer())
      .get('/api/staff/me')
      .set('Cookie', recCookie)
      .expect(200);

    expect(meResBefore.body.role).toBe(StaffRole.RECEPTIONIST);
    expect(meResBefore.body.id).toBe(receptionist.id);

    // 5. Manager revokes Receptionist's active sessions via POST /api/staff/:id/revoke-sessions
    await request(app.getHttpServer())
      .post(`/api/staff/${receptionist.id}/revoke-sessions`)
      .set('Cookie', mgrCookie)
      .expect(200);

    // 6. Receptionist immediately resends the SAME protected request GET /api/staff/me -> 401 Unauthorized!
    await request(app.getHttpServer())
      .get('/api/staff/me')
      .set('Cookie', recCookie)
      .expect(401);

    // 7. Receptionist attempts to use the SAME recovery code again -> 401 Unauthorized!
    const recSecondLogin = await request(app.getHttpServer())
      .post('/api/auth/staff/login')
      .send({ username: 'reception_staff', password: 'SecretPass123!' })
      .expect(200);

    await request(app.getHttpServer())
      .post('/api/auth/staff/recovery-verify')
      .send({ tempToken: recSecondLogin.body.tempToken, recoveryCode: rawRecoveryCode })
      .expect(401);
  });

  it('enforces RBAC, prohibits non-manager from sensitive operations, and reflects role updates in real-time', async () => {
    const passwordHash = await argon2.hash('SecretPass123!');
    const managerSecret = 'JBSWY3DPEHPK3PXP';
    const artistSecret = 'JBSWY3DPEHPK3PXQ';

    const manager = await prisma.staff.create({
      data: {
        username: 'manager_admin',
        fullName: 'Admin User',
        role: StaffRole.MANAGER,
        passwordHash,
        mfaEnabled: true,
        mfaSecret: managerSecret,
      },
    });

    const artist = await prisma.staff.create({
      data: {
        username: 'artist_user',
        fullName: 'Artist User',
        role: StaffRole.ARTIST,
        passwordHash,
        mfaEnabled: true,
        mfaSecret: artistSecret,
      },
    });

    // Login Manager
    const mgrLogin = await request(app.getHttpServer())
      .post('/api/auth/staff/login')
      .send({ username: 'manager_admin', password: 'SecretPass123!' });
    const mgrTotp = authenticator.generate(managerSecret);
    const mgrMfa = await request(app.getHttpServer())
      .post('/api/auth/staff/mfa-verify')
      .send({ tempToken: mgrLogin.body.tempToken, code: mgrTotp });
    const mgrCookie = mgrMfa.headers['set-cookie'];

    // Login Artist
    const artistLogin = await request(app.getHttpServer())
      .post('/api/auth/staff/login')
      .send({ username: 'artist_user', password: 'SecretPass123!' });
    const artistTotp = authenticator.generate(artistSecret);
    const artistMfa = await request(app.getHttpServer())
      .post('/api/auth/staff/mfa-verify')
      .send({ tempToken: artistLogin.body.tempToken, code: artistTotp });
    const artistCookie = artistMfa.headers['set-cookie'];

    // 1. Artist attempts manager-only operation -> 403 Forbidden
    await request(app.getHttpServer())
      .post(`/api/staff/${manager.id}/revoke-sessions`)
      .set('Cookie', artistCookie)
      .expect(403);

    // 2. Manager promotes Artist to Receptionist
    await request(app.getHttpServer())
      .patch(`/api/staff/${artist.id}/role`)
      .set('Cookie', mgrCookie)
      .send({ role: StaffRole.RECEPTIONIST, reason: 'Promotion' })
      .expect(200);

    // 3. Artist with same session immediately gets updated role
    const updatedArtistMe = await request(app.getHttpServer())
      .get('/api/staff/me')
      .set('Cookie', artistCookie)
      .expect(200);

    expect(updatedArtistMe.body.role).toBe(StaffRole.RECEPTIONIST);
  });

  it('enforces independent manager approval for emergency recovery and rejects self-approval', async () => {
    const passwordHash = await argon2.hash('SecretPass123!');
    const manager1Secret = 'JBSWY3DPEHPK3PXP';
    const manager2Secret = 'JBSWY3DPEHPK3PXQ';

    const manager1 = await prisma.staff.create({
      data: {
        username: 'manager_one',
        fullName: 'Manager One',
        role: StaffRole.MANAGER,
        passwordHash,
        mfaEnabled: true,
        mfaSecret: manager1Secret,
      },
    });

    const manager2 = await prisma.staff.create({
      data: {
        username: 'manager_two',
        fullName: 'Manager Two',
        role: StaffRole.MANAGER,
        passwordHash,
        mfaEnabled: true,
        mfaSecret: manager2Secret,
      },
    });

    // 1. Manager 1 creates emergency recovery request (e.g. without login, by staff ID)
    const reqRes = await request(app.getHttpServer())
      .post('/api/staff/emergency-recovery/request')
      .send({ targetStaffId: manager1.id, requesterNote: 'Lost TOTP and recovery codes' })
      .expect(201);

    const requestId = reqRes.body.id;

    // Login Manager 1
    const m1Login = await request(app.getHttpServer())
      .post('/api/auth/staff/login')
      .send({ username: 'manager_one', password: 'SecretPass123!' });
    const m1Mfa = await request(app.getHttpServer())
      .post('/api/auth/staff/mfa-verify')
      .send({ tempToken: m1Login.body.tempToken, code: authenticator.generate(manager1Secret) });
    const m1Cookie = m1Mfa.headers['set-cookie'];

    // 2. Manager 1 tries to approve their own request -> 403 Forbidden!
    await request(app.getHttpServer())
      .post('/api/staff/emergency-recovery/approve')
      .set('Cookie', m1Cookie)
      .send({ requestId })
      .expect(403);

    // Login Manager 2
    const m2Login = await request(app.getHttpServer())
      .post('/api/auth/staff/login')
      .send({ username: 'manager_two', password: 'SecretPass123!' });
    const m2Mfa = await request(app.getHttpServer())
      .post('/api/auth/staff/mfa-verify')
      .send({ tempToken: m2Login.body.tempToken, code: authenticator.generate(manager2Secret) });
    const m2Cookie = m2Mfa.headers['set-cookie'];

    // 3. Manager 2 (independent) approves the request -> 200/201 OK
    const approveRes = await request(app.getHttpServer())
      .post('/api/staff/emergency-recovery/approve')
      .set('Cookie', m2Cookie)
      .send({ requestId })
      .expect(201);

    expect(approveRes.body.status).toBe('APPROVED');
    expect(approveRes.body.newRecoveryCodes.length).toBeGreaterThan(0);
  });
});
