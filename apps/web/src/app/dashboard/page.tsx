import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentStaff } from '../../lib/api';
import { StaffRole } from '@salon/shared';
import {
  ShieldCheck,
  Users,
  LifeBuoy,
  Sparkles,
  ArrowLeft,
  UserCheck,
  CheckCircle,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'میز کار پرسنل | سالن زیبایی سولان',
  description: 'داشبورد عملیاتی و امنیتی پرسنل سالن زیبایی',
};

export default async function StaffDashboardPage() {
  const staff = await getCurrentStaff();
  if (!staff) redirect('/login');

  const isManager = staff.role === StaffRole.MANAGER;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Welcome & Overview Header */}
      <div className="bg-gradient-to-l from-rose-900 to-rose-950 text-white rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 -mt-10 -ml-10 w-48 h-48 bg-rose-800/30 rounded-full blur-2xl" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-800/60 border border-rose-700/60 text-rose-200 text-xs mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>سامانه یکپارچه پرسنل و امنیت سالن VIP</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              خوش آمدید، {staff.fullName}
            </h1>
            <p className="text-xs sm:text-sm text-rose-200/90 mt-1.5 font-mono" dir="ltr">
              @{staff.username}
            </p>
          </div>

          <div className="bg-rose-950/70 border border-rose-800/80 rounded-2xl p-4 text-right">
            <span className="text-xs text-rose-300 block mb-1">نقش دسترسی فعلی:</span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white">
                {staff.role === StaffRole.MANAGER
                  ? 'مدیر ارشد سالن'
                  : staff.role === StaffRole.RECEPTIONIST
                  ? 'مسئول پذیرش'
                  : staff.role === StaffRole.ARTIST
                  ? 'آرتیست زیبایی'
                  : 'امور مالی و حسابداری'}
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* Security & Profile Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-800 flex-shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <span className="text-xs font-semibold text-stone-500">مشخصات سازمانی</span>
            <p className="text-sm font-bold text-stone-900">{staff.fullName}</p>
            <div className="pt-1">
              <Badge role={staff.role} size="sm">
                نقش: {staff.role}
              </Badge>
            </div>
          </div>
        </Card>

        <Card className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex-shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <span className="text-xs font-semibold text-stone-500">وضعیت امنیت نشست</span>
            <div className="flex items-center gap-1.5 text-sm font-bold text-emerald-700">
              <CheckCircle className="w-4 h-4" />
              <span>احراز هویت دو مرحله‌ای (MFA) فعال</span>
            </div>
            <p className="text-[11px] text-stone-400">نشست شما با پروتکل رمزنگاری محافظت می‌شود.</p>
          </div>
        </Card>

        <Card className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 flex-shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <span className="text-xs font-semibold text-stone-500">وضعیت حساب</span>
            <p className="text-sm font-bold text-stone-900">
              {staff.isActive ? 'کارمند فعال سالن' : 'غیرفعال'}
            </p>
            <p className="text-[11px] text-stone-400">مجوز دسترسی به ابزارهای سالن معتبر است.</p>
          </div>
        </Card>
      </div>

      {/* Operational Sections */}
      {isManager && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
            <span>دسترسی‌های مدیریتی</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Link href="/dashboard/staff" className="group">
              <Card variant="interactive" className="h-full flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-900 border border-purple-200 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    <Users className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-stone-900 mb-1 group-hover:text-rose-900 transition-colors">
                    مدیریت پرسنل و نشست‌ها
                  </h3>
                  <p className="text-xs text-stone-500 leading-relaxed">
                    مشاهده اعضای پرسنل سالن، تغییر و ارتقای نقش‌ها، و ابطال فوری نشست‌های پرخطر.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center text-xs font-semibold text-rose-900 group-hover:text-rose-800">
                  <span>ورود به مدیریت پرسنل</span>
                  <ArrowLeft className="w-3.5 h-3.5 mr-1 group-hover:-translate-x-1 transition-transform" />
                </div>
              </Card>
            </Link>

            <Link href="/dashboard/staff/recovery-requests" className="group">
              <Card variant="interactive" className="h-full flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    <LifeBuoy className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-stone-900 mb-1 group-hover:text-rose-900 transition-colors">
                    صف تأیید بازیابی اضطراری
                  </h3>
                  <p className="text-xs text-stone-500 leading-relaxed">
                    بررسی درخواست‌های پرسنلی که کدهای MFA خود را از دست داده‌اند و صدور توکن تحویل (Claim Token).
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center text-xs font-semibold text-rose-900 group-hover:text-rose-800">
                  <span>بررسی درخواست‌های معلق</span>
                  <ArrowLeft className="w-3.5 h-3.5 mr-1 group-hover:-translate-x-1 transition-transform" />
                </div>
              </Card>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
