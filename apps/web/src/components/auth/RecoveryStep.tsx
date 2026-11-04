import React, { useState } from 'react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface RecoveryStepProps {
  loading: boolean;
  onSubmit: (recoveryCode: string) => Promise<void>;
  onBackToCredentials: () => void;
  onBackToMfa: () => void;
}

export function RecoveryStep({
  loading,
  onSubmit,
  onBackToCredentials,
  onBackToMfa,
}: RecoveryStepProps) {
  const [recoveryCode, setRecoveryCode] = useState('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit(recoveryCode);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        id="recoveryCode"
        label="کد بازیابی یک‌بارمصرف"
        type="text"
        required
        autoFocus
        value={recoveryCode}
        onChange={(e) => setRecoveryCode(e.target.value)}
        placeholder="XXXX-XXXX-XXXX-XXXX"
        dir="ltr"
        className="text-center tracking-wider font-mono text-sm"
        helperText="هشدار امنیتی: این کد بلافاصله پس از یک‌بار اعتبارسنجی باطل شده و امکان استفاده مجدد ندارد."
      />

      <Button type="submit" loading={loading} className="w-full">
        تأیید و ورود با کد بازیابی
      </Button>

      <div className="flex justify-between items-center text-xs text-stone-500 pt-2 border-t border-stone-100">
        <button
          type="button"
          onClick={onBackToCredentials}
          className="hover:text-stone-800 underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-stone-400 rounded"
        >
          بازگشت به ابتدا
        </button>
        <button
          type="button"
          onClick={onBackToMfa}
          className="text-rose-800 hover:text-rose-900 underline font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-rose-800 rounded"
        >
          ورود با اپلیکیشن Authenticator
        </button>
      </div>
    </form>
  );
}
