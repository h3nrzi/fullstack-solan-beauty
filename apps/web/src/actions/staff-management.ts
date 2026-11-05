'use server';

import { cookies } from 'next/headers';
import { getApiBaseUrl } from '../lib/api';
import { StaffRole } from '@salon/shared';

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Server Action for updating staff role (Manager only)
 */
export async function updateStaffRoleAction(
  targetStaffId: string,
  payload: { role: StaffRole; reason: string }
): Promise<ActionResult> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('salon_session')?.value;

    if (!sessionToken) {
      return { success: false, error: 'نشست کاربری شما معتبر نیست. لطفاً مجدداً وارد شوید.' };
    }

    const res = await fetch(`${getApiBaseUrl()}/api/staff/${targetStaffId}/role`, {
      method: 'PATCH',
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
        error: data.message || 'خطا در به‌روزرسانی نقش کارمند. دسترسی مدیریت الزامی است.',
      };
    }

    return { success: true, data };
  } catch (error) {
    console.error('[updateStaffRoleAction] Error:', error);
    return { success: false, error: 'خطای سیستمی در برقراری ارتباط با سرور.' };
  }
}

/**
 * Server Action for revoking all sessions of a staff member (Manager only)
 */
export async function revokeStaffSessionsAction(
  targetStaffId: string
): Promise<ActionResult<{ revokedCount: number }>> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('salon_session')?.value;

    if (!sessionToken) {
      return { success: false, error: 'نشست کاربری شما معتبر نیست. لطفاً مجدداً وارد شوید.' };
    }

    const res = await fetch(`${getApiBaseUrl()}/api/staff/${targetStaffId}/revoke-sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionToken}`,
        Cookie: `salon_session=${sessionToken}`,
      },
      cache: 'no-store',
    });

    const data = await res.json();
    if (!res.ok) {
      return {
        success: false,
        error: data.message || 'خطا در ابطال نشست‌ها. دسترسی مدیریت الزامی است.',
      };
    }

    return { success: true, data };
  } catch (error) {
    console.error('[revokeStaffSessionsAction] Error:', error);
    return { success: false, error: 'خطای سیستمی در برقراری ارتباط با سرور.' };
  }
}
