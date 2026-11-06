import React from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight, Layers, Award } from 'lucide-react';
import { getServices, getArtists } from '../../lib/api';
import { ServicesList } from '../../components/services/ServicesList';
import { ArtistsList } from '../../components/services/ArtistsList';

export const metadata = {
  title: 'معرفی خدمات و تخصص آرتیست‌ها',
  description: 'شفافیت تعرفه خدمات سالن زیبایی VIP، بازه قیمت، مدت زمان و سطوح تخصص و سابقه آرتیست‌ها',
};

interface ServicesPageProps {
  searchParams: Promise<{
    tab?: string;
  }>;
}

export default async function ServicesPage({ searchParams }: ServicesPageProps) {
  const [services, artists, resolvedParams] = await Promise.all([
    getServices(),
    getArtists(),
    searchParams,
  ]);

  const activeTab = resolvedParams?.tab === 'artists' ? 'artists' : 'services';

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 pb-16">
      {/* Top Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-30 shadow-sm backdrop-blur-md bg-white/90">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-rose-900 hover:text-rose-800 text-sm font-semibold transition-colors"
          >
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
            <span>بازگشت به خانه</span>
          </Link>

          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-rose-800" aria-hidden="true" />
            <h1 className="text-base sm:text-lg font-bold text-stone-900">
              معرفی خدمات و تخصص آرتیست‌ها
            </h1>
          </div>

          <Link
            href="/login"
            className="text-xs sm:text-sm font-medium text-stone-600 hover:text-rose-900 transition-colors"
          >
            ورود پرسنل
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-8">
        {/* Banner */}
        <div className="mb-8 text-center sm:text-right bg-gradient-to-l from-rose-950/5 to-rose-900/10 p-6 rounded-3xl border border-rose-200/60 shadow-sm">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 mb-2">
            شفافیت قیمت، سابقه و سطح مهارت
          </h2>
          <p className="text-sm sm:text-base text-stone-600 leading-relaxed max-w-2xl">
            تعرفه تمام خدمات به صورت قطعی یا بازه مشخص، و پروفایل تخصصی آرتیست‌ها بدون نیاز به ثبت‌نام قابل مقایسه است.
          </p>
        </div>

        {/* Tab Controls (Accessible URL-based tabs, zero client JS needed) */}
        <div className="flex justify-center sm:justify-start gap-3 mb-8" role="tablist" aria-label="انتخاب بخش نمایش">
          <Link
            href="/services?tab=services"
            scroll={false}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-200 ${
              activeTab === 'services'
                ? 'bg-rose-900 text-white shadow-md'
                : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
            }`}
            aria-selected={activeTab === 'services'}
            role="tab"
          >
            <Layers className="w-4 h-4" aria-hidden="true" />
            <span>فهرست خدمات سالن</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                activeTab === 'services' ? 'bg-white/20' : 'bg-stone-100 text-stone-600'
              }`}
            >
              {services.length}
            </span>
          </Link>

          <Link
            href="/services?tab=artists"
            scroll={false}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-200 ${
              activeTab === 'artists'
                ? 'bg-rose-900 text-white shadow-md'
                : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
            }`}
            aria-selected={activeTab === 'artists'}
            role="tab"
          >
            <Award className="w-4 h-4" aria-hidden="true" />
            <span>آرتیست‌ها و مقایسه سطوح</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                activeTab === 'artists' ? 'bg-white/20' : 'bg-stone-100 text-stone-600'
              }`}
            >
              {artists.length}
            </span>
          </Link>
        </div>

        {activeTab === 'services' ? (
          <ServicesList services={services} />
        ) : (
          <ArtistsList artists={artists} />
        )}
      </main>
    </div>
  );
}
