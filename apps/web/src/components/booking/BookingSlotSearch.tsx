'use client';

import React, { useState, useTransition } from 'react';
import {
  Clock,
  Layers,
  AlertTriangle,
  UserCheck,
} from 'lucide-react';
import {
  ServiceDto,
  PublicArtistProfileDto,
  AvailableSlotDto,
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

interface BookingSlotSearchProps {
  services: ServiceDto[];
  artists: PublicArtistProfileDto[];
  initialServiceId?: string;
}

export function BookingSlotSearch({
  services,
  artists,
  initialServiceId,
}: BookingSlotSearchProps) {
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
    <div>
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
          className="w-full py-3 bg-rose-900 hover:bg-rose-950 text-white font-bold rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
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
                              <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.5 rounded font-medium">
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
  );
}
