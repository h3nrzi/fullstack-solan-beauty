'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CustomerDto, CustomerBookingDto } from '@salon/shared';
import { User, Calendar, Clock, LogOut, Shield, PlusCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { customerLogoutAction } from '../../actions/customer-auth';

interface CustomerDashboardViewProps {
  customer: CustomerDto;
  bookings: CustomerBookingDto[];
}

export function CustomerDashboardView({ customer, bookings }: CustomerDashboardViewProps) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await customerLogoutAction();
    router.refresh();
  };

  const getStatusBadge = (status: string) => {
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
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 text-right">
      {/* Header Profile Card */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-900 shadow-inner">
            <User className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-stone-900">
                {customer.fullName || 'مشتری گرامی'}
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-stone-100 text-stone-700">
                هویت پایدار
              </span>
            </div>
            <p className="text-xs sm:text-sm text-stone-500 font-mono mt-1 dir-ltr text-right">
              {customer.phone}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Link href="/booking" className="flex-1 sm:flex-none">
            <Button variant="primary" className="w-full text-sm py-2.5">
              <PlusCircle className="w-4 h-4 ml-1.5" />
              رزرو نوبت جدید
            </Button>
          </Link>
          <Button
            variant="outline"
            onClick={handleLogout}
            loading={loggingOut}
            className="text-sm py-2.5 text-stone-600 hover:text-red-700"
          >
            <LogOut className="w-4 h-4 ml-1.5" />
            خروج
          </Button>
        </div>
      </div>

      {/* Security Banner */}
      <div className="bg-emerald-50 border border-emerald-200/80 rounded-xl p-4 flex items-center gap-3 text-xs sm:text-sm text-emerald-900">
        <Shield className="w-5 h-5 text-emerald-700 shrink-0" />
        <p className="leading-relaxed">
          حساب کاربری شما تحت حفاظت کامل امنیتی است. تنها داده‌ها و سوابق نوبت‌های شخصی خودتان با احراز هویت پیامکی قابل مشاهده است.
        </p>
      </div>

      {/* Bookings Section */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-stone-200 pb-4">
          <div>
            <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-rose-800" />
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
            <Calendar className="w-12 h-12 text-stone-300 mx-auto mb-3" />
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
                      <Calendar className="w-4 h-4 text-stone-400" />
                      <span>{dateStr}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4 text-stone-400" />
                      <span className="font-mono">{timeStr}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
