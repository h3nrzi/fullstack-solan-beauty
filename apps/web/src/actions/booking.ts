'use server';

import { getApiBaseUrl } from '../lib/api';
import { AvailableSlotDto } from '@salon/shared';

export interface SearchSlotsParams {
  serviceId: string;
  date: string;
  artistId?: string;
}

export interface SearchSlotsResult {
  success: boolean;
  slots: AvailableSlotDto[];
  error?: string;
}

/**
 * Server Action for querying real-time capacity and available booking slots
 */
export async function searchAvailableSlotsAction(
  params: SearchSlotsParams
): Promise<SearchSlotsResult> {
  const { serviceId, date, artistId } = params;

  if (!serviceId) {
    return { success: false, slots: [], error: 'انتخاب خدمت الزامی است.' };
  }
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { success: false, slots: [], error: 'فرمت تاریخ معتبر نیست.' };
  }

  try {
    let url = `${getApiBaseUrl()}/api/public/capacity/slots?serviceId=${encodeURIComponent(
      serviceId
    )}&date=${encodeURIComponent(date)}`;

    if (artistId) {
      url += `&artistId=${encodeURIComponent(artistId)}`;
    }

    const res = await fetch(url, {
      cache: 'no-store',
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return {
        success: false,
        slots: [],
        error: errorData.message || 'خطا در دریافت زمان‌های آزاد از سرور.',
      };
    }

    const slots = (await res.json()) as AvailableSlotDto[];
    return {
      success: true,
      slots,
    };
  } catch (error) {
    console.error('[searchAvailableSlotsAction] Error:', error);
    return {
      success: false,
      slots: [],
      error: 'امکان برقراری ارتباط با سرور زمان‌بندی وجود ندارد.',
    };
  }
}
