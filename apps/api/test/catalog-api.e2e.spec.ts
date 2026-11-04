import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import * as crypto from 'crypto';
import { PrismaClient, StaffRole, ServicePriceType, ArtistLevel } from '@salon/database';
import { AppModule } from '../src/app.module';

const prisma = new PrismaClient();

async function createTestSessionToken(staffId: string): Promise<string> {
  const sessionToken = crypto.randomBytes(48).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(sessionToken).digest('hex');
  await prisma.session.create({
    data: {
      staffId,
      tokenHash,
      expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000),
    },
  });
  return sessionToken;
}

describe('HTTP API Seam - Seam 2: Catalog Public Endpoints & Confidentiality Boundary', () => {
  let app: INestApplication;

  let manager1Token: string;
  let manager2Token: string;
  let receptionistToken: string;

  let artistStaffId: string;
  let artistProfileId: string;
  let serviceId: string;

  beforeEach(async () => {
    await prisma.commissionContract.deleteMany();
    await prisma.artistServiceTariff.deleteMany();
    await prisma.artistProfile.deleteMany();
    await prisma.service.deleteMany();
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

    // 1. Manager 1
    const m1 = await prisma.staff.create({
      data: {
        username: 'manager_one',
        fullName: 'Maryam Modir',
        role: StaffRole.MANAGER,
        passwordHash: 'dummy',
        mfaEnabled: false,
      },
    });
    manager1Token = await createTestSessionToken(m1.id);

    // 2. Manager 2
    const m2 = await prisma.staff.create({
      data: {
        username: 'manager_two',
        fullName: 'Sara Modir',
        role: StaffRole.MANAGER,
        passwordHash: 'dummy',
        mfaEnabled: false,
      },
    });
    manager2Token = await createTestSessionToken(m2.id);

    // 3. Receptionist
    const rec = await prisma.staff.create({
      data: {
        username: 'reception_staff',
        fullName: 'Niloofar Reception',
        role: StaffRole.RECEPTIONIST,
        passwordHash: 'dummy',
        mfaEnabled: false,
      },
    });
    receptionistToken = await createTestSessionToken(rec.id);

    // 4. Artist
    const artist = await prisma.staff.create({
      data: {
        username: 'artist_shirin',
        fullName: 'Shirin Honarmand',
        role: StaffRole.ARTIST,
        passwordHash: 'dummy',
        mfaEnabled: false,
      },
    });
    artistStaffId = artist.id;
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it('allows public unauthenticated visitors to view and compare services and artist profiles without exposing internal contracts', async () => {
    // 1. Manager 1 creates a service via API
    const srvRes = await request(app.getHttpServer())
      .post('/api/admin/services')
      .set('Authorization', `Bearer ${manager1Token}`)
      .send({
        name: 'اصلاح و کوپ مو',
        description: 'کوپ تخصصی به همراه شستشو',
        priceType: ServicePriceType.FIXED,
        fixedPrice: 350000,
        durationMinutes: 45,
        requiresReview: false,
      })
      .expect(201);

    serviceId = srvRes.body.id;

    // Verify AuditLog for service creation
    const srvAudit = await prisma.auditLog.findFirst({
      where: { eventType: 'SERVICE_CREATED' as any },
    });
    expect(srvAudit).not.toBeNull();

    // 2. Manager 1 creates artist profile and tariff
    const artRes = await request(app.getHttpServer())
      .post('/api/admin/artists/profile')
      .set('Authorization', `Bearer ${manager1Token}`)
      .send({
        staffId: artistStaffId,
        bio: 'مدرس و استایلیست مو با ۱۰ سال تجربه',
        experienceYears: 10,
        level: ArtistLevel.MASTER,
        portfolioUrls: ['https://example.com/art1.jpg'],
      })
      .expect(201);

    artistProfileId = artRes.body.id;

    await request(app.getHttpServer())
      .post(`/api/admin/artists/${artistProfileId}/tariffs`)
      .set('Authorization', `Bearer ${manager1Token}`)
      .send({
        serviceId,
        priceType: ServicePriceType.FIXED,
        fixedPrice: 400000,
        durationMinutes: 45,
      })
      .expect(201);

    // 3. Manager 1 creates a confidential commission contract
    await request(app.getHttpServer())
      .post(`/api/admin/artists/${artistProfileId}/contracts`)
      .set('Authorization', `Bearer ${manager1Token}`)
      .send({
        commissionRate: 0.5,
        deductMaterialCost: true,
        effectiveFrom: new Date().toISOString(),
      })
      .expect(201);

    // 4. Public visitor requests services (NO AUTH) -> 200 OK
    const publicSrvRes = await request(app.getHttpServer())
      .get('/api/public/services')
      .expect(200);

    expect(Array.isArray(publicSrvRes.body)).toBe(true);
    expect(publicSrvRes.body.length).toBeGreaterThanOrEqual(1);
    expect(publicSrvRes.body[0].name).toBe('اصلاح و کوپ مو');

    // 5. Public visitor requests artists (NO AUTH) -> 200 OK
    const publicArtRes = await request(app.getHttpServer())
      .get('/api/public/artists')
      .expect(200);

    expect(Array.isArray(publicArtRes.body)).toBe(true);
    expect(publicArtRes.body.length).toBeGreaterThanOrEqual(1);
    const pubArtist = publicArtRes.body.find((a: any) => a.id === artistProfileId);
    expect(pubArtist).toBeDefined();
    expect(pubArtist.fullName).toBe('Shirin Honarmand');
    expect(pubArtist.level).toBe(ArtistLevel.MASTER);
    expect(pubArtist.tariffs).toHaveLength(1);

    // CRITICAL SECURITY ASSERTION: Internal contracts and rates MUST NOT leak to public
    expect(pubArtist.commissionRate).toBeUndefined();
    expect(pubArtist.contracts).toBeUndefined();
    expect(JSON.stringify(publicArtRes.body)).not.toContain('0.5');
    expect(JSON.stringify(publicArtRes.body)).not.toContain('PENDING_APPROVAL');
  });

  it('enforces RBAC and independent approval rules on commission contracts', async () => {
    // 1. Create artist profile
    const artRes = await request(app.getHttpServer())
      .post('/api/admin/artists/profile')
      .set('Authorization', `Bearer ${manager1Token}`)
      .send({
        staffId: artistStaffId,
        level: ArtistLevel.SENIOR,
      })
      .expect(201);
    artistProfileId = artRes.body.id;

    // 2. Manager 1 proposes a contract
    const contractRes = await request(app.getHttpServer())
      .post(`/api/admin/artists/${artistProfileId}/contracts`)
      .set('Authorization', `Bearer ${manager1Token}`)
      .send({
        commissionRate: 0.4,
        effectiveFrom: new Date().toISOString(),
      })
      .expect(201);

    const contractId = contractRes.body.id;
    expect(contractRes.body.status).toBe('PENDING_APPROVAL');

    // 3. Receptionist attempts to view commission contracts -> 403 Forbidden!
    await request(app.getHttpServer())
      .get(`/api/admin/artists/${artistProfileId}/contracts`)
      .set('Authorization', `Bearer ${receptionistToken}`)
      .expect(403);

    // 4. Manager 1 attempts to approve their OWN contract -> 403 Forbidden (منع خودتأییدی)!
    await request(app.getHttpServer())
      .post(`/api/admin/contracts/${contractId}/approve`)
      .set('Authorization', `Bearer ${manager1Token}`)
      .expect(403);

    // 5. Manager 2 (independent manager) approves the contract -> 200 OK
    const approveRes = await request(app.getHttpServer())
      .post(`/api/admin/contracts/${contractId}/approve`)
      .set('Authorization', `Bearer ${manager2Token}`)
      .expect(200);

    expect(approveRes.body.status).toBe('ACTIVE');
    expect(approveRes.body.approverStaffId).toBeDefined();
  });
});
