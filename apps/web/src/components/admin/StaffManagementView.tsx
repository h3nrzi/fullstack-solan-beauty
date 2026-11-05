'use client';

import React, { useState } from 'react';
import { StaffProfile, StaffRole } from '@salon/shared';
import {
  Users,
  ShieldAlert,
  AlertCircle,
  LogOut,
  Shield,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Alert } from '../ui/Alert';
import {
  updateStaffRoleAction,
  revokeStaffSessionsAction,
} from '../../actions/staff-management';

interface StaffManagementViewProps {
  currentStaff: StaffProfile;
  initialStaffList: StaffProfile[];
}

export function StaffManagementView({
  currentStaff,
  initialStaffList,
}: StaffManagementViewProps) {
  const [staffList, setStaffList] = useState<StaffProfile[]>(initialStaffList);
  const [searchQuery, setSearchQuery] = useState('');
  const [alertMessage, setAlertMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Modal 1: Update Role
  const [roleModalStaff, setRoleModalStaff] = useState<StaffProfile | null>(null);
  const [selectedRole, setSelectedRole] = useState<StaffRole>(StaffRole.RECEPTIONIST);
  const [roleReason, setRoleReason] = useState('');
  const [updatingRole, setUpdatingRole] = useState(false);

  // Modal 2: Revoke Sessions
  const [revokeModalStaff, setRevokeModalStaff] = useState<StaffProfile | null>(null);
  const [revokingSessions, setRevokingSessions] = useState(false);

  const isManager = currentStaff.role === StaffRole.MANAGER;

  if (!isManager) {
    return (
      <Card className="max-w-xl mx-auto my-12 text-center p-8 space-y-4">
        <div className="w-14 h-14 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl mx-auto flex items-center justify-center">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-stone-900">عدم دسترسی به پنل مدیریت پرسنل</h2>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
          نقش شما ({currentStaff.role}) مجوز مدیریت پرسنل را ندارد. این صفحه منحصراً در اختیار مدیران ارشد سالن است.
        </p>
      </Card>
    );
  }

  const filteredStaff = staffList.filter(
    (s) =>
      s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenRoleModal = (staff: StaffProfile) => {
    setRoleModalStaff(staff);
    setSelectedRole(staff.role);
    setRoleReason('');
    setAlertMessage(null);
  };

  const handleUpdateRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleModalStaff) return;

    setUpdatingRole(true);
    setAlertMessage(null);

    try {
      const res = await updateStaffRoleAction(roleModalStaff.id, {
        role: selectedRole,
        reason: roleReason.trim(),
      });

      if (!res.success) {
        setAlertMessage({ type: 'error', text: res.error || 'خطا در ارتقای نقش' });
        return;
      }

      setStaffList((prev) =>
        prev.map((s) => (s.id === roleModalStaff.id ? { ...s, role: selectedRole } : s))
      );
      setRoleModalStaff(null);
      setAlertMessage({
        type: 'success',
        text: `نقش کارمند ${roleModalStaff.fullName} با موفقیت به ${selectedRole} تغییر یافت.`,
      });
    } finally {
      setUpdatingRole(false);
    }
  };

  const handleRevokeSessionsSubmit = async () => {
    if (!revokeModalStaff) return;

    setRevokingSessions(true);
    setAlertMessage(null);

    try {
      const res = await revokeStaffSessionsAction(revokeModalStaff.id);
      if (!res.success) {
        setAlertMessage({ type: 'error', text: res.error || 'خطا در ابطال نشست‌ها' });
        return;
      }

      const count = res.data?.revokedCount ?? 0;
      setRevokeModalStaff(null);
      setAlertMessage({
        type: 'success',
        text: `تمامی نشست‌های فعال ${revokeModalStaff.fullName} (${count} نشست) فوراً باطل شدند.`,
      });
    } finally {
      setRevokingSessions(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-stone-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-rose-900" />
            مدیریت پرسنل و دسترسی‌های سازمانی
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            ارتقا یا تغییر نقش‌های شغلی و ابطال بلادرنگ نشست‌های فعال کاربران در صورت رخداد امنیتی
          </p>
        </div>

        <div className="w-full sm:w-72">
          <Input
            id="staffSearch"
            label=""
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو بر اساس نام، نام‌کاربری یا نقش..."
            className="text-right text-xs"
          />
        </div>
      </div>

      {alertMessage && (
        <Alert type={alertMessage.type}>{alertMessage.text}</Alert>
      )}

      {/* Staff Table Card */}
      <Card className="p-0 overflow-hidden border border-stone-200">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs sm:text-sm">
            <thead className="bg-stone-50/80 border-b border-stone-200 text-stone-600 font-semibold">
              <tr>
                <th className="py-3 px-4">کارمند</th>
                <th className="py-3 px-4">نام کاربری</th>
                <th className="py-3 px-4">نقش سازمانی</th>
                <th className="py-3 px-4">وضعیت حساب</th>
                <th className="py-3 px-4 text-left">عملیات امنیتی</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-stone-400">
                    هیچ کارمندی با این مشخصات یافت نشد.
                  </td>
                </tr>
              ) : (
                filteredStaff.map((staff) => (
                  <tr key={staff.id} className="hover:bg-stone-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-stone-900">{staff.fullName}</div>
                      <div className="text-[11px] text-stone-400 font-mono" dir="ltr">
                        {staff.id}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-stone-700" dir="ltr">
                      @{staff.username}
                    </td>
                    <td className="py-3 px-4">
                      <Badge role={staff.role}>{staff.role}</Badge>
                    </td>
                    <td className="py-3 px-4">
                      {staff.isActive ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 text-xs font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          فعال
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-stone-400 text-xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-stone-300" />
                          غیرفعال
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-left">
                      <div className="inline-flex items-center gap-2">
                        <Button
                          variant="outline"
                          onClick={() => handleOpenRoleModal(staff)}
                          className="px-2.5 py-1 text-xs border-stone-300 hover:bg-stone-100"
                        >
                          <Shield className="w-3.5 h-3.5 ml-1 text-stone-600" />
                          تغییر نقش
                        </Button>

                        <Button
                          variant="outline"
                          onClick={() => setRevokeModalStaff(staff)}
                          className="px-2.5 py-1 text-xs text-rose-900 border-rose-200 hover:bg-rose-50"
                        >
                          <LogOut className="w-3.5 h-3.5 ml-1 text-rose-700" />
                          ابطال نشست‌ها
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal 1: Update Role */}
      <Modal
        isOpen={!!roleModalStaff}
        onClose={() => setRoleModalStaff(null)}
        title={`تغییر نقش سازمانی: ${roleModalStaff?.fullName}`}
        description="نقش جدید برای این کارمند بلافاصله و بدون نیاز به ورود مجدد در تمام سیستم اعمال می‌شود."
      >
        <form onSubmit={handleUpdateRoleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-stone-700">
              انتخاب نقش سازمانی جدید:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { role: StaffRole.MANAGER, label: 'مدیر سالن (MANAGER)' },
                { role: StaffRole.RECEPTIONIST, label: 'پذیرش (RECEPTIONIST)' },
                { role: StaffRole.ARTIST, label: 'آرتیست (ARTIST)' },
                { role: StaffRole.ACCOUNTANT, label: 'حسابدار (ACCOUNTANT)' },
              ].map((opt) => (
                <button
                  key={opt.role}
                  type="button"
                  onClick={() => setSelectedRole(opt.role)}
                  className={`p-2.5 rounded-xl border text-right text-xs font-medium transition-all cursor-pointer ${
                    selectedRole === opt.role
                      ? 'border-rose-900 bg-rose-50 text-rose-950 font-bold ring-1 ring-rose-900'
                      : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <Textarea
            id="roleReason"
            label="علت تغییر نقش (ثبت در لاگ امنیتی)"
            required
            rows={2}
            value={roleReason}
            onChange={(e) => setRoleReason(e.target.value)}
            placeholder="مثال: ارتقا به مسئول پذیرش شیفت صبح..."
            helperText="این دلیل در گزارش‌های حسابرسی و لاگ امنیت ذخیره خواهد شد."
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setRoleModalStaff(null)}
            >
              انصراف
            </Button>
            <Button type="submit" loading={updatingRole}>
              تأیید و به‌روزرسانی نقش
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Confirm Revoke Sessions (Destructive Action) */}
      <Modal
        isOpen={!!revokeModalStaff}
        onClose={() => setRevokeModalStaff(null)}
        title="هشدار امنیتی: ابطال فوری تمام نشست‌ها"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 leading-relaxed flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <span>
              آیا از ابطال فوری تمامی نشست‌های فعال کارمند{' '}
              <strong>{revokeModalStaff?.fullName}</strong> اطمینان دارید؟ تمامی دستگاه‌های متصل بلافاصله در درخواست بعدی با خطای ۴۰۱ از سیستم خارج خواهند شد.
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setRevokeModalStaff(null)}
            >
              انصراف
            </Button>
            <Button
              type="button"
              variant="danger"
              loading={revokingSessions}
              onClick={handleRevokeSessionsSubmit}
            >
              ابطال قطعی تمام نشست‌ها
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
