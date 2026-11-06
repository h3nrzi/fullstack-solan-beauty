import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentStaff } from '../../lib/api';
import { StaffDashboardShell } from '../../components/admin/StaffDashboardShell';

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
    <StaffDashboardShell currentStaff={staff}>
      {children}
    </StaffDashboardShell>
  );
}
