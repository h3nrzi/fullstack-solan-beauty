'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { StaffProfile } from '@salon/shared';
import { ShieldCheck, ChevronRight } from 'lucide-react';
import { Alert } from '../ui/Alert';
import { CredentialsStep } from './CredentialsStep';
import { MfaStep } from './MfaStep';
import { RecoveryStep } from './RecoveryStep';
import { StaffDashboard } from './StaffDashboard';
import {
  loginAction,
  verifyMfaAction,
  verifyRecoveryAction,
  logoutAction,
} from '../../actions/auth';

type AuthStep = 'credentials' | 'mfa' | 'recovery';

interface LoginClientViewProps {
  initialStaff: StaffProfile | null;
}

export function LoginClientView({ initialStaff }: LoginClientViewProps) {
  const router = useRouter();
  const [step, setStep] = useState<AuthStep>('credentials');
  const [tempToken, setTempToken] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [staffData, setStaffData] = useState<StaffProfile | null>(initialStaff);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (initialStaff) {
      router.push('/dashboard');
    }
  }, [initialStaff, router]);

  const handleCredentialsSubmit = async (credentials: { username: string; password: string }): Promise<void> => {
    setError(null);
    setLoading(true);

    try {
      const result = await loginAction(credentials);
      if (!result.success) {
        setError(result.error || 'نام کاربری یا رمز عبور اشتباه است');
        return;
      }

      if (result.mfaRequired && result.tempToken) {
        setTempToken(result.tempToken);
        setStep('mfa');
      } else if (result.staff) {
        setStaffData(result.staff);
        router.push('/dashboard');
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMfaSubmit = async (code: string): Promise<void> => {
    setError(null);
    setLoading(true);

    try {
      const result = await verifyMfaAction({ tempToken, code });
      if (!result.success || !result.data) {
        setError(result.error || 'کد احراز هویت نامعتبر است');
        return;
      }

      setStaffData(result.data);
      router.push('/dashboard');
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const handleRecoverySubmit = async (recoveryCode: string): Promise<void> => {
    setError(null);
    setLoading(true);

    try {
      const result = await verifyRecoveryAction({ tempToken, recoveryCode });
      if (!result.success || !result.data) {
        setError(result.error || 'کد بازیابی نامعتبر یا قبلاً مصرف شده است');
        return;
      }

      setStaffData(result.data);
      router.push('/dashboard');
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async (): Promise<void> => {
    setError(null);
    setLoading(true);

    try {
      await logoutAction();
      setStaffData(null);
      setStep('credentials');
      setTempToken('');
    } finally {
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

        {!staffData && (
          <div className="flex items-center justify-between mb-5 px-1 text-xs" aria-label="پیشرفت مرحله ورود">
            <span className="font-semibold text-rose-900">
              {step === 'credentials' ? 'گام ۱ از ۲: مشخصات کاربری' : 'گام ۲ از ۲: تایید هویت دومرحله‌ای'}
            </span>
            <div className="flex gap-1.5" aria-hidden="true">
              <span
                className={`h-1.5 w-8 rounded-full transition-colors duration-200 ${
                  step === 'credentials' ? 'bg-rose-900' : 'bg-emerald-600'
                }`}
              />
              <span
                className={`h-1.5 w-8 rounded-full transition-colors duration-200 ${
                  step !== 'credentials' ? 'bg-rose-900' : 'bg-stone-200'
                }`}
              />
            </div>
          </div>
        )}

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
