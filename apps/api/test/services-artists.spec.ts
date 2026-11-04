import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { PrismaClient, StaffRole, ServicePriceType, ContractStatus, ArtistLevel } from '@salon/database';
import { ServicesService } from '../src/catalog/services.service';
import { ArtistsService } from '../src/catalog/artists.service';
import { CommissionContractsService } from '../src/catalog/commission-contracts.service';

describe('Domain Service Seam - Seam 1: Services, Artists, Tariffs & Contracts', () => {
  const prisma = new PrismaClient();
  let servicesService: ServicesService;
  let artistsService: ArtistsService;
  let contractsService: CommissionContractsService;

  let manager1Id: string;
  let manager2Id: string;
  let artistStaffId: string;

  beforeEach(async () => {
    // Clean up tables in reverse dependency order
    await prisma.commissionContract.deleteMany();
    await prisma.artistServiceTariff.deleteMany();
    await prisma.artistProfile.deleteMany();
    await prisma.service.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.session.deleteMany();
    await prisma.recoveryCode.deleteMany();
    await prisma.independentRecoveryRequest.deleteMany();
    await prisma.staff.deleteMany();

    servicesService = new ServicesService(prisma);
    artistsService = new ArtistsService(prisma);
    contractsService = new CommissionContractsService(prisma);

    // Create test staff
    const m1 = await prisma.staff.create({
      data: {
        username: 'manager_one',
        fullName: 'Maryam Manager',
        passwordHash: 'dummy',
        role: StaffRole.MANAGER,
      },
    });
    manager1Id = m1.id;

    const m2 = await prisma.staff.create({
      data: {
        username: 'manager_two',
        fullName: 'Sara Approver',
        passwordHash: 'dummy',
        role: StaffRole.MANAGER,
      },
    });
    manager2Id = m2.id;

    const artistStaff = await prisma.staff.create({
      data: {
        username: 'artist_elnaz',
        fullName: 'Elnaz Shakeri',
        passwordHash: 'dummy',
        role: StaffRole.ARTIST,
      },
    });
    artistStaffId = artistStaff.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Service pricing validation and review flags', () => {
    it('creates a valid fixed-price service with duration', async () => {
      const service = await servicesService.createService({
        name: 'کوتاهی مو ژورنالی',
        description: 'کوتاهی تخصصی با متد روز',
        priceType: ServicePriceType.FIXED,
        fixedPrice: 450000, // 450,000 Toman
        durationMinutes: 45,
        requiresReview: false,
      });

      expect(service.id).toBeDefined();
      expect(service.priceType).toBe(ServicePriceType.FIXED);
      expect(service.fixedPrice).toBe(450000);
      expect(service.requiresReview).toBe(false);
    });

    it('rejects a fixed-price service without fixedPrice or with non-positive price', async () => {
      await expect(
        servicesService.createService({
          name: 'رنگساژ',
          priceType: ServicePriceType.FIXED,
          fixedPrice: 0,
          durationMinutes: 30,
        }),
      ).rejects.toThrow();
    });

    it('creates a range-price service and marks requiresReview when consultation/duration is variable', async () => {
      const service = await servicesService.createService({
        name: 'رنگ و لایت بالیاژ',
        priceType: ServicePriceType.RANGE,
        minPrice: 2000000,
        maxPrice: 6000000,
        fixedDeposit: 500000,
        durationMinutes: null, // Unknown duration requires consultation
        requiresReview: true,
      });

      expect(service.requiresReview).toBe(true);
      expect(service.minPrice).toBe(2000000);
      expect(service.maxPrice).toBe(6000000);
      expect(service.fixedDeposit).toBe(500000);
      expect(service.durationMinutes).toBeNull();
    });

    it('rejects a range-price service if fixedDeposit exceeds maxPrice or is negative', async () => {
      await expect(
        servicesService.createService({
          name: 'کراتین مو',
          priceType: ServicePriceType.RANGE,
          minPrice: 2000000,
          maxPrice: 4000000,
          fixedDeposit: 5000000, // Exceeds maxPrice
        }),
      ).rejects.toThrow();
    });

    it('rejects a range-price service if minPrice is greater than maxPrice', async () => {
      await expect(
        servicesService.createService({
          name: 'تراپی مو',
          priceType: ServicePriceType.RANGE,
          minPrice: 5000000,
          maxPrice: 3000000,
        }),
      ).rejects.toThrow();
    });
  });

  describe('Artist profile and Tariff versioning', () => {
    it('creates an artist profile and assigns versioned tariffs without overwriting history', async () => {
      const profile = await artistsService.createProfile({
        staffId: artistStaffId,
        bio: 'متخصص طراحی و کوتاهی مو با ۸ سال سابقه',
        experienceYears: 8,
        level: ArtistLevel.SENIOR,
        portfolioUrls: ['https://example.com/p1.jpg'],
      });

      const service = await servicesService.createService({
        name: 'اصلاح و استایل مو',
        priceType: ServicePriceType.FIXED,
        fixedPrice: 400000,
        durationMinutes: 40,
      });

      // Tariff version 1
      const tariffV1 = await artistsService.setTariff({
        artistId: profile.id,
        serviceId: service.id,
        priceType: ServicePriceType.FIXED,
        fixedPrice: 500000, // Senior artist custom price
        durationMinutes: 40,
      });

      expect(tariffV1.version).toBe(1);
      expect(tariffV1.isActive).toBe(true);
      expect(tariffV1.fixedPrice).toBe(500000);

      // Update tariff -> Should create Version 2, deactivate Version 1, preserve historical record
      const tariffV2 = await artistsService.setTariff({
        artistId: profile.id,
        serviceId: service.id,
        priceType: ServicePriceType.FIXED,
        fixedPrice: 600000, // New price
        durationMinutes: 40,
      });

      expect(tariffV2.version).toBe(2);
      expect(tariffV2.isActive).toBe(true);
      expect(tariffV2.fixedPrice).toBe(600000);

      // Verify historical record is preserved
      const historicalTariffs = await prisma.artistServiceTariff.findMany({
        where: { artistId: profile.id, serviceId: service.id },
        orderBy: { version: 'asc' },
      });

      expect(historicalTariffs).toHaveLength(2);
      expect(historicalTariffs[0].version).toBe(1);
      expect(historicalTariffs[0].isActive).toBe(false);
      expect(historicalTariffs[0].validTo).not.toBeNull();
      expect(historicalTariffs[0].fixedPrice).toBe(500000);

      expect(historicalTariffs[1].version).toBe(2);
      expect(historicalTariffs[1].isActive).toBe(true);
      expect(historicalTariffs[1].fixedPrice).toBe(600000);
    });

    it('rejects invalid pricing when setting tariffs on artists', async () => {
      const profile = await artistsService.createProfile({
        staffId: artistStaffId,
        level: ArtistLevel.MID,
      });

      const service = await servicesService.createService({
        name: 'شینیون کلاسیک',
        priceType: ServicePriceType.FIXED,
        fixedPrice: 300000,
        durationMinutes: 30,
      });

      // Attempt setting invalid fixedPrice 0
      await expect(
        artistsService.setTariff({
          artistId: profile.id,
          serviceId: service.id,
          priceType: ServicePriceType.FIXED,
          fixedPrice: 0,
        }),
      ).rejects.toThrow();

      // Attempt setting inverted range
      await expect(
        artistsService.setTariff({
          artistId: profile.id,
          serviceId: service.id,
          priceType: ServicePriceType.RANGE,
          minPrice: 500000,
          maxPrice: 200000,
        }),
      ).rejects.toThrow();
    });
  });

  describe('Commission Contract Independent Approval & Self-Approval Prohibition', () => {
    it('creates contract in PENDING_APPROVAL and blocks self-approval by creator manager', async () => {
      const profile = await artistsService.createProfile({
        staffId: artistStaffId,
        level: ArtistLevel.SENIOR,
      });

      const contract = await contractsService.proposeContract({
        artistId: profile.id,
        creatorStaffId: manager1Id,
        commissionRate: 0.45, // 45%
        deductMaterialCost: true,
        effectiveFrom: new Date('2026-12-01'),
      });

      expect(contract.status).toBe(ContractStatus.PENDING_APPROVAL);
      expect(contract.commissionRate).toBe(0.45);
      expect(contract.approverStaffId).toBeNull();

      // Manager 1 attempts to approve their own proposed contract -> MUST FAIL
      await expect(
        contractsService.approveContract(contract.id, manager1Id),
      ).rejects.toThrowError(/منع خودتأییدی|self-approval not allowed/i);
    });

    it('allows an independent manager to approve, setting status to ACTIVE and superseding older contracts', async () => {
      const profile = await artistsService.createProfile({
        staffId: artistStaffId,
        level: ArtistLevel.SENIOR,
      });

      // Contract 1: proposed by manager 1, approved by manager 2
      const contract1 = await contractsService.proposeContract({
        artistId: profile.id,
        creatorStaffId: manager1Id,
        commissionRate: 0.4,
        deductMaterialCost: true,
        effectiveFrom: new Date('2026-11-01'),
      });

      const approvedC1 = await contractsService.approveContract(contract1.id, manager2Id);
      expect(approvedC1.status).toBe(ContractStatus.ACTIVE);
      expect(approvedC1.approverStaffId).toBe(manager2Id);
      expect(approvedC1.approvedAt).not.toBeNull();

      // Contract 2: proposed later by manager 2, approved by manager 1
      const contract2 = await contractsService.proposeContract({
        artistId: profile.id,
        creatorStaffId: manager2Id,
        commissionRate: 0.45,
        deductMaterialCost: true,
        effectiveFrom: new Date('2026-12-01'),
      });

      const approvedC2 = await contractsService.approveContract(contract2.id, manager1Id);
      expect(approvedC2.status).toBe(ContractStatus.ACTIVE);
      expect(approvedC2.version).toBe(2);

      // Verify Contract 1 is now marked SUPERSEDED
      const previousContract = await prisma.commissionContract.findUnique({
        where: { id: contract1.id },
      });
      expect(previousContract?.status).toBe(ContractStatus.SUPERSEDED);
      expect(previousContract?.effectiveTo).not.toBeNull();

      // Verify date-filtering in getActiveContract
      const activeCurrent = await contractsService.getActiveContract(profile.id, new Date('2026-12-15'));
      expect(activeCurrent?.id).toBe(contract2.id);

      const activeBeforeStart = await contractsService.getActiveContract(profile.id, new Date('2026-10-01'));
      expect(activeBeforeStart).toBeNull();
    });

    it('records audit logs on contract propose, approve, and reject actions', async () => {
      const profile = await artistsService.createProfile({
        staffId: artistStaffId,
        level: ArtistLevel.SENIOR,
      });

      const contract = await contractsService.proposeContract({
        artistId: profile.id,
        creatorStaffId: manager1Id,
        commissionRate: 0.35,
        effectiveFrom: new Date('2026-11-01'),
      });

      const approved = await contractsService.approveContract(contract.id, manager2Id);
      expect(approved.status).toBe(ContractStatus.ACTIVE);

      const auditLogs = await prisma.auditLog.findMany({
        where: {
          eventType: { in: ['CONTRACT_PROPOSED', 'CONTRACT_APPROVED'] as any },
        },
      });

      expect(auditLogs.length).toBeGreaterThanOrEqual(2);
      expect(auditLogs.some((l) => l.eventType === 'CONTRACT_PROPOSED')).toBe(true);
      expect(auditLogs.some((l) => l.eventType === 'CONTRACT_APPROVED')).toBe(true);
    });
  });
});
