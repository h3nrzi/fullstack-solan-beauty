import React from 'react';
import Link from 'next/link';
import { ShieldAlert, CheckCircle } from 'lucide-react';
import { SharedResourceDto, ImpactedBookingDto } from '@salon/shared';

interface BookingAdminViewProps {
  resources: SharedResourceDto[];
  impactedBookings?: ImpactedBookingDto[];
  activeTab?: 'resources' | 'impacted';
}

export function BookingAdminView({
  resources,
  impactedBookings = [],
  activeTab = 'resources',
}: BookingAdminViewProps) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
      <div className="flex border-b border-stone-200 mb-6 gap-6" role="tablist">
        <Link
          href="/booking?view=admin&tab=resources"
          scroll={false}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'resources'
              ? 'border-rose-800 text-rose-950'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
          role="tab"
          aria-selected={activeTab === 'resources'}
        >
          منابع و تجهیزات مشترک
        </Link>
        <Link
          href="/booking?view=admin&tab=impacted"
          scroll={false}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'impacted'
              ? 'border-rose-800 text-rose-950'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
          role="tab"
          aria-selected={activeTab === 'impacted'}
        >
          <ShieldAlert className="w-4 h-4 text-amber-600" aria-hidden="true" />
          <span>نوبت‌های متأثر از تغییر قوانین</span>
        </Link>
      </div>

      {activeTab === 'resources' ? (
        <div>
          <p className="text-xs text-stone-600 mb-4 leading-relaxed">
            تجهیزات و فضاهای دارای ظرفیت محدود که ارائه خدمت به دسترسی به آن‌ها وابسته است (مانند صندلی سرشور، تخت فیشیال، اتاق عروس). کاهش ظرفیت نوبت‌های قبلی را خاموش بازنویسی نکرده و آن‌ها را علامت‌گذاری می‌کند.
          </p>

          <div className="space-y-3">
            {resources.length === 0 ? (
              <div className="p-6 text-center text-stone-500 text-xs">
                منبع مشترکی ثبت نشده است.
              </div>
            ) : (
              resources.map((res) => (
                <div
                  key={res.id}
                  className="flex items-center justify-between p-4 rounded-xl border border-stone-200 bg-stone-50"
                >
                  <div>
                    <h3 className="font-bold text-stone-900 text-sm">{res.name}</h3>
                    <p className="text-xs text-stone-500">{res.description || 'بدون توضیحات'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-stone-600 font-medium">ظرفیت کل:</span>
                    <span className="px-3 py-1 bg-white border border-stone-300 font-extrabold text-rose-900 rounded-lg text-sm">
                      {res.capacity} واحد
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 text-xs text-amber-900">
            <p className="font-bold mb-1">الزام عدم بازنویسی خاموش (Non-destructive Rule Changes):</p>
            <p>
              هنگامی که مدیریت شیفت آرتیست را تغییر می‌دهد، مرخصی ثبت می‌کند یا ظرفیت منبع را کاهش می‌دهد، نوبت‌های رزروشده قبلی هرگز به صورت خودکار حذف یا دستکاری نمی‌شوند؛ بلکه در این فهرست جهت هماهنگی انسانی با مشتری قرار می‌گیرند.
            </p>
          </div>

          {impactedBookings.length === 0 ? (
            <div className="p-8 text-center text-stone-500 border border-dashed border-stone-200 rounded-2xl">
              <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto mb-2" aria-hidden="true" />
              <p className="font-bold text-stone-700">هیچ نوبت متأثری وجود ندارد.</p>
              <p className="text-xs text-stone-500">تمامی نوبت‌های ثبت‌شده با قوانین جاری تقویم و ظرفیت سازگار هستند.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {impactedBookings.map((b) => (
                <div
                  key={b.id}
                  className="p-4 rounded-xl border border-amber-300 bg-amber-50/50 flex flex-col gap-1 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-stone-900">{b.customerName}</span>
                    <span className="text-amber-800 font-bold bg-amber-100 px-2 py-0.5 rounded">
                      نیازمند هماهنگی
                    </span>
                  </div>
                  <p className="text-stone-600">
                    علت تأثر: <span className="font-semibold text-rose-900">{b.impactReason}</span>
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
