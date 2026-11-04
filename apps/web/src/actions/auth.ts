'use server';

import { cookies } from 'next/headers';
import { getApiBaseUrl } from '../lib/api';
import {
  StaffProfile,
  LoginResponseBody,
  AuthSuccessResponseBody,
} from '@salon/shared';

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface LoginActionResult {
  success: boolean;
  mfaRequired?: boolean;
  tempToken?: string;
  staff?: StaffProfile;
  error?: string;
}

/**
 * Server Action for staff login credentials
 */
export async function loginAction(credentials: {
  username: string;
  password: string;
}): Promise<LoginActionResult> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/auth/staff/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
      cache: 'no-store',
    });

    const data = (await res.json()) as LoginResponseBody & { message?: string };
    if (!res.ok) {
      return {
        success: false,
        error: data.message || 'نام کاربری یا رمز عبور اشتباه است.',
      };
    }

    if (data.mfaRequired) {
      return {
        success: true,
        mfaRequired: true,
        tempToken: data.tempToken,
      };
    }

    return {
      success: true,
      mfaRequired: false,
      staff: data.staff,
    };
  } catch (error) {
    console.error('[loginAction] Error:', error);
    return {
      success: false,
      error: 'خطا در برقراری ارتباط با سرویس احراز هویت.',
    };
  }
}

/**
 * Server Action for verifying MFA TOTP code
 */
export async function verifyMfaAction(payload: {
  tempToken: string;
  code: string;
}): Promise<ActionResult<StaffProfile>> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/auth/staff/mfa-verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    const data = (await res.json()) as AuthSuccessResponseBody & { message?: string };
    if (!res.ok) {
      return {
        success: false,
        error: data.message || 'کد احراز هویت نامعتبر است.',
      };
    }

    // Set HTTP-only session cookie on the server
    const cookieStore = await cookies();
    cookieStore.set('salon_session', data.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 12 * 60 * 60, // 12 hours
    });

    return {
      success: true,
      data: data.staff,
    };
  } catch (error) {
    console.error('[verifyMfaAction] Error:', error);
    return {
      success: false,
      error: 'خطا در اعتبارسنجی کد احراز هویت دو مرحله‌ای.',
    };
  }
}

/**
 * Server Action for verifying Emergency Recovery Code
 */
export async function verifyRecoveryAction(payload: {
  tempToken: string;
  recoveryCode: string;
}): Promise<ActionResult<StaffProfile>> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/auth/staff/recovery-verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    const data = (await res.json()) as AuthSuccessResponseBody & { message?: string };
    if (!res.ok) {
      return {
        success: false,
        error: data.message || 'کد بازیابی نامعتبر یا قبلاً مصرف شده است.',
      };
    }

    // Set HTTP-only session cookie on the server
    const cookieStore = await cookies();
    cookieStore.set('salon_session', data.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 12 * 60 * 60,
    });

    return {
      success: true,
      data: data.staff,
    };
  } catch (error) {
    console.error('[verifyRecoveryAction] Error:', error);
    return {
      success: false,
      error: 'خطا در اعتبارسنجی کد اضطراری بازیابی.',
    };
  }
}

/**
 * Server Action for staff logout
 */
export async function logoutAction(): Promise<ActionResult> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('salon_session')?.value;

    if (sessionToken) {
      try {
        await fetch(`${getApiBaseUrl()}/api/auth/staff/logout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${sessionToken}`,
            Cookie: `salon_session=${sessionToken}`,
          },
          cache: 'no-store',
        });
      } catch (err) {
        console.warn('[logoutAction] API notification failed, clearing cookie anyway:', err);
      }
    }

    cookieStore.delete('salon_session');
    return { success: true };
  } catch (error) {
    console.error('[logoutAction] Error:', error);
    return { success: false, error: 'خطا در فرآیند خروج از سامانه.' };
  }
}
