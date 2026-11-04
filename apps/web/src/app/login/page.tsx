'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function LoginPage() {
  const [step, setStep] = useState<'credentials' | 'mfa' | 'recovery'>('credentials');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [tempToken, setTempToken] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [staffData, setStaffData] = useState<any>(null);

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('http://localhost:4000/api/auth/staff/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        credentials: 'include',
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'نام کاربری یا رمز عبور اشتباه است');
      }

      if (data.mfaRequired) {
        setTempToken(data.tempToken);
        setStep('mfa');
      } else {
        setStaffData(data.staff);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('http://localhost:4000/api/auth/staff/mfa-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tempToken, code: totpCode }),
        credentials: 'include',
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'کد احراز هویت نامعتبر است');
      }

      setStaffData(data.staff);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRecoverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('http://localhost:4000/api/auth/staff/recovery-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tempToken, recoveryCode }),
        credentials: 'include',
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'کد بازیابی نامعتبر یا قبلاً مصرف شده است');
      }

      setStaffData(data.staff);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('http://localhost:4000/api/auth/staff/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } finally {
      setStaffData(null);
      setStep('credentials');
      setUsername('');
      setPassword('');
      setTotpCode('');
      setRecoveryCode('');
    }
  };

  const roleLabels: Record<string, string> = {
    MANAGER: 'مدیر سالن',
    RECEPTIONIST: 'پذیرش',
    ACCOUNTANT: 'حسابدار',
    ARTIST: 'آرتیست تخصصی',
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-stone-50" dir="rtl">
      <div className="max-w-md w-full bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="text-center mb-6">
          <Link href="/" className="inline-block text-xs text-rose-800 font-semibold tracking-wide uppercase mb-2">
            سالن زیبایی VIP
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-stone-900">
            {staffData ? 'پنل دسترسی پرسنل' : 'ورود کارکنان'}
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            {staffData
              ? 'احراز هویت دومرحله‌ای با موفقیت تأیید شد'
              : step === 'credentials'
              ? 'لطفاً نام کاربری و رمز شخصی خود را وارد نمایید'
              : step === 'mfa'
              ? 'کد ۶ رقمی نرم‌افزار Authenticator را وارد کنید'
              : 'کد بازیابی اضطراری یک‌بارمصرف را وارد کنید'}
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm rounded-xl"
          >
            {error}
          </div>
        )}

        {staffData ? (
          <div className="space-y-4">
            <div className="p-4 bg-stone-100 rounded-2xl space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-stone-500">نام کاربر:</span>
                <span className="font-semibold text-stone-900">{staffData.fullName}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-stone-500">نقش کاربری:</span>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800">
                  {roleLabels[staffData.role] || staffData.role}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-stone-500">شناسه نشست سروری:</span>
                <span className="text-xs text-emerald-700 font-mono">فعال (قابل ابطال سروری)</span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full py-3 px-4 rounded-xl text-stone-700 bg-stone-200 hover:bg-stone-300 font-medium transition text-sm"
            >
              خروج و ابطال نشست
            </button>
          </div>
        ) : step === 'credentials' ? (
          <form onSubmit={handleCredentialsSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-xs sm:text-sm font-medium text-stone-700 mb-1">
                نام کاربری
              </label>
              <input
                id="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-rose-800 text-sm"
                placeholder="مثال: reception_user"
                dir="ltr"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs sm:text-sm font-medium text-stone-700 mb-1">
                رمز عبور شخصی
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-rose-800 text-sm"
                dir="ltr"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl text-white bg-rose-900 hover:bg-rose-800 font-medium transition text-sm disabled:opacity-50"
            >
              {loading ? 'در حال بررسی...' : 'ادامه (مرحله دوم)'}
            </button>
          </form>
        ) : step === 'mfa' ? (
          <form onSubmit={handleMfaSubmit} className="space-y-4">
            <div>
              <label htmlFor="totpCode" className="block text-xs sm:text-sm font-medium text-stone-700 mb-1">
                کد یک‌بارمصرف زمان‌دار (TOTP)
              </label>
              <input
                id="totpCode"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                required
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value)}
                className="w-full text-center tracking-widest text-lg px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-rose-800 font-mono"
                placeholder="000000"
                dir="ltr"
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl text-white bg-rose-900 hover:bg-rose-800 font-medium transition text-sm disabled:opacity-50"
            >
              {loading ? 'در حال اعتبارسنجی...' : 'تأیید و ورود'}
            </button>

            <div className="flex justify-between items-center text-xs text-stone-500 pt-2">
              <button
                type="button"
                onClick={() => setStep('credentials')}
                className="hover:text-stone-800 underline"
              >
                بازگشت
              </button>
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setStep('recovery');
                }}
                className="text-rose-800 hover:underline font-medium"
              >
                استفاده از کد بازیابی
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRecoverySubmit} className="space-y-4">
            <div>
              <label htmlFor="recoveryCode" className="block text-xs sm:text-sm font-medium text-stone-700 mb-1">
                کد بازیابی یک‌بارمصرف
              </label>
              <input
                id="recoveryCode"
                type="text"
                required
                value={recoveryCode}
                onChange={(e) => setRecoveryCode(e.target.value)}
                className="w-full text-center tracking-wider px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-rose-800 font-mono text-sm"
                placeholder="XXXX-XXXX-XXXX-XXXX"
                dir="ltr"
                autoFocus
              />
              <p className="text-[11px] text-stone-500 mt-1">
                توجه: این کد بلافاصله پس از یک‌بار مصرف برای همیشه باطل خواهد شد.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl text-white bg-rose-900 hover:bg-rose-800 font-medium transition text-sm disabled:opacity-50"
            >
              {loading ? 'در حال بررسی کد...' : 'تأیید و ورود با کد بازیابی'}
            </button>

            <div className="flex justify-between items-center text-xs text-stone-500 pt-2">
              <button
                type="button"
                onClick={() => setStep('credentials')}
                className="hover:text-stone-800 underline"
              >
                بازگشت به ابتدا
              </button>
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setStep('mfa');
                }}
                className="text-rose-800 hover:underline font-medium"
              >
                ورود با نرم‌افزار Authenticator
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
