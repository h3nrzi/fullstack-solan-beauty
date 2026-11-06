'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, LogIn } from 'lucide-react';

export function HomeNavbar() {
  return (
    <header className="sticky top-0 z-40 bg-[#fdfbf7]/90 backdrop-blur-md border-b border-stone-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Brand Logo & VIP Title */}
          <Link
            href="/"
            className="flex items-center gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-800 rounded-xl"
            aria-label="صفحه اصلی سالن زیبایی سولان"
          >
            <div className="w-10 h-10 rounded-2xl bg-rose-900 text-white flex items-center justify-center shadow-xs group-hover:bg-rose-800 transition-colors">
              <Sparkles className="w-5 h-5 text-rose-200" aria-hidden="true" />
            </div>
            <div>
              <span className="font-extrabold text-base sm:text-lg text-stone-900 tracking-tight block">
                سالن زیبایی سولان
              </span>
              <span className="text-[11px] text-stone-500 block -mt-0.5 font-medium">
                محیط اختصاصی VIP و مدیریت یکپارچه
              </span>
            </div>
          </Link>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-rose-900 hover:bg-rose-800 transition-all shadow-sm hover:shadow active:scale-[0.99]"
            >
              <LogIn className="w-4 h-4 text-rose-200" aria-hidden="true" />
              <span>ورود پرسنل سالن</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
