import Link from 'next/link';
import { Sparkles, ShieldCheck, CalendarCheck, Users } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full p-8 bg-white/90 backdrop-blur-md shadow-2xl rounded-3xl border border-stone-200/80 transition-all duration-300 hover:shadow-rose-950/5">
        <div className="mx-auto w-14 h-14 bg-rose-50 border border-rose-200/60 rounded-2xl flex items-center justify-center mb-5 text-rose-900 shadow-sm">
          <Sparkles className="w-7 h-7" aria-hidden="true" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 mb-2 tracking-tight">
          سالن زیبایی VIP
        </h1>
        <p className="text-stone-600 mb-8 text-sm leading-relaxed">
          سامانه یکپارچه مدیریت نوبت‌ها، خدمات آرتیست‌ها و امنیت دسترسی پرسنل
        </p>

        <div className="grid grid-cols-3 gap-3 mb-8 text-xs text-stone-600">
          <Link
            href="/services"
            className="flex flex-col items-center p-3 rounded-xl bg-stone-50 border border-stone-100 hover:bg-rose-50/60 hover:border-rose-200 transition-colors"
          >
            <CalendarCheck className="w-5 h-5 text-rose-800 mb-1" aria-hidden="true" />
            <span>خدمات و رزرو</span>
          </Link>
          <Link
            href="/services"
            className="flex flex-col items-center p-3 rounded-xl bg-stone-50 border border-stone-100 hover:bg-rose-50/60 hover:border-rose-200 transition-colors"
          >
            <Users className="w-5 h-5 text-rose-800 mb-1" aria-hidden="true" />
            <span>آرتیست‌ها</span>
          </Link>
          <Link
            href="/login"
            className="flex flex-col items-center p-3 rounded-xl bg-stone-50 border border-stone-100 hover:bg-rose-50/60 hover:border-rose-200 transition-colors"
          >
            <ShieldCheck className="w-5 h-5 text-rose-800 mb-1" aria-hidden="true" />
            <span>ورود امن</span>
          </Link>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href="/services"
            className="inline-flex w-full justify-center items-center py-3 px-4 rounded-xl text-stone-900 bg-stone-100 hover:bg-stone-200 border border-stone-200/80 font-semibold transition-all duration-200 shadow-sm"
          >
            معرفی و مقایسه خدمات و آرتیست‌ها
          </Link>
          <Link
            href="/login"
            className="inline-flex w-full justify-center items-center py-3.5 px-4 rounded-xl text-white bg-rose-900 hover:bg-rose-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-800 focus-visible:ring-offset-2 transition-all duration-200 font-semibold shadow-md hover:shadow-lg active:scale-[0.99]"
          >
            ورود به پنل کارکنان
          </Link>
        </div>
      </div>
    </main>
  );
}
