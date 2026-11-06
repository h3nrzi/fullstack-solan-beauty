import React from 'react';
import { StaffRole } from '@salon/shared';
import { Users, ShieldAlert } from 'lucide-react';
import { getCurrentStaff, getStaffList } from '../../../lib/api';
import { Card } from '../../../components/ui/Card';
import { StaffManagementTable } from '../../../components/admin/StaffManagementTable';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'مدیریت پرسنل و دسترسی‌ها | سالن زیبایی سولان',
  description: 'مدیریت نقش‌های کارمندان و ابطال نشست‌های فعال',
};

export default async function AdminStaffPage() {
  const staff = (await getCurrentStaff())!;

  // Server-side authorization guard: Prevent data leak to non-managers
  if (staff.role !== StaffRole.MANAGER) {
    return (
      <Card className="max-w-xl mx-auto my-12 text-center p-8 space-y-4">
        <div className="w-14 h-14 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl mx-auto flex items-center justify-center">
          <ShieldAlert className="w-8 h-8" aria-hidden="true" />
        </div>
        <h2 className="text-lg font-bold text-stone-900">عدم دسترسی به پنل مدیریت پرسنل</h2>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
          نقش شما ({staff.role}) مجوز مدیریت پرسنل را ندارد. این صفحه منحصراً در اختیار مدیران ارشد سالن است.
        </p>
      </Card>
    );
  }

  // Only managers fetch the staff list
  const staffList = await getStaffList();

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Server-rendered Banner & Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-stone-900 flex items-center gap-2">
          <Users className="w-6 h-6 text-rose-900" aria-hidden="true" />
          مدیریت پرسنل و دسترسی‌های سازمانی
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 mt-1">
          ارتقا یا تغییر نقش‌های شغلی و ابطال بلادرنگ نشست‌های فعال کاربران در صورت رخداد امنیتی
        </p>
      </div>

      {/* Client-side Interactive Island */}
      <StaffManagementTable initialStaffList={staffList} />
    </div>
  );
}
