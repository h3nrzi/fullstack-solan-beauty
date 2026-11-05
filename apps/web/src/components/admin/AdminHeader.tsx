'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { StaffProfile, StaffRole } from '@salon/shared';
import {
  Users,
  LifeBuoy,
  LogOut,
  LayoutDashboard,
  Sparkles,
  Menu,
  X,
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { logoutAction } from '../../actions/auth';

interface AdminHeaderProps {
  currentStaff: StaffProfile;
}

export function AdminHeader({ currentStaff }: AdminHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isManager = currentStaff.role === StaffRole.MANAGER;

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logoutAction();
      router.push('/login');
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  };

  const navItems = [
    {
      label: 'میز کار',
      href: '/dashboard',
      icon: <LayoutDashboard className="w-4 h-4 ml-1.5" />,
      active: pathname === '/dashboard',
      managerOnly: false,
    },
    {
      label: 'مدیریت پرسنل',
      href: '/dashboard/staff',
      icon: <Users className="w-4 h-4 ml-1.5" />,
      active: pathname === '/dashboard/staff',
      managerOnly: true,
    },
    {
      label: 'درخواست‌های بازیابی',
      href: '/dashboard/staff/recovery-requests',
      icon: <LifeBuoy className="w-4 h-4 ml-1.5" />,
      active: pathname === '/dashboard/staff/recovery-requests',
      managerOnly: true,
    },
  ];

  const visibleNavItems = navItems.filter((item) => !item.managerOnly || isManager);

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-stone-200/80 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-rose-900 text-white flex items-center justify-center shadow-xs group-hover:bg-rose-800 transition-colors">
                <Sparkles className="w-5 h-5 text-rose-200" />
              </div>
              <div>
                <span className="font-bold text-base text-stone-900 tracking-tight block">
                  سولان بیوتی
                </span>
                <span className="text-[10px] text-stone-400 block -mt-0.5">
                  سامانه مدیریت پرسنل VIP
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {visibleNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                    item.active
                      ? 'bg-rose-50 text-rose-900 border border-rose-200/60 shadow-2xs font-semibold'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* User profile & Logout button */}
          <div className="hidden md:flex items-center gap-3">
            <div className="text-right">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-stone-900">
                  {currentStaff.fullName}
                </span>
                <Badge role={currentStaff.role} size="sm">
                  {currentStaff.role === StaffRole.MANAGER
                    ? 'مدیر ارشد'
                    : currentStaff.role === StaffRole.RECEPTIONIST
                    ? 'پذیرش'
                    : currentStaff.role === StaffRole.ARTIST
                    ? 'آرتیست'
                    : 'حسابدار'}
                </Badge>
              </div>
              <span className="text-[11px] text-stone-400 font-mono" dir="ltr">
                @{currentStaff.username}
              </span>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="p-2 text-stone-500 hover:text-rose-900 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-rose-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-800"
              title="خروج از حساب کاربری"
              aria-label="خروج از حساب کاربری"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile menu toggle button */}
          <div className="md:hidden flex items-center">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-stone-600 hover:text-stone-900 rounded-lg hover:bg-stone-100 cursor-pointer"
              aria-label="منوی ناوبری"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-stone-100 space-y-2">
            <div className="px-3 py-2 bg-stone-50 rounded-xl flex items-center justify-between mb-2">
              <div>
                <p className="text-xs font-bold text-stone-900">{currentStaff.fullName}</p>
                <p className="text-[10px] text-stone-400 font-mono" dir="ltr">@{currentStaff.username}</p>
              </div>
              <Badge role={currentStaff.role} size="sm">
                {currentStaff.role}
              </Badge>
            </div>

            {visibleNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center px-3.5 py-2.5 rounded-xl text-sm font-medium ${
                  item.active ? 'bg-rose-50 text-rose-900 font-semibold' : 'text-stone-700 hover:bg-stone-50'
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}

            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center px-3.5 py-2.5 text-rose-800 text-sm font-medium rounded-xl hover:bg-rose-50 cursor-pointer"
            >
              <LogOut className="w-4 h-4 ml-1.5" />
              خروج از حساب کاربری
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
