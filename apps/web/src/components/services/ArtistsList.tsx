import React from 'react';
import { Calendar, Image as ImageIcon } from 'lucide-react';
import { ArtistLevel, PublicArtistProfileDto, ServicePriceType } from '@salon/shared';

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

interface ArtistsListProps {
  artists: PublicArtistProfileDto[];
}

export function ArtistsList({ artists }: ArtistsListProps) {
  if (artists.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl border border-stone-200 p-8 text-stone-500 text-sm">
        هنوز آرتیستی در کاتالوگ عمومی ثبت نشده است.
      </div>
    );
  }

  return (
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
  );
}
