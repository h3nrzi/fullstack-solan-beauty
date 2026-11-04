'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ArrowRight,
  Clock,
  Layers,
  AlertTriangle,
  Info,
  CalendarCheck,
  UserCheck,
  ShieldAlert,
  Sliders,
  CheckCircle,
} from 'lucide-react';
import {
  ServiceDto,
  PublicArtistProfileDto,
  AvailableSlotDto,
  SharedResourceDto,
  ImpactedBookingDto,
} from '@salon/shared';
import { searchAvailableSlotsAction } from '../../actions/booking';

function formatTimeOnly(isoString: string): string {
  try {
    const d = new Date(isoString);
    const hours = d.getUTCHours().toString().padStart(2, '0');
    const minutes = d.getUTCMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  } catch {
    return isoString;
  }
}

interface BookingClientViewProps {
  services: ServiceDto[];
  artists: PublicArtistProfileDto[];
  resources: SharedResourceDto[];
  initialServiceId?: string;
}

export function BookingClientView({
  services,
  artists,
  resources,
  initialServiceId,
}: BookingClientViewProps) {
  const [selectedServiceId, setSelectedServiceId] = useState<string>(() => {
    if (initialServiceId && services.some((s) => s.id === initialServiceId)) {
      return initialServiceId;
    }
    return services.length > 0 ? services[0].id : '';
  });

  const [selectedArtistId, setSelectedArtistId] = useState<string>('');

  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const target = new Date();
    target.setDate(target.getDate() + 2);
    return target.toISOString().split('T')[0];
  });

  const [availableSlots, setAvailableSlots] = useState<AvailableSlotDto[]>([]);
  const [slotsSearched, setSlotsSearched] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Admin / Manager view state
  const [activeView, setActiveView] = useState<'customer' | 'admin'>('customer');
  const [impactedBookings] = useState<ImpactedBookingDto[]>([]);
  const [adminTab, setAdminTab] = useState<'resources' | 'impacted'>('resources');

  const handleFetchSlots = () => {
    if (!selectedServiceId || !selectedDate) return;
    setSearchError(null);

    startTransition(async () => {
      setSlotsSearched(true);
      const res = await searchAvailableSlotsAction({
        serviceId: selectedServiceId,
        date: selectedDate,
        artistId: selectedArtistId || undefined,
      });

      if (res.success) {
        setAvailableSlots(res.slots);
      } else {
        setAvailableSlots([]);
        setSearchError(res.error || 'خطا در استعلام ظرفیت');
      }
    });
  };

  const selectedService = services.find((s) => s.id === selectedServiceId);

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
          <div className="bg-stone-200/80 p-1 rounded-2xl flex max-w-md w-full border border-stone-300/60 shadow-inner">
            <button
              onClick={() => setActiveView('customer')}
              className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
                activeView === 'customer'
                  ? 'bg-white text-rose-950 shadow-sm'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <CalendarCheck className="w-4 h-4" />
              <span>جست‌وجوی زمان‌های آزاد</span>
            </button>
            <button
              onClick={() => setActiveView('admin')}
              className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
                activeView === 'admin'
                  ? 'bg-white text-rose-950 shadow-sm'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>مدیریت ظرفیت و منابع</span>
            </button>
          </div>
        </div>

        {activeView === 'customer' ? (
          <div>
            {/* Explanatory Policy Card */}
            <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-5 mb-8 text-xs sm:text-sm text-stone-700 leading-relaxed shadow-sm flex items-start gap-3">
              <Info className="w-5 h-5 text-rose-900 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-rose-950 mb-1">
                  قوانین ظرفیت واقعی و حریم خصوصی سالن:
                </p>
                <ul className="list-disc list-inside space-y-1 text-stone-600">
                  <li>پیشنهاد زمان تعهد ظرفیت یا نوبت قطعی ایجاد نمی‌کند. نوبت پس از پرداخت بیعانه تثبیت می‌گردد.</li>
                  <li>آرتیست در سراسر مدت خدمت، شامل زمان مکث مواد و پردازش، به صورت کامل متعهد و اشغال است.</li>
                  <li>تخصیص تجهیزات و منابع مشترک (مانند صندلی سرشور و تخت فیشیال) براساس مراحل دقیق خدمت کنترل می‌شود.</li>
                  <li>تقویم و نوبت‌های مراجعین دیگر به طور کامل محرمانه بوده و هویت دیگران فاش نمی‌شود.</li>
                </ul>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm mb-8">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                {/* Select Service */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    انتخاب خدمت:
                  </label>
                  <select
                    value={selectedServiceId}
                    onChange={(e) => setSelectedServiceId(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-800"
                  >
                    {services.length === 0 ? (
                      <option value="">خدمتی یافت نشد</option>
                    ) : (
                      services.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.durationMinutes ?? 60} دقیقه)
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* Select Date */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    تاریخ مورد نظر:
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-800"
                  />
                </div>

                {/* Select Artist */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    انتخاب آرتیست:
                  </label>
                  <select
                    value={selectedArtistId}
                    onChange={(e) => setSelectedArtistId(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-800"
                  >
                    <option value="">هر آرتیست واجد صلاحیت</option>
                    {artists.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.fullName} ({a.level})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={handleFetchSlots}
                disabled={isPending || !selectedServiceId || !selectedDate}
                className="w-full py-3 bg-rose-900 hover:bg-rose-950 text-white font-bold rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isPending ? (
                  <span>در حال استعلام ظرفیت واقعی از طریق سرور...</span>
                ) : (
                  <>
                    <Clock className="w-4 h-4" />
                    <span>بررسی زمان‌های آزاد و معتبر</span>
                  </>
                )}
              </button>

              {searchError && (
                <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs text-center font-medium">
                  {searchError}
                </div>
              )}
            </div>

            {/* Results Grid */}
            {slotsSearched && !isPending && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold text-stone-900">
                    زمان‌های در دسترس برای «{selectedService?.name || 'خدمت انتخابی'}»
                  </h2>
                  <span className="text-xs bg-stone-200 px-2.5 py-1 rounded-full text-stone-700 font-medium">
                    {availableSlots.length} زمان معتبر یافت شد
                  </span>
                </div>

                {availableSlots.length === 0 ? (
                  <div className="bg-white border border-stone-200 rounded-2xl p-10 text-center text-stone-500">
                    <AlertTriangle className="w-10 h-10 mx-auto text-amber-600 mb-2" />
                    <p className="font-semibold text-stone-800 mb-1">
                      در تاریخ انتخاب‌شده زمان بازی برای این خدمت یافت نشد.
                    </p>
                    <p className="text-xs text-stone-500">
                      ممکن است شیفت کاری آرتیست‌ها پر باشد، مرخصی ثبت شده باشد یا ظرفیت تجهیزات مشترک در این روز تکمیل شده باشد.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {availableSlots.map((slot, idx) => (
                      <div
                        key={idx}
                        className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-rose-300 transition-all"
                      >
                        <div className="flex items-center justify-between pb-3 mb-3 border-b border-stone-100">
                          <div className="flex items-center gap-2 text-rose-950 font-extrabold text-base">
                            <Clock className="w-4 h-4 text-rose-800" />
                            <span>
                              {formatTimeOnly(slot.startTime)} تا {formatTimeOnly(slot.endTime)}
                            </span>
                          </div>
                          <span className="text-xs bg-rose-50 text-rose-900 border border-rose-200/60 px-2 py-0.5 rounded-md font-medium">
                            {slot.totalDurationMinutes} دقیقه
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mb-4 text-xs text-stone-700">
                          <UserCheck className="w-4 h-4 text-emerald-700" />
                          <span>آرتیست تخصیص‌یافته:</span>
                          <span className="font-bold text-stone-900">{slot.artistName}</span>
                        </div>

                        {/* Phase breakdown */}
                        {slot.phaseDetails && slot.phaseDetails.length > 0 && (
                          <div className="bg-stone-50 rounded-xl p-3 text-xs space-y-1.5 border border-stone-200/60">
                            <span className="font-bold text-stone-800 block mb-1">
                              مراحل اجرای خدمت:
                            </span>
                            {slot.phaseDetails.map((ph, pIdx) => (
                              <div
                                key={pIdx}
                                className="flex items-center justify-between text-stone-600"
                              >
                                <span className="flex items-center gap-1.5">
                                  <Layers className="w-3.5 h-3.5 text-stone-400" />
                                  <span>{ph.phaseName}</span>
                                  {ph.isPause && (
                                    <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.2 rounded font-medium">
                                      مکث مواد
                                    </span>
                                  )}
                                </span>
                                <span className="text-stone-500 text-[11px]">
                                  {ph.resourceName ? `منبع: ${ph.resourceName}` : 'بدون منبع مشترک'}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Admin / Management View */
          <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
            <div className="flex border-b border-stone-200 mb-6 gap-6">
              <button
                type="button"
                onClick={() => setAdminTab('resources')}
                className={`pb-3 text-sm font-bold border-b-2 transition-colors ${
                  adminTab === 'resources'
                    ? 'border-rose-800 text-rose-950'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                منابع و تجهیزات مشترک
              </button>
              <button
                type="button"
                onClick={() => setAdminTab('impacted')}
                className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
                  adminTab === 'impacted'
                    ? 'border-rose-800 text-rose-950'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <span>نوبت‌های متأثر از تغییر قوانین</span>
              </button>
            </div>

            {adminTab === 'resources' ? (
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
                    <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
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
        )}
      </main>
    </div>
  );
}
