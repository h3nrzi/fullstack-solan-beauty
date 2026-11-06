import React from 'react';
import Link from 'next/link';
import { Calendar, Clock } from 'lucide-react';
import { CustomerBookingDto } from '@salon/shared';
import { Button } from '../ui/Button';

function getStatusBadge(status: string) {
  switch (status) {
    case 'CONFIRMED':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
          تأییدشده
        </span>
      );
    case 'COMPLETED':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-800 border border-blue-200">
          انجام‌شده
        </span>
      );
    case 'CANCELLED':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-800 border border-red-200">
          لغوشده
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-700">
          در انتظار
        </span>
      );
  }
}

interface CustomerBookingsListProps {
  bookings: CustomerBookingDto[];
}

export function CustomerBookingsList({ bookings }: CustomerBookingsListProps) {
  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b border-stone-200 pb-4">
        <div>
          <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-rose-800" aria-hidden="true" />
            سوابق و نوبت‌های من
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            فهرست نوبت‌های ثبت‌شده به نام شما در سالن
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 bg-stone-100 text-stone-800 rounded-lg">
          {bookings.length} نوبت
        </span>
      </div>

      {bookings.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-stone-200 rounded-xl">
          <Calendar className="w-12 h-12 text-stone-300 mx-auto mb-3" aria-hidden="true" />
          <h3 className="text-sm font-semibold text-stone-800">
            هنوز نوبتی ثبت نکرده‌اید
          </h3>
          <p className="text-xs text-stone-500 mt-1 mb-4">
            شما می‌توانید خدمات سالن را بررسی کرده و زمان مورد نظر خود را رزرو کنید.
          </p>
          <Link href="/booking">
            <Button variant="outline" className="text-xs">
              مشاهده زمان‌های آزاد و رزرو
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {bookings.map((booking) => {
            const start = new Date(booking.startTime);
            const end = new Date(booking.endTime);
            const dateStr = start.toLocaleDateString('fa-IR');
            const timeStr = `${start.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })} تا ${end.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}`;

            return (
              <div
                key={booking.id}
                className="p-4 border border-stone-200 rounded-xl hover:border-rose-200 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-50/50"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-stone-900 text-sm sm:text-base">
                      {booking.serviceName}
                    </span>
                    {getStatusBadge(booking.status)}
                  </div>
                  {booking.artistName && (
                    <p className="text-xs text-stone-600">
                      آرتیست: <span className="font-medium text-stone-800">{booking.artistName}</span>
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs text-stone-600 border-t sm:border-t-0 pt-2 sm:pt-0">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-stone-400" aria-hidden="true" />
                    <span>{dateStr}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4 text-stone-400" aria-hidden="true" />
                    <span className="font-mono">{timeStr}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
