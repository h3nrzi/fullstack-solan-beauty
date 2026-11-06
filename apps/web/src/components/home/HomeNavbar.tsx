'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Sparkles, Menu, X, CalendarCheck, User, ShieldCheck } from 'lucide-react';

export function HomeNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
                محیط اختصاصی VIP و خدمات تخصصی
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-semibold text-stone-700">
            <Link
              href="/services"
              className="hover:text-rose-900 transition-colors py-1"
            >
              خدمات و تعرفه‌ها
            </Link>
            <Link
              href="/services?tab=artists"
              className="hover:text-rose-900 transition-colors py-1"
            >
              آرتیست‌ها و تخصص‌ها
            </Link>
            <Link
              href="/booking"
              className="hover:text-rose-900 transition-colors py-1"
            >
              ظرفیت و زمان‌های آزاد
            </Link>
            <Link
              href="#guide"
              className="hover:text-rose-900 transition-colors py-1"
            >
              راهنمای اولین مراجعه
            </Link>
            <Link
              href="#faq"
              className="hover:text-rose-900 transition-colors py-1"
            >
              سوالات متداول
            </Link>
          </nav>

          {/* Action CTAs */}
          <div className="hidden sm:flex items-center gap-3">
            <Link
              href="/customer/account"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-stone-700 bg-white border border-stone-200/90 hover:bg-stone-50 transition-all shadow-2xs"
            >
              <User className="w-4 h-4 text-stone-500" aria-hidden="true" />
              <span>ورود مراجعین</span>
            </Link>

            <Link
              href="/booking"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-rose-900 hover:bg-rose-800 transition-all shadow-sm hover:shadow active:scale-[0.99]"
            >
              <CalendarCheck className="w-4 h-4 text-rose-200" aria-hidden="true" />
              <span>رزرو آنلاین نوبت</span>
            </Link>

            <Link
              href="/login"
              className="text-stone-400 hover:text-stone-700 text-[11px] transition-colors pr-1"
              title="ورود همکاران و آرتیست‌های سالن"
            >
              ورود پرسنل
            </Link>
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="lg:hidden flex items-center gap-2">
            <Link
              href="/booking"
              className="inline-flex sm:hidden items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-rose-900 shadow-sm"
            >
              <CalendarCheck className="w-3.5 h-3.5 text-rose-200" aria-hidden="true" />
              <span>رزرو نوبت</span>
            </Link>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-stone-700 hover:text-stone-900 rounded-xl hover:bg-stone-100 transition-colors cursor-pointer border border-stone-200/70"
              aria-label="منوی سایت"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" aria-hidden="true" />
              ) : (
                <Menu className="w-5 h-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-stone-200/80 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
            <nav className="flex flex-col space-y-1 text-sm font-medium text-stone-800">
              <Link
                href="/services"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3.5 py-2.5 rounded-xl hover:bg-rose-50 hover:text-rose-900 transition-colors"
              >
                خدمات و تعرفه‌ها
              </Link>
              <Link
                href="/services?tab=artists"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3.5 py-2.5 rounded-xl hover:bg-rose-50 hover:text-rose-900 transition-colors"
              >
                آرتیست‌ها و تخصص‌ها
              </Link>
              <Link
                href="/booking"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3.5 py-2.5 rounded-xl hover:bg-rose-50 hover:text-rose-900 transition-colors"
              >
                ظرفیت و زمان‌های آزاد
              </Link>
              <Link
                href="#guide"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3.5 py-2.5 rounded-xl hover:bg-rose-50 hover:text-rose-900 transition-colors"
              >
                راهنمای اولین مراجعه
              </Link>
              <Link
                href="#faq"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3.5 py-2.5 rounded-xl hover:bg-rose-50 hover:text-rose-900 transition-colors"
              >
                سوالات متداول
              </Link>
            </nav>

            <div className="pt-3 border-t border-stone-200/60 flex flex-col gap-2">
              <Link
                href="/booking"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white bg-rose-900 font-bold text-sm shadow-sm"
              >
                <CalendarCheck className="w-4 h-4 text-rose-200" aria-hidden="true" />
                <span>رزرو آنلاین نوبت و انتخاب ساعت</span>
              </Link>
              <Link
                href="/customer/account"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-stone-800 bg-white border border-stone-200 font-semibold text-sm"
              >
                <User className="w-4 h-4 text-stone-500" aria-hidden="true" />
                <span>ورود به حساب مشتری (پیامکی)</span>
              </Link>
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-1.5 py-2 text-stone-500 hover:text-stone-800 text-xs text-center"
              >
                <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                <span>ورود پرسنل سالن زیبایی سولان</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
