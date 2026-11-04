'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Award,
  Calendar,
  Layers,
  Image as ImageIcon,
} from 'lucide-react';
import { ServicePriceType, ArtistLevel, ServiceDto, PublicArtistProfileDto } from '@salon/shared';

const LEVEL_LABELS: Record<ArtistLevel, { label: string; color: string }> = {
  MASTER: { label: 'استادکار (Master)', color: 'bg-amber-100 text-amber-900 border-amber-300' },
  SENIOR: { label: 'ارشد (Senior)', color: 'bg-rose-100 text-rose-900 border-rose-300' },
  MID: { label: 'میانی (Mid)', color: 'bg-stone-100 text-stone-800 border-stone-300' },
  JUNIOR: { label: 'تازه‌کار (Junior)', color: 'bg-slate-100 text-slate-700 border-slate-300' },
};

function formatPrice(toman?: number | null): string {
  if (toman == null) return '—';
  return toman.toLocaleString('fa-IR') + ' تومان';
}

export default function ServicesPage() {
  const [activeTab, setActiveTab] = useState<'services' | 'artists'>('services');
  const [services, setServices] = useState<ServiceDto[]>([]);
  const [artists, setArtists] = useState<PublicArtistProfileDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      try {
        const [srvRes, artRes] = await Promise.all([
          fetch(`${apiBase}/api/public/services`),
          fetch(`${apiBase}/api/public/artists`),
        ]);

        if (srvRes.ok) {
          const srvData = await srvRes.json();
          setServices(srvData);
        }

        if (artRes.ok) {
          const artData = await artRes.json();
          setArtists(artData);
        }
      } catch (err: any) {
        setFetchError('امکان برقراری ارتباط با سرور فراهم نشد.');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

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

        {/* Tab Controls */}
        <div className="flex justify-center sm:justify-start gap-3 mb-8">
          <button
            type="button"
            onClick={() => setActiveTab('services')}
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
            <span className="text-xs opacity-80 px-2 py-0.5 rounded-full bg-white/20">
              {services.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('artists')}
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
            <span className="text-xs opacity-80 px-2 py-0.5 rounded-full bg-white/20">
              {artists.length}
            </span>
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-stone-500 text-sm">در حال دریافت اطلاعات...</div>
        ) : fetchError ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-rose-200 p-6 text-rose-800 text-sm">
            {fetchError}
          </div>
        ) : activeTab === 'services' ? (
          services.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-stone-200 p-8 text-stone-500 text-sm">
              هنوز خدمتی در کاتالوگ عمومی ثبت نشده است.
            </div>
          ) : (
            /* Services Grid */
            <section aria-label="فهرست خدمات سالن" className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {services.map((srv) => (
                <article
                  key={srv.id}
                  className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-lg font-bold text-stone-900">{srv.name}</h3>
                      {srv.requiresReview ? (
                        <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-medium">
                          <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
                          نیازمند بررسی و مشاوره
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                          قابل رزرو قطعی
                        </span>
                      )}
                    </div>

                    {srv.description && (
                      <p className="text-sm text-stone-600 mb-4 leading-relaxed">{srv.description}</p>
                    )}
                  </div>

                  <div className="pt-4 border-t border-stone-100 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1.5 text-stone-500">
                      <Clock className="w-4 h-4 text-stone-400" aria-hidden="true" />
                      <span>
                        {srv.durationMinutes
                          ? `${srv.durationMinutes.toLocaleString('fa-IR')} دقیقه`
                          : 'مدت: متغیر پس از بررسی'}
                      </span>
                    </div>

                    <div className="text-left font-bold text-rose-900">
                      {srv.priceType === ServicePriceType.FIXED ? (
                        <div>{formatPrice(srv.fixedPrice)}</div>
                      ) : (
                        <div className="flex flex-col items-end">
                          <div className="text-xs sm:text-sm">
                            از {formatPrice(srv.minPrice)} تا {formatPrice(srv.maxPrice)}
                          </div>
                          {srv.fixedDeposit != null && (
                            <span className="text-[11px] font-normal text-stone-500">
                              (بیعانه ثابت: {formatPrice(srv.fixedDeposit)})
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </section>
          )
        ) : artists.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-stone-200 p-8 text-stone-500 text-sm">
            هنوز آرتیستی در کاتالوگ عمومی ثبت نشده است.
          </div>
        ) : (
          /* Artists Grid */
          <section aria-label="آرتیست‌ها و متخصصان" className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {artists.map((artist) => {
              const levelMeta = LEVEL_LABELS[artist.level] ?? {
                label: artist.level,
                color: 'bg-stone-100 text-stone-800 border-stone-300',
              };

              return (
                <article
                  key={artist.id}
                  className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center font-bold text-rose-900 text-lg">
                          {artist.fullName.charAt(0)}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-stone-900">{artist.fullName}</h3>
                          <span
                            className={`inline-block text-xs px-2 py-0.5 rounded-md border font-semibold mt-1 ${levelMeta.color}`}
                          >
                            {levelMeta.label}
                          </span>
                        </div>
                      </div>

                      {artist.experienceYears != null && (
                        <div className="flex items-center gap-1 text-xs text-stone-500 bg-stone-50 border border-stone-200 px-2.5 py-1 rounded-xl">
                          <Calendar className="w-3.5 h-3.5 text-stone-400" aria-hidden="true" />
                          <span>{artist.experienceYears.toLocaleString('fa-IR')} سال سابقه</span>
                        </div>
                      )}
                    </div>

                    {artist.bio && (
                      <p className="text-sm text-stone-600 mb-4 leading-relaxed bg-stone-50/70 p-3 rounded-2xl border border-stone-100">
                        {artist.bio}
                      </p>
                    )}

                    {/* Assigned Tariffs */}
                    {artist.tariffs && artist.tariffs.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-xs font-bold text-stone-700 mb-2">
                          خدمات و تعرفه‌های تخصصی:
                        </h4>
                        <div className="space-y-1.5">
                          {artist.tariffs.map((t, idx) => (
                            <div
                              key={idx}
                              className="text-xs flex items-center justify-between bg-stone-50 px-3 py-2 rounded-xl border border-stone-100"
                            >
                              <span className="font-medium text-stone-800">{t.serviceName}</span>
                              <div className="text-left font-bold text-rose-900">
                                {t.priceType === ServicePriceType.FIXED
                                  ? formatPrice(t.fixedPrice)
                                  : `${formatPrice(t.minPrice)} تا ${formatPrice(t.maxPrice)}`}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Portfolio Preview */}
                    {artist.portfolioUrls && artist.portfolioUrls.length > 0 && (
                      <div>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-stone-700 mb-2">
                          <ImageIcon className="w-3.5 h-3.5 text-rose-800" aria-hidden="true" />
                          <span>نمونه‌کارهای تأییدشده:</span>
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-1">
                          {artist.portfolioUrls.map((url, i) => (
                            <a
                              key={i}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-block text-xs text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-xl transition-colors"
                            >
                              مشاهده تصویر {i + 1}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </main>
    </div>
  );
}
