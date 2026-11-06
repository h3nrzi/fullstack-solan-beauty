import React from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight, CalendarCheck, Sliders } from 'lucide-react';
import { getServices, getArtists, getSharedResources } from '../../lib/api';
import { BookingPolicyCard } from '../../components/booking/BookingPolicyCard';
import { BookingSlotSearch } from '../../components/booking/BookingSlotSearch';
import { BookingAdminView } from '../../components/booking/BookingAdminView';

export const metadata = {
  title: 'برنامه کاری و ظرفیت تک‌خدمت',
  description: 'بررسی زمان‌های آزاد واقعی، ظرفیت تجهیزات مشترک و شیفت کاری آرتیست‌های سالن زیبایی VIP',
};

interface BookingPageProps {
  searchParams: Promise<{
    serviceId?: string;
    view?: string;
    tab?: string;
  }>;
}

export default async function BookingCapacityPage({ searchParams }: BookingPageProps) {
  const [services, artists, resources, resolvedParams] = await Promise.all([
    getServices(),
    getArtists(),
    getSharedResources(),
    searchParams,
  ]);

  const activeView = resolvedParams?.view === 'admin' ? 'admin' : 'customer';
  const adminTab = resolvedParams?.tab === 'impacted' ? 'impacted' : 'resources';

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 pb-16">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-30 shadow-sm backdrop-blur-md bg-white/90">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link
            href="/services"
            className="inline-flex items-center gap-2 text-stone-600 hover:text-stone-900 transition-colors text-sm font-medium"
          >
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
            <span>کاتالوگ خدمات</span>
          </Link>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-rose-800" aria-hidden="true" />
            <h1 className="font-extrabold text-stone-900 text-lg">برنامه کاری و ظرفیت تک‌خدمت</h1>
          </div>
          <Link
            href="/"
            className="text-xs text-rose-900 font-semibold hover:underline"
          >
            صفحه اصلی
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-8">
        {/* Mode Switcher */}
        <div className="flex justify-center mb-8">
          <div className="bg-stone-200/80 p-1 rounded-2xl flex max-w-md w-full border border-stone-300/60 shadow-inner" role="tablist">
            <Link
              href="/booking?view=customer"
              scroll={false}
              className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
                activeView === 'customer'
                  ? 'bg-white text-rose-950 shadow-sm'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
              role="tab"
              aria-selected={activeView === 'customer'}
            >
              <CalendarCheck className="w-4 h-4" aria-hidden="true" />
              <span>جست‌وجوی زمان‌های آزاد</span>
            </Link>
            <Link
              href="/booking?view=admin"
              scroll={false}
              className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
                activeView === 'admin'
                  ? 'bg-white text-rose-950 shadow-sm'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
              role="tab"
              aria-selected={activeView === 'admin'}
            >
              <Sliders className="w-4 h-4" aria-hidden="true" />
              <span>مدیریت ظرفیت و منابع</span>
            </Link>
          </div>
        </div>

        {activeView === 'customer' ? (
          <div>
            <BookingPolicyCard />
            <BookingSlotSearch
              services={services}
              artists={artists}
              initialServiceId={resolvedParams?.serviceId}
            />
          </div>
        ) : (
          <BookingAdminView
            resources={resources}
            activeTab={adminTab}
          />
        )}
      </main>
    </div>
  );
}
