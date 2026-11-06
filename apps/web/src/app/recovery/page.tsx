import React from 'react';
import Link from 'next/link';
import { ChevronRight, LifeBuoy } from 'lucide-react';
import { RecoveryWizard } from '../../components/recovery/RecoveryWizard';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'بازیابی اضطراری حساب کارمند | سالن زیبایی VIP',
  description: 'فرآیند بازیابی حساب کاربری پرسنل در صورت از دست رفتن احراز هویت دوعاملی با تایید مدیر سالن',
};

export default function RecoveryPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6">
      <div className="max-w-xl w-full p-6 sm:p-8 bg-white/95 backdrop-blur-md shadow-2xl rounded-3xl border border-stone-200/90 transition-all duration-300">
        {/* Server-rendered Header */}
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

        {/* Client-side Interactive Wizard */}
        <RecoveryWizard />
      </div>
    </main>
  );
}
