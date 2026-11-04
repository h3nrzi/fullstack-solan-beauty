'use server';

import { cookies } from 'next/headers';
import { getApiBaseUrl } from '../lib/api';
import {
  ConsultationRequestDto,
  CreateConsultationRequestDto,
} from '@salon/shared';

export interface ConsultationActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Server Action for creating consultation request by customer
 */
export async function createCustomerConsultationAction(
  dto: CreateConsultationRequestDto,
): Promise<ConsultationActionResult<ConsultationRequestDto>> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('salon_customer_session')?.value;
    if (!sessionToken) {
      return { success: false, error: 'نشست کاربری شما معتبر نیست. لطفاً وارد شوید.' };
    }

    const res = await fetch(`${getApiBaseUrl()}/api/customer/consultations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionToken}`,
        Cookie: `salon_customer_session=${sessionToken}`,
      },
      body: JSON.stringify(dto),
      cache: 'no-store',
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.message || 'خطا در ثبت درخواست بررسی.' };
    }

    return { success: true, data: data as ConsultationRequestDto };
  } catch (error) {
    console.error('[createCustomerConsultationAction] Error:', error);
    return { success: false, error: 'خطای ارتباط با سرور رخ داده است.' };
  }
}

/**
 * Server Action for providing requested supplementary info
 */
export async function provideCustomerConsultationInfoAction(
  requestId: string,
  answer: string,
): Promise<ConsultationActionResult<ConsultationRequestDto>> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('salon_customer_session')?.value;
    if (!sessionToken) {
      return { success: false, error: 'نشست کاربری شما معتبر نیست.' };
    }

    const res = await fetch(`${getApiBaseUrl()}/api/customer/consultations/${requestId}/info`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionToken}`,
        Cookie: `salon_customer_session=${sessionToken}`,
      },
      body: JSON.stringify({ answer }),
      cache: 'no-store',
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.message || 'خطا در ارسال اطلاعات تکمیلی.' };
    }

    return { success: true, data: data as ConsultationRequestDto };
  } catch (error) {
    console.error('[provideCustomerConsultationInfoAction] Error:', error);
    return { success: false, error: 'خطای ارتباط با سرور رخ داده است.' };
  }
}

/**
 * Server Action for customer withdrawing request
 */
export async function withdrawCustomerConsultationAction(
  requestId: string,
  reason?: string,
): Promise<ConsultationActionResult<ConsultationRequestDto>> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('salon_customer_session')?.value;
    if (!sessionToken) {
      return { success: false, error: 'نشست کاربری شما معتبر نیست.' };
    }

    const res = await fetch(`${getApiBaseUrl()}/api/customer/consultations/${requestId}/withdraw`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionToken}`,
        Cookie: `salon_customer_session=${sessionToken}`,
      },
      body: JSON.stringify({ reason }),
      cache: 'no-store',
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.message || 'خطا در لغو درخواست.' };
    }

    return { success: true, data: data as ConsultationRequestDto };
  } catch (error) {
    console.error('[withdrawCustomerConsultationAction] Error:', error);
    return { success: false, error: 'خطای ارتباط با سرور رخ داده است.' };
  }
}
