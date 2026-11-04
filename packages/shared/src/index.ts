/**
 * Domain roles for beauty salon staff and operations.
 * Refer to GLOSSARY.md and ticket 10 (Permissions and Privacy).
 */
export const StaffRole = {
  MANAGER: 'MANAGER',
  RECEPTIONIST: 'RECEPTIONIST',
  ACCOUNTANT: 'ACCOUNTANT',
  ARTIST: 'ARTIST',
} as const;

export type StaffRole = (typeof StaffRole)[keyof typeof StaffRole];

// ============================================================================
// TypeScript Advanced Types: Branded / Nominal Types
// ============================================================================

declare const __brand: unique symbol;

/**
 * Nominal branding utility to prevent primitive type confusion.
 */
export type Brand<T, B extends string> = T & { readonly [__brand]: B };

export type StaffId = Brand<string, 'StaffId'>;
export type SessionToken = Brand<string, 'SessionToken'>;
export type TempAuthToken = Brand<string, 'TempAuthToken'>;
export type RecoveryCodeString = Brand<string, 'RecoveryCodeString'>;
export type ClaimTokenString = Brand<string, 'ClaimTokenString'>;

// ============================================================================
// TypeScript Advanced Types: Type Utilities
// ============================================================================

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};
export type ValueOf<T> = T[keyof T];

/**
 * Result pattern for robust and predictable error handling.
 */
export type Result<T, E = Error> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: E };

export function ok<T>(data: T): Result<T, never> {
  return { success: true, data };
}

export function fail<E = Error>(error: E): Result<never, E> {
  return { success: false, error };
}

// ============================================================================
// Domain Entities & DTO Contracts
// ============================================================================

export interface StaffUser {
  id: string;
  username: string;
  fullName: string;
  phone?: string | null;
  role: StaffRole;
  isActive: boolean;
  mfaEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type StaffProfile = Pick<StaffUser, 'id' | 'username' | 'fullName' | 'role' | 'isActive'>;

export interface StaffSession {
  id: string;
  staffId: string;
  tokenHash: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: Date;
  expiresAt: Date;
  revokedAt?: Date | null;
}

export const SecurityEventType = {
  LOGIN_ATTEMPT: 'LOGIN_ATTEMPT',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILED: 'LOGIN_FAILED',
  MFA_CHALLENGE: 'MFA_CHALLENGE',
  MFA_SUCCESS: 'MFA_SUCCESS',
  MFA_FAILED: 'MFA_FAILED',
  RECOVERY_CODE_USED: 'RECOVERY_CODE_USED',
  SESSION_REVOKED: 'SESSION_REVOKED',
  ROLE_CHANGED: 'ROLE_CHANGED',
  STAFF_DEACTIVATED: 'STAFF_DEACTIVATED',
  PASSWORD_CHANGED: 'PASSWORD_CHANGED',
  INDEPENDENT_RECOVERY_REQUESTED: 'INDEPENDENT_RECOVERY_REQUESTED',
  INDEPENDENT_RECOVERY_APPROVED: 'INDEPENDENT_RECOVERY_APPROVED',
  INDEPENDENT_RECOVERY_REJECTED: 'INDEPENDENT_RECOVERY_REJECTED',
  SERVICE_CREATED: 'SERVICE_CREATED',
  TARIFF_UPDATED: 'TARIFF_UPDATED',
  CONTRACT_PROPOSED: 'CONTRACT_PROPOSED',
  CONTRACT_APPROVED: 'CONTRACT_APPROVED',
  CONTRACT_REJECTED: 'CONTRACT_REJECTED',
} as const;

export type SecurityEventType = (typeof SecurityEventType)[keyof typeof SecurityEventType];

export interface AuditLogEntry {
  id: string;
  staffId?: string | null;
  eventType: SecurityEventType;
  details?: Record<string, unknown> | null;
  ipAddress?: string | null;
  createdAt: Date;
}

// ============================================================================
// API Request & Response Contracts (Discriminated Unions)
// ============================================================================

export interface LoginRequestBody {
  username: string;
  password: string;
}

export type LoginResponseBody =
  | {
      mfaRequired: true;
      tempToken: string;
      staffId: string;
    }
  | {
      mfaRequired: false;
      sessionToken: string;
      staff: StaffProfile;
    };

export interface VerifyMfaRequestBody {
  tempToken: string;
  code: string;
}

export interface VerifyRecoveryCodeRequestBody {
  tempToken: string;
  recoveryCode: string;
}

export interface AuthSuccessResponseBody {
  message: string;
  sessionToken: string;
  staff: StaffProfile;
}

export interface UpdateStaffRoleRequestBody {
  role: StaffRole;
  reason?: string;
}

export interface EmergencyRecoveryRequestBody {
  targetStaffId: string;
  requesterNote: string;
}

export interface ApproveEmergencyRecoveryRequestBody {
  requestId: string;
}

export interface ClaimEmergencyRecoveryRequestBody {
  requestId: string;
  claimToken: string;
}

export interface StandardApiResponse<T> {
  statusCode: number;
  message?: string;
  data?: T;
  timestamp: string;
  path: string;
}

// ============================================================================
// Ticket 02: Services, Artists, Tariffs & Commission Contracts
// ============================================================================

export const ServicePriceType = {
  FIXED: 'FIXED',
  RANGE: 'RANGE',
} as const;
export type ServicePriceType = (typeof ServicePriceType)[keyof typeof ServicePriceType];

export const ArtistLevel = {
  JUNIOR: 'JUNIOR',
  MID: 'MID',
  SENIOR: 'SENIOR',
  MASTER: 'MASTER',
} as const;
export type ArtistLevel = (typeof ArtistLevel)[keyof typeof ArtistLevel];

export const ContractStatus = {
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  ACTIVE: 'ACTIVE',
  REJECTED: 'REJECTED',
  SUPERSEDED: 'SUPERSEDED',
} as const;
export type ContractStatus = (typeof ContractStatus)[keyof typeof ContractStatus];

export interface ServiceDto {
  id: string;
  name: string;
  description?: string | null;
  priceType: ServicePriceType;
  fixedPrice?: number | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  fixedDeposit?: number | null;
  durationMinutes?: number | null;
  requiresReview: boolean;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PublicArtistProfileDto {
  id: string;
  staffId: string;
  fullName: string;
  bio?: string | null;
  experienceYears?: number | null;
  level: ArtistLevel;
  portfolioUrls: string[];
  tariffs?: {
    serviceId: string;
    serviceName: string;
    priceType: ServicePriceType;
    fixedPrice?: number | null;
    minPrice?: number | null;
    maxPrice?: number | null;
    fixedDeposit?: number | null;
    durationMinutes?: number | null;
  }[];
}

export interface CommissionContractDto {
  id: string;
  artistId: string;
  creatorStaffId: string;
  approverStaffId?: string | null;
  commissionRate: number;
  deductMaterialCost: boolean;
  effectiveFrom: Date;
  effectiveTo?: Date | null;
  status: ContractStatus;
  rejectionReason?: string | null;
  approvedAt?: Date | null;
  version: number;
  createdAt: Date;
}

export interface CreateServiceInput {
  name: string;
  description?: string;
  priceType: ServicePriceType;
  fixedPrice?: number;
  minPrice?: number;
  maxPrice?: number;
  fixedDeposit?: number;
  durationMinutes?: number;
  requiresReview?: boolean;
  isPublished?: boolean;
}

export interface CreateCommissionContractInput {
  commissionRate: number;
  deductMaterialCost?: boolean;
  effectiveFrom: string | Date;
  effectiveTo?: string | Date;
}
