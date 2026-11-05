import React from 'react';
import Link from 'next/link';
import { StaffProfile, StaffRole } from '@salon/shared';
import { ShieldCheck, User, LogOut, CheckCircle } from 'lucide-react';
import { Button } from '../ui/Button';

interface StaffDashboardProps {
  staff: StaffProfile;
  loading: boolean;
  onLogout: () => Promise<void>;
}

export function StaffDashboard({ staff, loading, onLogout }: StaffDashboardProps) {
  const roleLabels: Record<StaffRole, string> = {
    [StaffRole.MANAGER]: 'مدیر سالن',
    [StaffRole.RECEPTIONIST]: 'پذیرش',
    [StaffRole.ACCOUNTANT]: 'حسابدار',
    [StaffRole.ARTIST]: 'آرتیست زیبایی',
  };

  const roleBadgeColors: Record<StaffRole, string> = {
    [StaffRole.MANAGER]: 'bg-purple-100 text-purple-900 border-purple-200',
    [StaffRole.RECEPTIONIST]: 'bg-blue-100 text-blue-900 border-blue-200',
    [StaffRole.ACCOUNTANT]: 'bg-emerald-100 text-emerald-900 border-emerald-200',
    [StaffRole.ARTIST]: 'bg-rose-100 text-rose-900 border-rose-200',
  };

  return (
    <div className="space-y-6 text-center animate-in fade-in duration-300">
      <div className="w-16 h-16 bg-green-50 border border-green-200 rounded-full mx-auto flex items-center justify-center text-green-700 shadow-sm">
        <CheckCircle className="w-8 h-8" aria-hidden="true" />
      </div>

      <div>
        <h2 className="text-xl font-bold text-stone-900 mb-1">
          خوش آمدید، {staff.fullName}
        </h2>
        <p className="text-xs text-stone-500 font-mono" dir="ltr">
          @{staff.username}
        </p>
      </div>

      <div className="bg-stone-50/80 rounded-2xl p-4 border border-stone-200 text-right space-y-3">
        <div className="flex justify-between items-center text-xs sm:text-sm">
          <span className="text-stone-500 flex items-center gap-1.5">
            <User className="w-4 h-4 text-stone-400" aria-hidden="true" />
            نقش عملیاتی:
          </span>
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
              roleBadgeColors[staff.role] || 'bg-stone-100 text-stone-800'
            }`}
          >
            {roleLabels[staff.role] || staff.role}
          </span>
        </div>

        <div className="flex justify-between items-center text-xs sm:text-sm">
          <span className="text-stone-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-stone-400" aria-hidden="true" />
            وضعیت نشست:
          </span>
          <span className="text-emerald-700 font-medium flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
            احراز هویت دومرحله‌ای فعال
          </span>
        </div>
      </div>

      <div className="space-y-2.5">
        <Link
          href="/dashboard"
          className="w-full inline-flex items-center justify-center font-medium transition-all duration-200 rounded-xl px-4 py-3 text-sm bg-rose-900 text-white hover:bg-rose-800 shadow-sm hover:shadow"
        >
          ورود به میز کار و پنل پرسنل
        </Link>

        <Button
          variant="outline"
          loading={loading}
          onClick={onLogout}
          className="w-full text-rose-900 hover:bg-rose-50 hover:border-rose-300"
        >
          <LogOut className="w-4 h-4 ml-2" aria-hidden="true" />
          خروج از حساب کاربری
        </Button>
      </div>
    </div>
  );
}
