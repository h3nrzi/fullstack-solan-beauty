'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { StaffProfile, LoginResponseBody, AuthSuccessResponseBody } from '@salon/shared';
import { ShieldCheck, ChevronRight } from 'lucide-react';
import { Alert } from '../../components/ui/Alert';
import { CredentialsStep } from '../../components/auth/CredentialsStep';
import { MfaStep } from '../../components/auth/MfaStep';
import { RecoveryStep } from '../../components/auth/RecoveryStep';
import { StaffDashboard } from '../../components/auth/StaffDashboard';

type AuthStep = 'credentials' | 'mfa' | 'recovery';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function LoginPage() {
  const [step, setStep] = useState<AuthStep>('credentials');
  const [tempToken, setTempToken] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [staffData, setStaffData] = useState<StaffProfile | null>(null);

  const handleCredentialsSubmit = async (credentials: { username: string; password: string }) => {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/staff/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
        credentials: 'include',
      });

      const data = (await res.json()) as LoginResponseBody & { message?: string };
      if (!res.ok) {
        throw new Error(data.message || 'نام کاربری یا رمز عبور اشتباه است');
      }

      if (data.mfaRequired) {
        setTempToken(data.tempToken);
        setStep('mfa');
      } else {
        setStaffData(data.staff);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'خطای ناشناخته در ورود به سامانه');
    } finally {
      setLoading(false);
    }
  };

  const handleMfaSubmit = async (code: string) => {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/staff/mfa-verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tempToken, code }),
        credentials: 'include',
      });

      const data = (await res.json()) as AuthSuccessResponseBody & { message?: string };
      if (!res.ok) {
        throw new Error(data.message || 'کد احراز هویت نامعتبر است');
      }

      setStaffData(data.staff);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'خطا در اعتبارسنجی کد احراز هویت');
    } finally {
      setLoading(false);
    }
  };

  const handleRecoverySubmit = async (recoveryCode: string) => {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/staff/recovery-verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tempToken, recoveryCode }),
        credentials: 'include',
      });

      const data = (await res.json()) as AuthSuccessResponseBody & { message?: string };
      if (!res.ok) {
        throw new Error(data.message || 'کد بازیابی نامعتبر یا قبلاً مصرف شده است');
      }

      setStaffData(data.staff);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'خطا در اعتبارسنجی کد بازیابی');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await fetch(`${API_BASE_URL}/api/auth/staff/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // Ignore network failure on logout
    } finally {
      setStaffData(null);
      setStep('credentials');
      setTempToken('');
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6">
      <div className="max-w-md w-full p-6 sm:p-8 bg-white/95 backdrop-blur-md shadow-2xl rounded-3xl border border-stone-200/90 transition-all duration-300">
        <header className="text-center mb-6">
          <Link
            href="/"
            className="inline-flex items-center text-xs text-stone-500 hover:text-stone-800 transition mb-3 group"
          >
            <ChevronRight className="w-3.5 h-3.5 ml-0.5 group-hover:-translate-x-0.5 transition-transform" />
            بازگشت به صفحه اصلی
          </Link>

          <div className="w-12 h-12 bg-rose-50 border border-rose-200 rounded-2xl mx-auto flex items-center justify-center text-rose-900 mb-3 shadow-sm">
            <ShieldCheck className="w-6 h-6" aria-hidden="true" />
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-stone-900">
            ورود ایمن پرسنل
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            سامانه احراز هویت دو مرحله‌ای (MFA) سالن زیبایی
          </p>
        </header>

        {error && (
          <div className="mb-5">
            <Alert type="error">{error}</Alert>
          </div>
        )}

        {staffData ? (
          <StaffDashboard
            staff={staffData}
            loading={loading}
            onLogout={handleLogout}
          />
        ) : step === 'credentials' ? (
          <CredentialsStep
            loading={loading}
            onSubmit={handleCredentialsSubmit}
          />
        ) : step === 'mfa' ? (
          <MfaStep
            loading={loading}
            onSubmit={handleMfaSubmit}
            onBack={() => {
              setError(null);
              setStep('credentials');
            }}
            onUseRecovery={() => {
              setError(null);
              setStep('recovery');
            }}
          />
        ) : (
          <RecoveryStep
            loading={loading}
            onSubmit={handleRecoverySubmit}
            onBackToCredentials={() => {
              setError(null);
              setStep('credentials');
            }}
            onBackToMfa={() => {
              setError(null);
              setStep('mfa');
            }}
          />
        )}
      </div>
    </main>
  );
}
