/**
 * Domain roles for beauty salon staff and operations.
 * Refer to GLOSSARY.md and ticket 10 (Permissions and Privacy).
 */
export enum StaffRole {
  MANAGER = 'MANAGER',
  RECEPTIONIST = 'RECEPTIONIST',
  ACCOUNTANT = 'ACCOUNTANT',
  ARTIST = 'ARTIST',
}

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

export enum SecurityEventType {
  LOGIN_ATTEMPT = 'LOGIN_ATTEMPT',
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILED = 'LOGIN_FAILED',
  MFA_CHALLENGE = 'MFA_CHALLENGE',
  MFA_SUCCESS = 'MFA_SUCCESS',
  MFA_FAILED = 'MFA_FAILED',
  RECOVERY_CODE_USED = 'RECOVERY_CODE_USED',
  SESSION_REVOKED = 'SESSION_REVOKED',
  ROLE_CHANGED = 'ROLE_CHANGED',
  STAFF_DEACTIVATED = 'STAFF_DEACTIVATED',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
}

export interface AuditLogEntry {
  id: string;
  staffId?: string | null;
  eventType: SecurityEventType;
  details?: Record<string, unknown> | null;
  ipAddress?: string | null;
  createdAt: Date;
}
