import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import {
  PrismaClient,
  ArtistLevel,
  ArtistProfile,
  ArtistServiceTariff,
  ServicePriceType,
  StaffRole,
  SecurityEventType,
} from '@salon/database';
import { validatePricing } from './pricing-validator';

export interface CreateArtistProfileParams {
  staffId: string;
  bio?: string;
  experienceYears?: number;
  level?: ArtistLevel;
  portfolioUrls?: string[];
}

export interface SetTariffParams {
  artistId: string;
  serviceId: string;
  priceType: ServicePriceType;
  fixedPrice?: number | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  fixedDeposit?: number | null;
  durationMinutes?: number | null;
  creatorStaffId?: string;
}

@Injectable()
export class ArtistsService {
  constructor(private readonly prisma: PrismaClient) {}

  async createProfile(params: CreateArtistProfileParams): Promise<ArtistProfile> {
    const staff = await this.prisma.staff.findUnique({
      where: { id: params.staffId },
    });

    if (!staff || staff.role !== StaffRole.ARTIST) {
      throw new BadRequestException('پروفایل آرتیست فقط برای کارکنان با نقش ARTIST قابل تعریف است');
    }

    return this.prisma.artistProfile.create({
      data: {
        staffId: params.staffId,
        bio: params.bio,
        experienceYears: params.experienceYears,
        level: params.level ?? ArtistLevel.SENIOR,
        portfolioUrls: params.portfolioUrls ?? [],
      },
    });
  }

  async setTariff(params: SetTariffParams): Promise<ArtistServiceTariff> {
    validatePricing(params);

    const artist = await this.prisma.artistProfile.findUnique({
      where: { id: params.artistId },
    });
    if (!artist) {
      throw new NotFoundException('آرتیست مورد نظر یافت نشد');
    }

    const service = await this.prisma.service.findUnique({
      where: { id: params.serviceId },
    });
    if (!service) {
      throw new NotFoundException('خدمت مورد نظر یافت نشد');
    }

    const tariff = await this.prisma.$transaction(async (tx) => {
      // Find current active tariff
      const current = await tx.artistServiceTariff.findFirst({
        where: {
          artistId: params.artistId,
          serviceId: params.serviceId,
          isActive: true,
        },
        orderBy: { version: 'desc' },
      });

      const nextVersion = current ? current.version + 1 : 1;

      if (current) {
        await tx.artistServiceTariff.update({
          where: { id: current.id },
          data: {
            isActive: false,
            validTo: new Date(),
          },
        });
      }

      return tx.artistServiceTariff.create({
        data: {
          artistId: params.artistId,
          serviceId: params.serviceId,
          priceType: params.priceType,
          fixedPrice: params.priceType === ServicePriceType.FIXED ? params.fixedPrice : null,
          minPrice: params.priceType === ServicePriceType.RANGE ? params.minPrice : null,
          maxPrice: params.priceType === ServicePriceType.RANGE ? params.maxPrice : null,
          fixedDeposit: params.priceType === ServicePriceType.RANGE ? params.fixedDeposit : null,
          durationMinutes: params.durationMinutes ?? service.durationMinutes,
          version: nextVersion,
          isActive: true,
          validFrom: new Date(),
        },
      });
    });

    if (params.creatorStaffId) {
      await this.prisma.auditLog.create({
        data: {
          staffId: params.creatorStaffId,
          eventType: SecurityEventType.TARIFF_UPDATED,
          details: {
            artistId: params.artistId,
            serviceId: params.serviceId,
            version: tariff.version,
            priceType: tariff.priceType,
          },
        },
      });
    }

    return tariff;
  }

  async listPublicArtists() {
    const artists = await this.prisma.artistProfile.findMany({
      include: {
        staff: {
          select: {
            id: true,
            fullName: true,
            isActive: true,
          },
        },
        tariffs: {
          where: { isActive: true },
          include: {
            service: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      where: {
        staff: { isActive: true },
      },
      orderBy: { staff: { fullName: 'asc' } },
    });

    return artists.map((a) => this.formatPublicArtist(a));
  }

  async getPublicArtistById(id: string) {
    const artist = await this.prisma.artistProfile.findUnique({
      where: { id },
      include: {
        staff: {
          select: {
            id: true,
            fullName: true,
            isActive: true,
          },
        },
        tariffs: {
          where: { isActive: true },
          include: {
            service: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!artist || !artist.staff.isActive) {
      throw new NotFoundException('پروفایل آرتیست یافت نشد');
    }

    return this.formatPublicArtist(artist);
  }

  private formatPublicArtist(artist: any) {
    return {
      id: artist.id,
      staffId: artist.staff.id,
      fullName: artist.staff.fullName,
      bio: artist.bio,
      experienceYears: artist.experienceYears,
      level: artist.level,
      portfolioUrls: artist.portfolioUrls,
      tariffs: artist.tariffs.map((t: any) => ({
        serviceId: t.serviceId,
        serviceName: t.service.name,
        priceType: t.priceType,
        fixedPrice: t.fixedPrice,
        minPrice: t.minPrice,
        maxPrice: t.maxPrice,
        fixedDeposit: t.fixedDeposit,
        durationMinutes: t.durationMinutes,
      })),
    };
  }
}
