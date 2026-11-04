import { ServiceDto, PublicArtistProfileDto, SharedResourceDto, StaffProfile } from '@salon/shared';
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
