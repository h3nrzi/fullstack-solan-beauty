import {
  ServiceDto,
  PublicArtistProfileDto,
  SharedResourceDto,
  StaffProfile,
  CustomerDto,
  CustomerBookingDto,
  ConsultationRequestDto,
} from '@salon/shared';
import { cookies } from 'next/headers';

export function getApiBaseUrl(): string {
  return process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
}

/**
 * Server-side fetcher for public services catalog
 */
export async function getServices(): Promise<ServiceDto[]> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/public/services`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) {
      console.warn(`[getServices] Failed to fetch services: ${res.status} ${res.statusText}`);
      return [];
    }
    return (await res.json()) as ServiceDto[];
  } catch (error) {
    console.warn('[getServices] Network error fetching services:', error);
    return [];
  }
}

/**
 * Server-side fetcher for public artists profiles
 */
export async function getArtists(): Promise<PublicArtistProfileDto[]> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/public/artists`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) {
      console.warn(`[getArtists] Failed to fetch artists: ${res.status} ${res.statusText}`);
      return [];
    }
    return (await res.json()) as PublicArtistProfileDto[];
  } catch (error) {
    console.warn('[getArtists] Network error fetching artists:', error);
    return [];
  }
}

/**
 * Server-side fetcher for shared resources capacity
 */
export async function getSharedResources(): Promise<SharedResourceDto[]> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/public/capacity/resources`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) {
      console.warn(`[getSharedResources] Failed to fetch resources: ${res.status} ${res.statusText}`);
      return [];
    }
    return (await res.json()) as SharedResourceDto[];
  } catch (error) {
    console.warn('[getSharedResources] Network error fetching resources:', error);
    return [];
  }
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
 * Server-side fetcher for current logged-in customer
 */
export async function getCurrentCustomer(): Promise<CustomerDto | null> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('salon_customer_session')?.value;
    if (!sessionToken) {
      return null;
    }

    const res = await fetch(`${getApiBaseUrl()}/api/customer/me`, {
      headers: {
        Authorization: `Bearer ${sessionToken}`,
        Cookie: `salon_customer_session=${sessionToken}`,
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      return null;
    }

    const body = await res.json();
    return body.customer as CustomerDto;
  } catch (error: unknown) {
    if (
      error &&
      typeof error === 'object' &&
      'digest' in error &&
      (error as { digest: string }).digest === 'DYNAMIC_SERVER_USAGE'
    ) {
      throw error;
    }
    console.warn('[getCurrentCustomer] Error checking customer session:', error);
    return null;
  }
}

/**
 * Server-side fetcher for current customer's bookings
 */
export async function getCustomerBookings(): Promise<CustomerBookingDto[]> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('salon_customer_session')?.value;
    if (!sessionToken) {
      return [];
    }

    const res = await fetch(`${getApiBaseUrl()}/api/customer/bookings`, {
      headers: {
        Authorization: `Bearer ${sessionToken}`,
        Cookie: `salon_customer_session=${sessionToken}`,
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      return [];
    }

    const body = await res.json();
    return body.bookings as CustomerBookingDto[];
  } catch (error: unknown) {
    if (
      error &&
      typeof error === 'object' &&
      'digest' in error &&
      (error as { digest: string }).digest === 'DYNAMIC_SERVER_USAGE'
    ) {
      throw error;
    }
    console.warn('[getCustomerBookings] Error fetching bookings:', error);
    return [];
  }
}

/**
 * Server-side fetcher for current customer's consultation requests
 */
export async function getCustomerConsultations(): Promise<ConsultationRequestDto[]> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('salon_customer_session')?.value;
    if (!sessionToken) {
      return [];
    }

    const res = await fetch(`${getApiBaseUrl()}/api/customer/consultations`, {
      headers: {
        Authorization: `Bearer ${sessionToken}`,
        Cookie: `salon_customer_session=${sessionToken}`,
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      return [];
    }

    return (await res.json()) as ConsultationRequestDto[];
  } catch (error: unknown) {
    if (
      error &&
      typeof error === 'object' &&
      'digest' in error &&
      (error as { digest: string }).digest === 'DYNAMIC_SERVER_USAGE'
    ) {
      throw error;
    }
    console.warn('[getCustomerConsultations] Error fetching consultations:', error);
    return [];
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


