'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  KeyRound,
  CheckCircle,
  Copy,
  Check,
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

export function RecoveryWizard() {
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
    <div>
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
            ارسال درخواست به صف مدیران
          </Button>
        </form>
      )}

      {/* Request Created Success State */}
      {activeTab === 'request' && createdRequestId && (
        <div className="space-y-5 text-center animate-in fade-in">
          <div className="w-14 h-14 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl mx-auto flex items-center justify-center">
            <CheckCircle className="w-7 h-7" aria-hidden="true" />
          </div>

          <div>
            <h2 className="text-lg font-bold text-stone-900 mb-1">
              درخواست بازیابی اضطراری ثبت گردید
            </h2>
            <p className="text-xs text-stone-600 leading-relaxed max-w-sm mx-auto">
              درخواست شما به صف تأیید مدیران ارشد سالن ارسال شد. پس از بررسی، یک توکن تحویل امن (Claim Token) در اختیار شما قرار داده خواهد شد.
            </p>
          </div>

          <Card className="bg-stone-50 border-stone-200 text-right p-4 space-y-2">
            <span className="text-xs text-stone-500 block">شناسه پیگیری درخواست شما:</span>
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-stone-800" dir="ltr">
                {createdRequestId}
              </span>
              <button
                type="button"
                onClick={() => handleCopy(createdRequestId, setCopiedToken)}
                className="inline-flex items-center gap-1 text-xs text-rose-900 hover:text-rose-800 font-medium px-2 py-1 bg-white border border-stone-200 rounded-md transition"
              >
                {copiedToken ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedToken ? 'کپی شد' : 'کپی شناسه'}
              </button>
            </div>
          </Card>

          <Button
            type="button"
            variant="primary"
            className="w-full"
            onClick={() => setActiveTab('claim')}
          >
            رفتن به مرحله ۲ (تحویل با توکن)
          </Button>
        </div>
      )}

      {/* Tab 2: Claim Recovery */}
      {activeTab === 'claim' && !claimResult && (
        <form onSubmit={handleClaimSubmit} className="space-y-4">
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-3.5 text-xs text-stone-600 leading-relaxed flex items-start gap-2">
            <KeyRound className="w-4 h-4 text-rose-800 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <span>
              اگر مدیر سالن درخواست شما را تأیید کرده است، شناسه درخواست و توکن تحویل را در این بخش وارد کنید.
            </span>
          </div>

          <Input
            id="claimRequestId"
            label="شناسه درخواست بازیابی (Request ID)"
            type="text"
            required
            value={claimRequestId}
            onChange={(e) => setClaimRequestId(e.target.value)}
            placeholder="مثال: شناسه دریافتی در مرحله اول"
            dir="ltr"
            className="text-left font-mono"
          />

          <Input
            id="claimToken"
            label="توکن تحویل امن (Claim Token)"
            type="text"
            required
            value={claimToken}
            onChange={(e) => setClaimToken(e.target.value)}
            placeholder="توکن ۳۲ کاراکتری که از مدیر تحویل گرفته‌اید"
            dir="ltr"
            className="text-left font-mono"
            helperText="این توکن یک‌بارمصرف بوده و پس از فعال‌سازی باطل می‌گردد."
          />

          <Button type="submit" loading={loading} className="w-full">
            تأیید توکن و تحویل مشخصات جدید
          </Button>
        </form>
      )}

      {/* Claim Result State */}
      {claimResult && (
        <div className="space-y-6 animate-in fade-in">
          <div className="text-center space-y-1">
            <div className="w-14 h-14 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl mx-auto flex items-center justify-center mb-2">
              <CheckCircle className="w-7 h-7" aria-hidden="true" />
            </div>
            <h2 className="text-lg font-bold text-stone-900">
              حساب کاربری با موفقیت تحویل داده شد
            </h2>
            <p className="text-xs text-stone-500">
              کلید محرمانه جدید (Secret) و کدهای بازیابی اضطراری جدید شما صادر شدند.
            </p>
          </div>

          <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-2xl space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-rose-950">
              <AlertTriangle className="w-4 h-4 text-rose-800" aria-hidden="true" />
              <span>اقدام فوری: کدهای زیر را یادداشت و ذخیره کنید</span>
            </div>
            <p className="text-[11px] text-stone-600 leading-relaxed">
              این اطلاعات منحصراً یک‌بار نمایش داده می‌شوند و هیچ مدیری در سالن به آن‌ها دسترسی ندارد.
            </p>

            <div className="space-y-2 pt-1">
              <label className="block text-xs font-semibold text-stone-800">
                کلید امنیتی دوعاملی جدید (TOTP Secret):
              </label>
              <div className="flex items-center justify-between p-2.5 bg-white border border-rose-200 rounded-xl font-mono text-xs">
                <span className="select-all font-bold text-stone-900" dir="ltr">
                  {claimResult.newMfaSecret}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(claimResult.newMfaSecret, setCopiedSecret)}
                  className="inline-flex items-center gap-1 text-xs text-rose-900 font-semibold px-2 py-1 bg-rose-50 hover:bg-rose-100 rounded-lg transition"
                >
                  {copiedSecret ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedSecret ? 'کپی شد' : 'کپی'}
                </button>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-stone-800">
                  کدهای بازیابی یک‌بارمصرف (Recovery Codes):
                </label>
                <button
                  type="button"
                  onClick={() => handleCopy(claimResult.newRecoveryCodes.join('\n'), setCopiedCodes)}
                  className="inline-flex items-center gap-1 text-xs text-rose-900 font-semibold px-2 py-1 bg-rose-50 hover:bg-rose-100 rounded-lg transition"
                >
                  {copiedCodes ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedCodes ? 'همه کپی شد' : 'کپی همه'}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 p-3 bg-white border border-rose-200 rounded-xl font-mono text-xs text-center" dir="ltr">
                {claimResult.newRecoveryCodes.map((c, i) => (
                  <span key={i} className="bg-stone-50 border border-stone-200 py-1.5 rounded-lg select-all text-stone-800">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="text-center pt-2">
            <Link href="/login" className="inline-block w-full">
              <Button variant="primary" className="w-full">
                <span>ورود به سامانه با مشخصات جدید</span>
                <ArrowRight className="w-4 h-4 mr-1.5" aria-hidden="true" />
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
