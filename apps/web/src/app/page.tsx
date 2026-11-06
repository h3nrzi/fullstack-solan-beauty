import React from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ShieldCheck,
  Award,
  Phone,
  MapPin,
  Clock,
  LogIn,
  LifeBuoy,
} from 'lucide-react';
import { HomeNavbar } from '../components/home/HomeNavbar';

export const metadata = {
  title: 'سالن زیبایی سولان VIP | سامانه مدیریت پرسنل',
  description:
    'سامانه اختصاصی سالن زیبایی سولان: محیط اختصاصی VIP، مدیریت پرسنل و دسترسی‌های یکپارچه امن.',
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#fdfbf7] text-stone-900 selection:bg-rose-100 selection:text-rose-900">
      {/* Top Navigation */}
      <HomeNavbar />

      <main>
        {/* HERO SECTION */}
        <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 border-b border-stone-200/60">
          <div className="absolute top-0 right-1/2 -mr-64 w-96 h-96 bg-rose-200/30 rounded-full blur-3xl -z-10 pointer-events-none" />
          <div className="absolute top-1/3 left-10 w-72 h-72 bg-amber-100/40 rounded-full blur-2xl -z-10 pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-50 border border-rose-200/80 text-rose-900 text-xs sm:text-sm font-semibold shadow-2xs">
                <Sparkles className="w-4 h-4 text-rose-800" aria-hidden="true" />
                <span>سامانه مدیریت یکپارچه سالن زیبایی سولان</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-stone-900 tracking-tight leading-[1.25] sm:leading-[1.2]">
                پلتفرم اختصاصی پرسنل و{' '}
                <span className="text-rose-900 underline decoration-rose-300 decoration-wavy decoration-2 underline-offset-8">
                  مدیریت سالن VIP
                </span>
              </h1>

              <p className="text-stone-600 text-sm sm:text-base lg:text-lg leading-relaxed max-w-2xl mx-auto font-normal">
                مرکز مدیریت و احراز هویت امن پرسنل سالن زیبایی سولان مجهز به احراز هویت دو مرحله‌ای (MFA)،
                مدیریت نقش‌ها، و کنترل نشست‌های فعال سازمانی.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
                <Link
                  href="/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-rose-900 text-white font-bold text-sm sm:text-base hover:bg-rose-800 transition-all shadow-md hover:shadow-lg active:scale-[0.99]"
                >
                  <LogIn className="w-5 h-5 text-rose-200" aria-hidden="true" />
                  <span>ورود به سامانه پرسنل</span>
                </Link>

                <Link
                  href="/recovery"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-white text-stone-800 border border-stone-300 font-bold text-sm sm:text-base hover:bg-stone-50 transition-all shadow-2xs"
                >
                  <LifeBuoy className="w-4 h-4 text-stone-600" aria-hidden="true" />
                  <span>بازیابی اضطراری حساب کاربری</span>
                </Link>
              </div>
            </div>

            {/* Trust and Key Value Strip */}
            <div className="mt-14 max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 p-4 sm:p-6 bg-white/80 backdrop-blur-sm rounded-3xl border border-stone-200/80 shadow-sm">
              <div className="text-center p-3">
                <div className="flex items-center justify-center gap-1 text-emerald-600 mb-1">
                  <ShieldCheck className="w-5 h-5" />
                  <span className="font-extrabold text-lg text-stone-900">MFA</span>
                </div>
                <p className="text-xs text-stone-600 font-semibold">امنیت دو مرحله‌ای</p>
                <p className="text-[11px] text-stone-400">حفاظت پیشرفته با کدهای TOTP</p>
              </div>

              <div className="text-center p-3 border-r border-stone-100">
                <div className="flex items-center justify-center gap-1 text-rose-900 mb-1">
                  <Award className="w-5 h-5" />
                  <span className="font-extrabold text-lg text-stone-900">RBAC</span>
                </div>
                <p className="text-xs text-stone-600 font-semibold">سطوح دسترسی سازمانی</p>
                <p className="text-[11px] text-stone-400">کنترل نقش‌ها بر اساس سیاست‌های سالن</p>
              </div>

              <div className="text-center p-3 border-r border-stone-100">
                <div className="flex items-center justify-center gap-1 text-purple-700 mb-1">
                  <LifeBuoy className="w-5 h-5" />
                  <span className="font-extrabold text-lg text-stone-900">۲-Man Rule</span>
                </div>
                <p className="text-xs text-stone-600 font-semibold">بازیابی امن با تأیید مستقل</p>
                <p className="text-[11px] text-stone-400">تأیید مستقل مدیر برای بازیابی حساب</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-stone-200 pt-12 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {/* Col 1: Brand Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-900 text-white flex items-center justify-center shadow-xs">
                  <Sparkles className="w-5 h-5 text-rose-200" aria-hidden="true" />
                </div>
                <div>
                  <span className="font-extrabold text-stone-900 text-base">سالن زیبایی سولان</span>
                  <span className="text-[10px] text-stone-500 block">مرکز تخصصی و اختصاصی VIP</span>
                </div>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed">
                سامانه امن مدیریت پرسنل و عملیات سالن زیبایی سولان.
              </p>
            </div>

            {/* Col 2: Staff Portals */}
            <div>
              <h3 className="font-bold text-xs uppercase text-stone-900 tracking-wider mb-3">
                دسترسی پرسنل
              </h3>
              <ul className="space-y-2 text-xs text-stone-600">
                <li>
                  <Link href="/login" className="hover:text-rose-900 transition-colors">
                    ورود همکاران و پرسنل سالن
                  </Link>
                </li>
                <li>
                  <Link href="/recovery" className="hover:text-rose-900 transition-colors">
                    بازیابی اضطراری حساب کاربری پرسنل
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3: Location & Hours */}
            <div className="space-y-3">
              <h3 className="font-bold text-xs uppercase text-stone-900 tracking-wider mb-1">
                اطلاعات حضور و تماس
              </h3>
              <div className="flex items-start gap-2 text-xs text-stone-600 leading-relaxed">
                <MapPin className="w-4 h-4 text-rose-800 flex-shrink-0 mt-0.5" />
                <span>تهران، منطقه ۱، خیابان فرشته، پلاک ۱۸، ساختمان سولان، واحد اختصاصی VIP</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-stone-600">
                <Clock className="w-4 h-4 text-rose-800 flex-shrink-0" />
                <span>ساعات کاری: همه‌روزه از ۹:۰۰ صبح الی ۲۰:۰۰ شب</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-stone-600">
                <Phone className="w-4 h-4 text-rose-800 flex-shrink-0" />
                <span dir="ltr" className="font-mono">۰۲۱ - ۲۲۰۰xxxx</span>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-stone-200/80 flex flex-col sm:flex-row items-center justify-between text-[11px] text-stone-500 gap-2">
            <p>© {new Date().getFullYear()} سالن زیبایی سولان. کلیه حقوق محفوظ است.</p>
            <p>سامانه مدیریت هوشمند و امنیت پرسنل سالن زیبایی VIP</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
