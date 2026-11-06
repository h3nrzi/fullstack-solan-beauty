import { StaffProfile } from '@salon/shared';
import { cookies } from 'next/headers';

export function getApiBaseUrl(): string {
  return process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
}

/**
 * Server-side fetcher for current logged-in staff
 */
export async function getCurrentStaff(): Promise<StaffProfile | null> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('salon_session')?.value;
    if (!sessionToken) {
      return null;
    }

    const res = await fetch(`${getApiBaseUrl()}/api/staff/me`, {
      headers: {
        Authorization: `Bearer ${sessionToken}`,
        Cookie: `salon_session=${sessionToken}`,
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      return null;
    }

    return (await res.json()) as StaffProfile;
  } catch (error: unknown) {
    if (
      error &&
      typeof error === 'object' &&
      'digest' in error &&
      (error as { digest: string }).digest === 'DYNAMIC_SERVER_USAGE'
    ) {
      throw error;
    }
    console.warn('[getCurrentStaff] Error checking session:', error);
    return null;
  }
}

/**
 * Server-side fetcher for staff list (Manager only)
 */
export async function getStaffList(): Promise<StaffProfile[]> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('salon_session')?.value;
    if (!sessionToken) return [];

    const res = await fetch(`${getApiBaseUrl()}/api/staff`, {
      headers: {
        Authorization: `Bearer ${sessionToken}`,
        Cookie: `salon_session=${sessionToken}`,
      },
      cache: 'no-store',
    });

    if (!res.ok) return [];
    return (await res.json()) as StaffProfile[];
  } catch (error: unknown) {
    if (
      error &&
      typeof error === 'object' &&
      'digest' in error &&
      (error as { digest: string }).digest === 'DYNAMIC_SERVER_USAGE'
    ) {
      throw error;
    }
    console.warn('[getStaffList] Error fetching staff list:', error);
    return [];
  }
}

export interface PendingRecoveryRequestItem {
  id: string;
  targetStaffId: string;
  requesterNote: string;
  status: string;
  createdAt: string;
  targetStaff: {
    id: string;
    username: string;
    fullName: string;
    role: string;
  };
}

/**
 * Server-side fetcher for pending emergency recovery requests (Manager only)
 */
export async function getPendingRecoveryRequests(): Promise<PendingRecoveryRequestItem[]> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('salon_session')?.value;
    if (!sessionToken) return [];

    const res = await fetch(`${getApiBaseUrl()}/api/staff/emergency-recovery/requests`, {
      headers: {
        Authorization: `Bearer ${sessionToken}`,
        Cookie: `salon_session=${sessionToken}`,
      },
      cache: 'no-store',
    });

    if (!res.ok) return [];
    return (await res.json()) as PendingRecoveryRequestItem[];
  } catch (error: unknown) {
    if (
      error &&
      typeof error === 'object' &&
      'digest' in error &&
      (error as { digest: string }).digest === 'DYNAMIC_SERVER_USAGE'
    ) {
      throw error;
    }
    console.warn('[getPendingRecoveryRequests] Error fetching recovery requests:', error);
    return [];
  }
}
