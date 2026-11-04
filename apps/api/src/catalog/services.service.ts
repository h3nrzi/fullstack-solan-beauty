import { Injectable } from '@nestjs/common';
import { PrismaClient, ServicePriceType, Service, SecurityEventType } from '@salon/database';
import { validatePricing } from './pricing-validator';

export interface CreateServiceParams {
  name: string;
  description?: string;
  priceType: ServicePriceType;
  fixedPrice?: number | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  fixedDeposit?: number | null;
  durationMinutes?: number | null;
  requiresReview?: boolean;
  isPublished?: boolean;
  creatorStaffId?: string;
}

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaClient) {}

  async createService(params: CreateServiceParams): Promise<Service> {
    validatePricing(params);

    const service = await this.prisma.service.create({
      data: {
        name: params.name,
        description: params.description,
        priceType: params.priceType,
        fixedPrice: params.priceType === ServicePriceType.FIXED ? params.fixedPrice : null,
        minPrice: params.priceType === ServicePriceType.RANGE ? params.minPrice : null,
        maxPrice: params.priceType === ServicePriceType.RANGE ? params.maxPrice : null,
        fixedDeposit: params.priceType === ServicePriceType.RANGE ? params.fixedDeposit : null,
        durationMinutes: params.durationMinutes ?? null,
        requiresReview: params.requiresReview ?? (params.durationMinutes == null),
        isPublished: params.isPublished ?? true,
      },
    });

    if (params.creatorStaffId) {
      await this.prisma.auditLog.create({
        data: {
          staffId: params.creatorStaffId,
          eventType: SecurityEventType.SERVICE_CREATED,
          details: { serviceId: service.id, name: service.name, priceType: service.priceType },
        },
      });
    }

    return service;
  }

  async listPublicServices(): Promise<Service[]> {
    return this.prisma.service.findMany({
      where: { isPublished: true },
      orderBy: { name: 'asc' },
    });
  }

  async getServiceById(id: string): Promise<Service | null> {
    return this.prisma.service.findUnique({
      where: { id },
    });
  }
}
