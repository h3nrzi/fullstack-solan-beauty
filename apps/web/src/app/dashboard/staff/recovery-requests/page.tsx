import React from 'react';
import { StaffRole } from '@salon/shared';
import { LifeBuoy, ShieldAlert, ShieldCheck } from 'lucide-react';
import { getCurrentStaff, getPendingRecoveryRequests } from '../../../../lib/api';
import { Card } from '../../../../components/ui/Card';
import { RecoveryRequestsList } from '../../../../components/admin/RecoveryRequestsList';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'صف تأیید بازیابی اضطراری | سالن زیبایی سولان',
  description: 'بررسی و تأیید درخواست‌های بازیابی حساب پرسنل توسط مدیران مستقل',
};

export default async function AdminRecoveryRequestsPage() {
  const staff = (await getCurrentStaff())!;

  // Server-side authorization guard: Prevent data leak to non-managers
  if (staff.role !== StaffRole.MANAGER) {
    return (
      <Card className="max-w-xl mx-auto my-12 text-center p-8 space-y-4">
        <div className="w-14 h-14 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl mx-auto flex items-center justify-center">
          <ShieldAlert className="w-8 h-8" aria-hidden="true" />
        </div>
        <h2 className="text-lg font-bold text-stone-900">عدم دسترسی به صف بازیابی اضطراری</h2>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
          تنها مدیران ارشد سالن مجاز به بررسی و صدور توکن بازیابی اضطراری هستند.
        </p>
      </Card>
    );
  }

  // Only managers fetch the pending recovery requests
  const pendingRequests = await getPendingRecoveryRequests();

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Server-rendered Banner & Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-stone-900 flex items-center gap-2">
          <LifeBuoy className="w-6 h-6 text-rose-900" aria-hidden="true" />
          صف تأیید بازیابی اضطراری حساب پرسنل
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 mt-1">
          بررسی درخواست‌های کارمندانی که دسترسی به کدهای دو مرحله‌ای خود را از دست داده‌اند (اصل تأیید مستقل مدیر)
        </p>
      </div>

      {/* Server-rendered Security Rule Banner */}
      <div className="p-4 bg-amber-50/80 border border-amber-200/90 rounded-2xl flex items-start gap-3 text-xs text-amber-950 leading-relaxed">
        <ShieldCheck className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" aria-hidden="true" />
        <div>
          <span className="font-bold block mb-0.5">قانون امنیت Seam 1 (Anti-Self-Approval):</span>
          هیچ مدیری نمی‌تواند درخواست بازیابی ثبت شده برای خودش را تأیید کند. صدور توکن تحویل (Claim Token) الزماً نیازمند تأیید یک مدیر مستقل دیگر سالن است تا از نقض دسترسی جلوگیری شود.
        </div>
      </div>

      {/* Client-side Interactive Island */}
      <RecoveryRequestsList
        initialRequests={pendingRequests}
        currentStaffId={staff.id}
      />
    </div>
  );
}
