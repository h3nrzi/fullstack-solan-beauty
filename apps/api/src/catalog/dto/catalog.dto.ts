import { ServicePriceType, ArtistLevel } from '@salon/database';

export class CreateServiceDto {
  name!: string;
  description?: string;
  priceType!: ServicePriceType;
  fixedPrice?: number;
  minPrice?: number;
  maxPrice?: number;
  fixedDeposit?: number;
  durationMinutes?: number;
  requiresReview?: boolean;
  isPublished?: boolean;
}

export class CreateArtistProfileDto {
  staffId!: string;
  bio?: string;
  experienceYears?: number;
  level?: ArtistLevel;
  portfolioUrls?: string[];
}

export class SetArtistTariffDto {
  serviceId!: string;
  priceType!: ServicePriceType;
  fixedPrice?: number;
  minPrice?: number;
  maxPrice?: number;
  fixedDeposit?: number;
  durationMinutes?: number;
}

export class CreateCommissionContractDto {
  commissionRate!: number;
  deductMaterialCost?: boolean;
  effectiveFrom!: string;
  effectiveTo?: string;
}

export class RejectCommissionContractDto {
  reason!: string;
}
