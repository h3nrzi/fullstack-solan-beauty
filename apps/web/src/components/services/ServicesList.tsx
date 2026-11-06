import React from 'react';
import Link from 'next/link';
import { Clock, CheckCircle2, AlertCircle, Calendar } from 'lucide-react';
import { ServiceDto, ServicePriceType } from '@salon/shared';

function formatPrice(toman?: number | null): string {
  if (toman == null) return '—';
  return toman.toLocaleString('fa-IR') + ' تومان';
}

interface ServicesListProps {
  services: ServiceDto[];
}

export function ServicesList({ services }: ServicesListProps) {
  if (services.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl border border-stone-200 p-8 text-stone-500 text-sm">
        هنوز خدمتی در کاتالوگ عمومی ثبت نشده است.
      </div>
    );
  }

  return (
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

          <div className="mt-4 pt-3 border-t border-stone-100 flex justify-end">
            <Link
              href={`/booking?serviceId=${srv.id}`}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-900 bg-rose-50 hover:bg-rose-100/80 px-3 py-1.5 rounded-lg border border-rose-200 transition-colors"
            >
              <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
              <span>مشاهده زمان‌های آزاد</span>
            </Link>
          </div>
        </article>
      ))}
    </section>
  );
}
