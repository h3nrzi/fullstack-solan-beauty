import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { PrismaClient, StaffRole, ArtistLevel, ContractStatus } from '@salon/database';
import { CommissionContractsService } from '../src/catalog/commission-contracts.service';
import { ArtistsService } from '../src/catalog/artists.service';

describe('Concurrency - Seam 3: Database Concurrency on Contract Approval', () => {
  const prisma1 = new PrismaClient();
  const prisma2 = new PrismaClient();

  let manager1Id: string;
  let manager2Id: string;
  let manager3Id: string;
  let artistProfileId: string;

  beforeEach(async () => {
    await prisma1.commissionContract.deleteMany();
    await prisma1.artistServiceTariff.deleteMany();
    await prisma1.artistProfile.deleteMany();
    await prisma1.service.deleteMany();
    await prisma1.auditLog.deleteMany();
    await prisma1.session.deleteMany();
    await prisma1.recoveryCode.deleteMany();
    await prisma1.independentRecoveryRequest.deleteMany();
    await prisma1.staff.deleteMany();

    // 1. Manager 1 (Creator)
    const m1 = await prisma1.staff.create({
      data: {
        username: 'creator_manager',
        fullName: 'Zahra Modir',
        role: StaffRole.MANAGER,
        passwordHash: 'dummy',
      },
    });
    manager1Id = m1.id;

    // 2. Manager 2 (Approver candidate A)
    const m2 = await prisma1.staff.create({
      data: {
        username: 'approver_manager_a',
        fullName: 'Sara Modir',
        role: StaffRole.MANAGER,
        passwordHash: 'dummy',
      },
    });
    manager2Id = m2.id;

    // 3. Manager 3 (Approver candidate B)
    const m3 = await prisma1.staff.create({
      data: {
        username: 'approver_manager_b',
        fullName: 'Neda Modir',
        role: StaffRole.MANAGER,
        passwordHash: 'dummy',
      },
    });
    manager3Id = m3.id;

    // 4. Artist Staff & Profile
    const artistStaff = await prisma1.staff.create({
      data: {
        username: 'artist_sepideh',
        fullName: 'Sepideh Artist',
        role: StaffRole.ARTIST,
        passwordHash: 'dummy',
      },
    });

    const artistsService = new ArtistsService(prisma1);
    const profile = await artistsService.createProfile({
      staffId: artistStaff.id,
      level: ArtistLevel.SENIOR,
    });
    artistProfileId = profile.id;
  });

  afterAll(async () => {
    await prisma1.$disconnect();
    await prisma2.$disconnect();
  });

  it('prevents double-approval of a pending commission contract under concurrent execution with independent DB connections', async () => {
    const contractsService1 = new CommissionContractsService(prisma1);
    const contractsService2 = new CommissionContractsService(prisma2);

    // Creator proposes a contract
    const contract = await contractsService1.proposeContract({
      artistId: artistProfileId,
      creatorStaffId: manager1Id,
      commissionRate: 0.42,
      deductMaterialCost: true,
      effectiveFrom: new Date('2026-11-15'),
    });

    // Both manager 2 and manager 3 attempt to approve the SAME contract concurrently
    const [res1, res2] = await Promise.allSettled([
      contractsService1.approveContract(contract.id, manager2Id),
      contractsService2.approveContract(contract.id, manager3Id),
    ]);

    const successes = [res1, res2].filter((r) => r.status === 'fulfilled');
    const failures = [res1, res2].filter((r) => r.status === 'rejected');

    // Exactly one should succeed and one should fail
    expect(successes.length).toBe(1);
    expect(failures.length).toBe(1);

    // Verify contract in DB is ACTIVE with exactly one approver
    const finalContract = await prisma1.commissionContract.findUnique({
      where: { id: contract.id },
    });

    expect(finalContract?.status).toBe(ContractStatus.ACTIVE);
    expect(finalContract?.approvedAt).not.toBeNull();
    expect([manager2Id, manager3Id]).toContain(finalContract?.approverStaffId);

    // Verify exactly one active contract exists for this artist
    const activeContracts = await prisma1.commissionContract.findMany({
      where: { artistId: artistProfileId, status: ContractStatus.ACTIVE },
    });
    expect(activeContracts).toHaveLength(1);
  });
});
