'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { StaffProfile, StaffRole } from '@salon/shared';
import {
  LayoutDashboard,
  CalendarCheck,
  Users,
  LifeBuoy,
  LogOut,
  Sparkles,
  Globe,
  Layers,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { logoutAction } from '../../actions/auth';

interface StaffDashboardShellProps {
  currentStaff: StaffProfile;
  children: React.ReactNode;
}

export function StaffDashboardShell({
  currentStaff,
  children,
}: StaffDashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const isManager = currentStaff.role === StaffRole.MANAGER;

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logoutAction();
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Logout error:', err);
      setLoggingOut(false);
    }
  };

  // Primary navigation items
  const mainNavItems = [
    {
      label: 'میز کار پرسنل',
      shortLabel: 'میز کار',
      href: '/dashboard',
      icon: LayoutDashboard,
      active: pathname === '/dashboard',
    },
    {
      label: 'سیستم نوبت‌دهی و تقویم',
      shortLabel: 'نوبت‌ها',
      href: '/booking?view=admin',
      icon: CalendarCheck,
      active: pathname === '/booking',
    },
    {
      label: 'کاتالوگ خدمات سالن',
      shortLabel: 'خدمات',
      href: '/services',
      icon: Layers,
      active: pathname === '/services',
    },
  ];

  // Management items (restricted to managers)
  const managerNavItems = [
    {
      label: 'مدیریت پرسنل و دسترسی‌ها',
      shortLabel: 'پرسنل',
      href: '/dashboard/staff',
      icon: Users,
      active: pathname === '/dashboard/staff',
    },
    {
      label: 'تأیید بازیابی اضطراری',
      shortLabel: 'بازیابی',
      href: '/dashboard/staff/recovery-requests',
      icon: LifeBuoy,
      active: pathname === '/dashboard/staff/recovery-requests',
    },
  ];

  // Mobile bottom dock items
  const mobileDockItems = isManager
    ? [
        {
          label: 'میز کار',
          href: '/dashboard',
          icon: LayoutDashboard,
          active: pathname === '/dashboard',
        },
        {
          label: 'نوبت‌ها',
          href: '/booking?view=admin',
          icon: CalendarCheck,
          active: pathname === '/booking',
        },
        {
          label: 'پرسنل',
          href: '/dashboard/staff',
          icon: Users,
          active: pathname === '/dashboard/staff',
        },
        {
          label: 'بازیابی',
          href: '/dashboard/staff/recovery-requests',
          icon: LifeBuoy,
          active: pathname === '/dashboard/staff/recovery-requests',
        },
      ]
    : [
        {
          label: 'میز کار',
          href: '/dashboard',
          icon: LayoutDashboard,
          active: pathname === '/dashboard',
        },
        {
          label: 'نوبت‌ها',
          href: '/booking?view=admin',
          icon: CalendarCheck,
          active: pathname === '/booking',
        },
        {
          label: 'خدمات',
          href: '/services',
          icon: Layers,
          active: pathname === '/services',
        },
        {
          label: 'سایت',
          href: '/',
          icon: Globe,
          active: pathname === '/',
        },
      ];

  const getRoleTitle = (role: StaffRole | string) => {
    switch (role) {
      case StaffRole.MANAGER:
        return 'مدیر ارشد';
      case StaffRole.RECEPTIONIST:
        return 'پذیرش و نوبت';
      case StaffRole.ARTIST:
        return 'آرتیست تخصصی';
      case StaffRole.ACCOUNTANT:
        return 'امور مالی';
      default:
        return 'پرسنل سالن';
    }
  };

  return (
    <div className="min-h-screen bg-[#fdfbf7] flex flex-col text-stone-900" dir="rtl">
      {/* =========================================================================
          DESKTOP SIDEBAR NAVIGATION (md:flex)
          Fixed to the right edge (RTL)
         ========================================================================= */}
      <aside
        className="hidden md:flex md:w-64 lg:w-72 md:fixed md:top-0 md:bottom-0 md:right-0 bg-white border-l border-stone-200/80 flex-col justify-between z-30 shadow-xs"
        aria-label="نویگیشن داشبورد پرسنل"
      >
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Top Brand Logo */}
          <div className="p-5 border-b border-stone-100">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-800 rounded-xl"
            >
              <div className="w-10 h-10 rounded-2xl bg-rose-900 text-white flex items-center justify-center shadow-xs group-hover:bg-rose-800 transition-colors flex-shrink-0">
                <Sparkles className="w-5 h-5 text-rose-200" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <span className="font-extrabold text-base text-stone-900 tracking-tight block truncate">
                  سولان بیوتی
                </span>
                <span className="text-[11px] text-stone-500 block truncate">
                  پنل مدیریت و پرسنل VIP
                </span>
              </div>
            </Link>
          </div>

          {/* Current Staff Profile Card */}
          <div className="p-4 mx-3 my-3 bg-stone-50/80 border border-stone-200/70 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-900 font-bold flex items-center justify-center text-sm border border-rose-200 shadow-2xs">
                  {currentStaff.fullName ? currentStaff.fullName.charAt(0) : 'ک'}
                </div>
                <span
                  className="absolute bottom-0 left-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white"
                  title="وضعیت: آنلاین"
                />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-stone-900 truncate">
                  {currentStaff.fullName}
                </p>
                <p className="text-[10px] text-stone-400 font-mono truncate" dir="ltr">
                  @{currentStaff.username}
                </p>
              </div>
            </div>

            <div className="mt-2.5 pt-2 border-t border-stone-200/60 flex items-center justify-between">
              <span className="text-[10px] text-stone-500">نقش سازمانی:</span>
              <Badge role={currentStaff.role} size="sm">
                {getRoleTitle(currentStaff.role)}
              </Badge>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 space-y-6 pb-6">
            {/* Primary Operations Section */}
            <div>
              <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1.5">
                عملیات و نوبت‌ها
              </span>
              <ul className="space-y-1">
                {mainNavItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={item.active ? 'page' : undefined}
                        className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs lg:text-sm font-medium transition-all ${
                          item.active
                            ? 'bg-rose-50 text-rose-900 border border-rose-200/80 shadow-2xs font-bold'
                            : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50/80'
                        }`}
                      >
                        <Icon
                          className={`w-4 h-4 flex-shrink-0 ${
                            item.active ? 'text-rose-900' : 'text-stone-500'
                          }`}
                          aria-hidden="true"
                        />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Management Section (Manager only) */}
            {isManager && (
              <div>
                <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-rose-800/80 block mb-1.5">
                  بخش مدیریت ارشد
                </span>
                <ul className="space-y-1">
                  {managerNavItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          aria-current={item.active ? 'page' : undefined}
                          className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs lg:text-sm font-medium transition-all ${
                            item.active
                              ? 'bg-rose-50 text-rose-900 border border-rose-200/80 shadow-2xs font-bold'
                              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50/80'
                          }`}
                        >
                          <Icon
                            className={`w-4 h-4 flex-shrink-0 ${
                              item.active ? 'text-rose-900' : 'text-stone-500'
                            }`}
                            aria-hidden="true"
                          />
                          <span className="truncate">{item.label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* Public Links */}
            <div>
              <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1.5">
                میانبرها
              </span>
              <ul className="space-y-1">
                <li>
                  <Link
                    href="/"
                    className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs lg:text-sm font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-50/80 transition-all"
                  >
                    <Globe className="w-4 h-4 text-stone-500 flex-shrink-0" aria-hidden="true" />
                    <span className="truncate">مشاهده سایت اصلی سالن</span>
                  </Link>
                </li>
              </ul>
            </div>
          </nav>
        </div>

        {/* Sidebar Footer & Logout */}
        <div className="p-3 border-t border-stone-100 bg-stone-50/50 space-y-2">
          <div className="flex items-center gap-2 px-2 text-[11px] text-emerald-800 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>احراز هویت دومرحله‌ای ایمن</span>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-rose-800 hover:text-white hover:bg-rose-900 rounded-xl transition-all text-xs font-semibold border border-rose-200 hover:border-transparent cursor-pointer disabled:opacity-60"
            aria-label="خروج از حساب کاربری پرسنل"
          >
            {loggingOut ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                <span>در حال خروج...</span>
              </>
            ) : (
              <>
                <LogOut className="w-4 h-4" aria-hidden="true" />
                <span>خروج از حساب کاربری</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* =========================================================================
          MOBILE TOP HEADER (< md)
          Shows brand, user status and quick logout
         ========================================================================= */}
      <header className="md:hidden sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-stone-200/80 px-4 py-3 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-rose-900 text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-4 h-4 text-rose-200" aria-hidden="true" />
          </div>
          <div>
            <span className="font-bold text-sm text-stone-900 block leading-tight">سولان بیوتی</span>
            <span className="text-[10px] text-stone-500 block leading-tight">داشبورد پرسنل</span>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <div className="text-left">
            <span className="text-xs font-bold text-stone-900 block leading-tight truncate max-w-[120px]">
              {currentStaff.fullName}
            </span>
            <Badge role={currentStaff.role} size="sm">
              {getRoleTitle(currentStaff.role)}
            </Badge>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="p-2 text-stone-500 hover:text-rose-900 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer border border-stone-200"
            title="خروج از حساب کاربری"
            aria-label="خروج از حساب کاربری"
          >
            {loggingOut ? (
              <Loader2 className="w-4 h-4 animate-spin text-rose-900" />
            ) : (
              <LogOut className="w-4 h-4" />
            )}
          </button>
        </div>
      </header>

      {/* =========================================================================
          MAIN CONTENT AREA
          Includes right margin on desktop (md:mr-64 lg:mr-72)
          Includes bottom padding on mobile (pb-24) to make room for bottom dock
         ========================================================================= */}
      <main className="flex-1 md:mr-64 lg:mr-72 pb-24 md:pb-8 p-4 sm:p-6 lg:p-8 max-w-7xl">
        {children}
      </main>

      {/* =========================================================================
          MOBILE BOTTOM NAVIGATION DOCK (< md)
          Fixed to the bottom of the screen with clear thumb touch targets
         ========================================================================= */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200/90 shadow-lg px-2 py-1.5 flex items-center justify-around"
        aria-label="نویگیشن موبایل پرسنل"
      >
        {mobileDockItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={item.active ? 'page' : undefined}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all min-w-[56px] text-center ${
                item.active
                  ? 'text-rose-900 font-bold bg-rose-50/80 shadow-2xs'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              <Icon
                className={`w-5 h-5 mb-0.5 ${item.active ? 'text-rose-900' : 'text-stone-500'}`}
                aria-hidden="true"
              />
              <span className="text-[11px] leading-tight">{item.label}</span>
            </Link>
          );
        })}

        {/* Quick logout action in mobile dock */}
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-stone-500 hover:text-rose-900 transition-colors min-w-[56px] cursor-pointer"
          aria-label="خروج"
        >
          {loggingOut ? (
            <Loader2 className="w-5 h-5 mb-0.5 animate-spin text-rose-900" aria-hidden="true" />
          ) : (
            <LogOut className="w-5 h-5 mb-0.5" aria-hidden="true" />
          )}
          <span className="text-[11px] leading-tight">خروج</span>
        </button>
      </nav>
    </div>
  );
}
