import React, { useState } from 'react';
import Link from 'next/link';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface MfaStepProps {
  loading: boolean;
  onSubmit: (code: string) => Promise<void>;
  onBack: () => void;
  onUseRecovery: () => void;
}

export function MfaStep({ loading, onSubmit, onBack, onUseRecovery }: MfaStepProps) {
  const [code, setCode] = useState('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit(code);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        id="totpCode"
        label="کد یک‌بارمصرف زمان‌دار (TOTP)"
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={6}
        required
        autoComplete="one-time-code"
        autoFocus
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="000000"
        dir="ltr"
        className="text-center tracking-widest text-lg font-mono"
        helperText="کد ۶ رقمی تولید شده در نرم‌افزار احراز هویت (مانند Google Authenticator) را وارد کنید."
      />

      <Button type="submit" loading={loading} className="w-full">
        تأیید و ورود
      </Button>

      <div className="flex justify-between items-center text-xs text-stone-500 pt-2 border-t border-stone-100">
        <button
          type="button"
          onClick={onBack}
          className="hover:text-stone-800 underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-stone-400 rounded cursor-pointer"
        >
          بازگشت
        </button>
        <button
          type="button"
          onClick={onUseRecovery}
          className="text-rose-800 hover:text-rose-900 underline font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-rose-800 rounded cursor-pointer"
        >
          استفاده از کد بازیابی
        </button>
      </div>

      <div className="text-center pt-1">
        <Link
          href="/recovery"
          className="text-xs text-stone-500 hover:text-rose-800 underline transition-colors"
        >
          کد یا دستگاه احراز هویت را گم کرده‌اید؟ بازیابی اضطراری
        </Link>
      </div>
    </form>
  );
}
