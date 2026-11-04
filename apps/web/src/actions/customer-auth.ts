'use server';

import { cookies } from 'next/headers';
import { getApiBaseUrl } from '../lib/api';
import { CustomerDto, RequestOtpResponse, VerifyOtpResponse } from '@salon/shared';

export interface CustomerActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Server Action for customer OTP request
 */
export async function requestCustomerOtpAction(
  phone: string,
): Promise<CustomerActionResult<RequestOtpResponse>> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/customer/auth/otp/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
      cache: 'no-store',
    });

    const data = await res.json();
    if (!res.ok) {
      return {
        success: false,
        error: data.message || 'خطا در ارسال کد تأیید پیامکی.',
      };
    }

    return {
      success: true,
      data: data as RequestOtpResponse,
    };
  } catch (error) {
    console.error('[requestCustomerOtpAction] Error:', error);
    return {
      success: false,
      error: 'سامانه پیامک موقتاً در دسترس نیست یا خطای شبکه رخ داده است.',
    };
  }
}

/**
 * Server Action for verifying customer OTP
 */
export async function verifyCustomerOtpAction(
  phone: string,
  code: string,
): Promise<CustomerActionResult<CustomerDto>> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/customer/auth/otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, code }),
      cache: 'no-store',
    });

    const data = (await res.json()) as VerifyOtpResponse & { message?: string };
    if (!res.ok) {
      return {
        success: false,
        error: data.message || 'کد تأیید نامعتبر یا منقضی شده است.',
      };
    }

    // Set HTTP-only session cookie on the server
    const cookieStore = await cookies();
    cookieStore.set('salon_customer_session', data.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return {
      success: true,
      data: data.customer,
    };
  } catch (error) {
    console.error('[verifyCustomerOtpAction] Error:', error);
    return {
      success: false,
      error: 'خطا در اعتبارسنجی کد پیامکی.',
    };
  }
}

/**
 * Server Action for customer logout
 */
export async function customerLogoutAction(): Promise<CustomerActionResult> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('salon_customer_session')?.value;

    if (sessionToken) {
      try {
        await fetch(`${getApiBaseUrl()}/api/customer/auth/logout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${sessionToken}`,
            Cookie: `salon_customer_session=${sessionToken}`,
          },
          cache: 'no-store',
        });
      } catch (err) {
        console.warn('[customerLogoutAction] API notification failed:', err);
      }
    }

    cookieStore.delete('salon_customer_session');
    return { success: true };
  } catch (error) {
    console.error('[customerLogoutAction] Error:', error);
    return { success: false, error: 'خطا در خروج از حساب کاربری.' };
  }
}
