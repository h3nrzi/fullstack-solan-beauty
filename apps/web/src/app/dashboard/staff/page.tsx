import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentStaff, getStaffList } from '../../../lib/api';
import { StaffManagementView } from '../../../components/admin/StaffManagementView';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'مدیریت پرسنل و دسترسی‌ها | سالن زیبایی سولان',
  description: 'مدیریت نقش‌های کارمندان و ابطال نشست‌های فعال',
};

export default async function AdminStaffPage() {
  const staff = await getCurrentStaff();
  if (!staff) redirect('/login');

  const staffList = await getStaffList();

  return (
    <StaffManagementView
      currentStaff={staff}
      initialStaffList={staffList}
    />
  );
}
