import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentStaff } from '../../lib/api';
import { AdminHeader } from '../../components/admin/AdminHeader';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const staff = await getCurrentStaff();

  if (!staff) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-[#fdfbf7] flex flex-col text-stone-900" dir="rtl">
      <AdminHeader currentStaff={staff} />
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
