import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentStaff, getPendingRecoveryRequests } from '../../../../lib/api';
import { RecoveryRequestsView } from '../../../../components/admin/RecoveryRequestsView';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'صف تأیید بازیابی اضطراری | سالن زیبایی سولان',
  description: 'بررسی و تأیید درخواست‌های بازیابی حساب پرسنل توسط مدیران مستقل',
};

export default async function AdminRecoveryRequestsPage() {
  const staff = await getCurrentStaff();
  if (!staff) redirect('/login');

  const pendingRequests = await getPendingRecoveryRequests();

  return (
    <RecoveryRequestsView
      currentStaff={staff}
      initialRequests={pendingRequests}
    />
  );
}
