'use server';

import { cookies } from 'next/headers';
import { getApiBaseUrl } from '../lib/api';

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ClaimRecoveryResultData {
  targetStaffId: string;
  newMfaSecret: string;
  newRecoveryCodes: string[];
}

export interface ApprovedRecoveryResultData {
  status: string;
  requestId: string;
  targetStaffId: string;
  claimToken: string;
}

/**
 * Server Action: Submit emergency recovery request (Public/Unauthenticated)
 */
export async function requestRecoveryAction(payload: {
  targetStaffId: string;
  requesterNote: string;
}): Promise<ActionResult<{ id: string; status: string }>> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/staff/emergency-recovery/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    const data = await res.json();
    if (!res.ok) {
      return {
        success: false,
        error: data.message || 'خطا در ثبت درخواست بازیابی اضطراری.',
      };
    }

    return { success: true, data };
  } catch (error) {
    console.error('[requestRecoveryAction] Error:', error);
    return { success: false, error: 'خطای سیستمی در ارتباط با سرور.' };
  }
}

/**
 * Server Action: Approve recovery request (Manager only - independent manager check)
 */
export async function approveRecoveryAction(payload: {
  requestId: string;
}): Promise<ActionResult<ApprovedRecoveryResultData>> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('salon_session')?.value;

    if (!sessionToken) {
      return { success: false, error: 'نشست کاربری شما معتبر نیست.' };
    }

    const res = await fetch(`${getApiBaseUrl()}/api/staff/emergency-recovery/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionToken}`,
        Cookie: `salon_session=${sessionToken}`,
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    const data = await res.json();
    if (!res.ok) {
      return {
        success: false,
        error:
          data.message ||
          'خطا در تأیید درخواست. توجه داشته باشید مدیر نمی‌تواند درخواست بازیابی خودش را تأیید کند.',
      };
    }

    return { success: true, data };
  } catch (error) {
    console.error('[approveRecoveryAction] Error:', error);
    return { success: false, error: 'خطای سیستمی در ارتباط با سرور.' };
  }
}

/**
 * Server Action: Reject recovery request (Manager only)
 */
export async function rejectRecoveryAction(payload: {
  requestId: string;
  reason: string;
}): Promise<ActionResult> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('salon_session')?.value;

    if (!sessionToken) {
      return { success: false, error: 'نشست کاربری شما معتبر نیست.' };
    }

    const res = await fetch(`${getApiBaseUrl()}/api/staff/emergency-recovery/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionToken}`,
        Cookie: `salon_session=${sessionToken}`,
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    const data = await res.json();
    if (!res.ok) {
      return {
        success: false,
        error: data.message || 'خطا در رد درخواست بازیابی.',
      };
    }

    return { success: true, data };
  } catch (error) {
    console.error('[rejectRecoveryAction] Error:', error);
    return { success: false, error: 'خطای سیستمی در ارتباط با سرور.' };
  }
}

/**
 * Server Action: Claim new credentials using claimToken (Public/Unauthenticated)
 */
export async function claimRecoveryAction(payload: {
  requestId: string;
  claimToken: string;
}): Promise<ActionResult<ClaimRecoveryResultData>> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/staff/emergency-recovery/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    const data = await res.json();
    if (!res.ok) {
      return {
        success: false,
        error:
          data.message ||
          'کد پیگیری یا توکن تحویل نامعتبر است یا این درخواست قبلاً استفاده یا منقضی شده است.',
      };
    }

    return { success: true, data };
  } catch (error) {
    console.error('[claimRecoveryAction] Error:', error);
    return { success: false, error: 'خطای سیستمی در ارتباط با سرور.' };
  }
}
