import { BadRequestException } from '@nestjs/common';
import { ServicePriceType } from '@salon/database';

export interface PricingParams {
  priceType: ServicePriceType;
  fixedPrice?: number | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  fixedDeposit?: number | null;
}

export function validatePricing(params: PricingParams): void {
  if (params.priceType === ServicePriceType.FIXED) {
    if (!params.fixedPrice || params.fixedPrice <= 0) {
      throw new BadRequestException('خدمت با قیمت قطعی باید دارای قیمت مشخص و بزرگتر از صفر باشد');
    }
  } else if (params.priceType === ServicePriceType.RANGE) {
    if (
      params.minPrice == null ||
      params.maxPrice == null ||
      params.minPrice <= 0 ||
      params.maxPrice < params.minPrice
    ) {
      throw new BadRequestException(
        'بازه قیمت نامعتبر است: حداقل قیمت باید مثبت و کوچکتر یا مساوی حداکثر باشد',
      );
    }
    if (params.fixedDeposit != null) {
      if (params.fixedDeposit <= 0 || params.fixedDeposit > params.maxPrice) {
        throw new BadRequestException('مبلغ بیعانه ثابت باید بزرگتر از صفر و حداکثر معادل سقف بازه قیمت باشد');
      }
    }
  }
}
