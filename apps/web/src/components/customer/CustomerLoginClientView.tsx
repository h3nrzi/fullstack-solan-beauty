'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Smartphone, KeyRound, ArrowRight, ShieldCheck, RefreshCw } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import { requestCustomerOtpAction, verifyCustomerOtpAction } from '../../actions/customer-auth';

export function CustomerLoginClientView() {
  const router = useRouter();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanPhone = phone.trim();
    if (!cleanPhone.startsWith('09') || cleanPhone.length !== 11) {
      setError('لطفاً شماره موبایل ۱۱ رقمی معتبر با فرمت ۰۹xxxxxxxx وارد فرمایید.');
      return;
    }

    setLoading(true);
    const res = await requestCustomerOtpAction(cleanPhone);
    setLoading(false);

    if (!res.success) {
      setError(res.error || 'خطا در ارسال کد پیامکی.');
      return;
    }

    setStep('otp');
    setCountdown(res.data?.expiresInSeconds || 120);
    setCode('');
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanCode = code.trim();
    if (cleanCode.length !== 6) {
      setError('کد تأیید پیامک‌شده باید دقیقاً ۶ رقم باشد.');
      return;
    }

    setLoading(true);
    const res = await verifyCustomerOtpAction(phone.trim(), cleanCode);

    if (!res.success) {
      setError(res.error || 'کد وارد شده نامعتبر است.');
      setLoading(false);
      return;
    }

    router.refresh();
  };

  const handleResend = async () => {
    if (countdown > 0 || loading) return;
    setError(null);
    setLoading(true);
    const res = await requestCustomerOtpAction(phone.trim());
    setLoading(false);

    if (!res.success) {
      setError(res.error || 'خطا در ارسال مجدد کد پیامکی.');
      return;
    }

    setCountdown(res.data?.expiresInSeconds || 120);
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 sm:p-8 bg-white border border-stone-200 rounded-2xl shadow-sm text-right">
      <div className="text-center mb-6">
        <div className="w-12 h-12 bg-rose-50 border border-rose-100 text-rose-900 rounded-full flex items-center justify-center mx-auto mb-3">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
          ورود به حساب کاربری مشتری
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 mt-1.5 leading-relaxed">
          دسترسی امن به سوابق رزرو، خدمات و اطلاعات شخصی با کد تأیید پیامکی (OTP)
        </p>
      </div>

      {error && (
        <div className="mb-5">
          <Alert type="error">{error}</Alert>
        </div>
      )}

      {step === 'phone' ? (
        <form onSubmit={handleRequestOtp} className="space-y-4">
          <Input
            id="phone"
            type="tel"
            label="شماره تلفن همراه"
            placeholder="مثال: ۰۹۱۲۳۴۵۶۷۸۹"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            autoComplete="tel"
            dir="ltr"
            className="text-left font-mono text-base"
            helperText="کد ورود یک‌بارمصرف به این شماره پیامک خواهد شد."
          />

          <Button
            type="submit"
            loading={loading}
            className="w-full py-3.5 text-base font-semibold"
          >
            <Smartphone className="w-4 h-4 ml-2" />
            دریافت کد ورود (پیامک)
          </Button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 flex items-center justify-between text-xs sm:text-sm">
            <span className="text-stone-600">ارسال‌شده به:</span>
            <span className="font-mono font-semibold text-stone-900 dir-ltr">{phone}</span>
            <button
              type="button"
              onClick={() => {
                setStep('phone');
                setError(null);
              }}
              className="text-rose-800 hover:text-rose-950 text-xs font-medium underline flex items-center"
            >
              ویرایش شماره
            </button>
          </div>

          <Input
            id="otp"
            type="text"
            label="کد ۶ رقمی تأیید"
            placeholder="— — — — — —"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            required
            autoComplete="one-time-code"
            dir="ltr"
            className="text-center font-mono tracking-widest text-lg font-bold"
            maxLength={6}
            helperText="کد پیامک‌شده را وارد کنید (اعتبار ۲ دقیقه)"
          />

          <div className="flex items-center justify-between text-xs text-stone-600 px-1">
            {countdown > 0 ? (
              <span>زمان باقی‌مانده: {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}</span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={loading}
                className="text-rose-800 hover:text-rose-950 font-medium inline-flex items-center"
              >
                <RefreshCw className="w-3.5 h-3.5 ml-1" />
                ارسال مجدد کد
              </button>
            )}
          </div>

          <Button
            type="submit"
            loading={loading}
            className="w-full py-3.5 text-base font-semibold"
          >
            <KeyRound className="w-4 h-4 ml-2" />
            تأیید و ورود به حساب
          </Button>

          <button
            type="button"
            onClick={() => {
              setStep('phone');
              setError(null);
            }}
            className="w-full text-center text-xs text-stone-500 hover:text-stone-800 py-2 inline-flex items-center justify-center"
          >
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
            بازگشت به مرحله قبل
          </button>
        </form>
      )}

      <div className="mt-8 pt-5 border-t border-stone-200 text-center">
        <p className="text-[11px] text-stone-500 leading-normal">
          اطلاعات شما نزد سالن VIP محفوظ است و با رعایت استانداردهای حریم خصوصی مدیریت می‌شود.
        </p>
      </div>
    </div>
  );
}
