'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  LifeBuoy,
  KeyRound,
  CheckCircle,
  Copy,
  Check,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import { Card } from '../ui/Card';
import {
  requestRecoveryAction,
  claimRecoveryAction,
  ClaimRecoveryResultData,
} from '../../actions/emergency-recovery';

type RecoveryTab = 'request' | 'claim';

export function RecoveryClientView() {
  const [activeTab, setActiveTab] = useState<RecoveryTab>('request');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tab 1 state: Request
  const [targetStaffId, setTargetStaffId] = useState('');
  const [requesterNote, setRequesterNote] = useState('');
  const [createdRequestId, setCreatedRequestId] = useState<string | null>(null);

  // Tab 2 state: Claim
  const [claimRequestId, setClaimRequestId] = useState('');
  const [claimToken, setClaimToken] = useState('');
  const [claimResult, setClaimResult] = useState<ClaimRecoveryResultData | null>(null);

  // Copy helpers
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);

  const handleCopy = (text: string, setStatus: (val: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setStatus(true);
    setTimeout(() => setStatus(false), 2000);
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await requestRecoveryAction({
        targetStaffId: targetStaffId.trim(),
        requesterNote: requesterNote.trim(),
      });

      if (!res.success || !res.data) {
        setError(res.error || 'خطا در ثبت درخواست بازیابی.');
        return;
      }

      setCreatedRequestId(res.data.id);
      setClaimRequestId(res.data.id);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await claimRecoveryAction({
        requestId: claimRequestId.trim(),
        claimToken: claimToken.trim(),
      });

      if (!res.success || !res.data) {
        setError(res.error || 'خطا در تحویل حساب کاربری.');
        return;
      }

      setClaimResult(res.data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6">
      <div className="max-w-xl w-full p-6 sm:p-8 bg-white/95 backdrop-blur-md shadow-2xl rounded-3xl border border-stone-200/90 transition-all duration-300">
        <header className="text-center mb-6">
          <Link
            href="/login"
            className="inline-flex items-center text-xs text-stone-500 hover:text-stone-800 transition mb-3 group"
          >
            <ChevronRight className="w-3.5 h-3.5 ml-0.5 group-hover:-translate-x-0.5 transition-transform" />
            بازگشت به صفحه ورود
          </Link>

          <div className="w-12 h-12 bg-amber-50 border border-amber-200 rounded-2xl mx-auto flex items-center justify-center text-amber-700 mb-3 shadow-sm">
            <LifeBuoy className="w-6 h-6" aria-hidden="true" />
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-stone-900">
            بازیابی اضطراری حساب پرسنل
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            فرآیند ایمن بازیابی دومرحله‌ای با تأیید مدیر مستقل سالن
          </p>
        </header>

        {/* Navigation Tabs */}
        {!claimResult && (
          <div className="flex p-1 mb-6 bg-stone-100 rounded-xl" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'request'}
              onClick={() => {
                setError(null);
                setActiveTab('request');
              }}
              className={`flex-1 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all cursor-pointer ${
                activeTab === 'request'
                  ? 'bg-white text-rose-950 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              ۱. ثبت درخواست بازیابی
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'claim'}
              onClick={() => {
                setError(null);
                setActiveTab('claim');
              }}
              className={`flex-1 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all cursor-pointer ${
                activeTab === 'claim'
                  ? 'bg-white text-rose-950 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              ۲. تحویل و فعال‌سازی حساب
            </button>
          </div>
        )}

        {error && (
          <div className="mb-5">
            <Alert type="error">{error}</Alert>
          </div>
        )}

        {/* Tab 1: Request Recovery */}
        {activeTab === 'request' && !createdRequestId && (
          <form onSubmit={handleRequestSubmit} className="space-y-4">
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3.5 text-xs text-amber-900 leading-relaxed flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <span>
                این روال زمانی استفاده می‌شود که به نرم‌افزار احراز هویت و کدهای بازیابی خود دسترسی ندارید. پس از ثبت، درخواست باید توسط یک مدیر مستقل تأیید شود.
              </span>
            </div>

            <Input
              id="targetStaffId"
              label="شناسه کارمند (Staff ID)"
              type="text"
              required
              value={targetStaffId}
              onChange={(e) => setTargetStaffId(e.target.value)}
              placeholder="مثال: UUID کاربری یا شناسه پرسنلی"
              dir="ltr"
              className="text-left font-mono"
              helperText="شناسه پرسنلی خود را از مسئول سیستم یا پذیرش دریافت کنید."
            />

            <Textarea
              id="requesterNote"
              label="علت درخواست بازیابی"
              required
              rows={3}
              value={requesterNote}
              onChange={(e) => setRequesterNote(e.target.value)}
              placeholder="توضیح دهید چرا به کدها دسترسی ندارید (مانند مفقودی گوشی تلفن یا تعویض دستگاه)..."
            />

            <Button type="submit" loading={loading} className="w-full">
              ثبت درخواست بازیابی
            </Button>
          </form>
        )}

        {/* Tab 1: Request Success State */}
        {activeTab === 'request' && createdRequestId && (
          <div className="space-y-5 animate-in fade-in duration-300">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-right space-y-3">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                درخواست شما با موفقیت ثبت شد
              </div>
              <p className="text-xs text-stone-600 leading-relaxed">
                شناسه پیگیری زیر را کپی کرده و به مدیر ارشد سالن ارائه دهید تا هویت شما را حضوری تأیید و برای شما <strong>توکن تحویل (Claim Token)</strong> صادر کند:
              </p>
              <div className="flex items-center justify-between p-3 bg-white border border-emerald-300 rounded-xl">
                <span className="font-mono text-xs sm:text-sm text-stone-900 select-all" dir="ltr">
                  {createdRequestId}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(createdRequestId, setCopiedToken)}
                  className="inline-flex items-center gap-1 text-xs text-emerald-800 hover:text-emerald-900 font-medium px-2 py-1 rounded-md hover:bg-emerald-50 transition cursor-pointer"
                >
                  {copiedToken ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedToken ? 'کپی شد' : 'کپی شناسه'}
                </button>
              </div>
            </div>

            <Button
              type="button"
              onClick={() => {
                setError(null);
                setActiveTab('claim');
              }}
              className="w-full"
            >
              رفتن به گام دوم (تحویل و فعال‌سازی با توکن مدیر)
              <ArrowRight className="w-4 h-4 mr-2" />
            </Button>
          </div>
        )}

        {/* Tab 2: Claim Credentials Form */}
        {activeTab === 'claim' && !claimResult && (
          <form onSubmit={handleClaimSubmit} className="space-y-4">
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-3.5 text-xs text-stone-600 leading-relaxed flex items-start gap-2">
              <KeyRound className="w-4 h-4 text-stone-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <span>
                توکن تحویل یک‌بارمصرف (Claim Token) صادر شده توسط مدیر را به همراه شناسه پیگیری در فرم زیر وارد کنید تا کدهای جدید به شما نمایش داده شوند.
              </span>
            </div>

            <Input
              id="claimRequestId"
              label="شناسه پیگیری درخواست (Request ID)"
              type="text"
              required
              value={claimRequestId}
              onChange={(e) => setClaimRequestId(e.target.value)}
              placeholder="شناسه پیگیری دریافت شده در مرحله اول"
              dir="ltr"
              className="text-left font-mono"
            />

            <Input
              id="claimToken"
              label="توکن تحویل امن (Claim Token صادر شده توسط مدیر)"
              type="text"
              required
              value={claimToken}
              onChange={(e) => setClaimToken(e.target.value)}
              placeholder="توکن ۶۴ کاراکتری دریافت شده از مدیر سالن"
              dir="ltr"
              className="text-left font-mono"
            />

            <Button type="submit" loading={loading} className="w-full">
              تحویل و فعال‌سازی حساب کاربری
            </Button>
          </form>
        )}

        {/* Tab 2: Claim Success Credentials Display */}
        {claimResult && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 bg-emerald-50 border border-emerald-200 rounded-full mx-auto flex items-center justify-center text-emerald-700">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-stone-900">
                حساب کاربری شما با موفقیت بازیابی شد!
              </h2>
              <p className="text-xs text-stone-500">
                اطلاعات امنیتی جدید خود را یادداشت و ذخیره کنید:
              </p>
            </div>

            {/* New MFA Secret */}
            <Card variant="muted" className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-stone-800">
                <span>کلید احراز هویت دومرحله‌ای (TOTP Secret):</span>
                <button
                  type="button"
                  onClick={() => handleCopy(claimResult.newMfaSecret, setCopiedSecret)}
                  className="inline-flex items-center gap-1 text-xs text-rose-800 hover:text-rose-900 font-medium px-2 py-0.5 rounded hover:bg-rose-50 transition cursor-pointer"
                >
                  {copiedSecret ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedSecret ? 'کپی شد' : 'کپی کلید'}
                </button>
              </div>
              <div className="p-2.5 bg-white border border-stone-200 rounded-xl font-mono text-center text-stone-900 font-bold tracking-widest text-sm select-all" dir="ltr">
                {claimResult.newMfaSecret}
              </div>
              <p className="text-[11px] text-stone-500 leading-normal">
                این کلید را در اپلیکیشن Google Authenticator یا ابزار TOTP خود وارد کنید.
              </p>
            </Card>

            {/* New Recovery Codes */}
            <Card variant="muted" className="space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-stone-800">
                <span>کدهای بازیابی یک‌بارمصرف جدید:</span>
                <button
                  type="button"
                  onClick={() => handleCopy(claimResult.newRecoveryCodes.join('\n'), setCopiedCodes)}
                  className="inline-flex items-center gap-1 text-xs text-rose-800 hover:text-rose-900 font-medium px-2 py-0.5 rounded hover:bg-rose-50 transition cursor-pointer"
                >
                  {copiedCodes ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedCodes ? 'کپی شد' : 'کپی تمام کدها'}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {claimResult.newRecoveryCodes.map((code, idx) => (
                  <div
                    key={idx}
                    className="p-2 bg-white border border-stone-200 rounded-lg font-mono text-center text-xs text-stone-800 select-all"
                    dir="ltr"
                  >
                    {code}
                  </div>
                ))}
              </div>

              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 flex items-start gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                <span>این کدها را در مکانی امن ذخیره کنید. هر کد فقط یک‌بار قابل استفاده است.</span>
              </div>
            </Card>

            <Link
              href="/login"
              className="w-full inline-flex items-center justify-center font-medium transition-all duration-200 rounded-xl px-4 py-3 text-sm bg-rose-900 text-white hover:bg-rose-800 shadow-sm hover:shadow"
            >
              ورود به سیستم با مشخصات جدید
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
