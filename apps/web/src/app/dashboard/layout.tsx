import React from 'react';
import { getCurrentStaff } from '../../lib/api';
import { StaffDashboardShell } from '../../components/admin/StaffDashboardShell';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const staff = (await getCurrentStaff())!;

  return (
    <StaffDashboardShell currentStaff={staff}>
      {children}
    </StaffDashboardShell>
  );
}
