import React from 'react';
import { StaffRole } from '@salon/shared';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'role';
  role?: StaffRole | string;
  size?: 'sm' | 'md';
  className?: string;
}

export function Badge({
  children,
  variant = 'secondary',
  role,
  size = 'md',
  className = '',
}: BadgeProps) {
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[11px]',
    md: 'px-2.5 py-1 text-xs',
  };

  const roleStyles: Record<string, string> = {
    [StaffRole.MANAGER]: 'bg-purple-100 text-purple-900 border-purple-200',
    [StaffRole.RECEPTIONIST]: 'bg-blue-100 text-blue-900 border-blue-200',
    [StaffRole.ACCOUNTANT]: 'bg-emerald-100 text-emerald-900 border-emerald-200',
    [StaffRole.ARTIST]: 'bg-rose-100 text-rose-900 border-rose-200',
  };

  const variants = {
    primary: 'bg-rose-100 text-rose-900 border-rose-200',
    secondary: 'bg-stone-100 text-stone-800 border-stone-200',
    success: 'bg-emerald-100 text-emerald-900 border-emerald-200',
    warning: 'bg-amber-100 text-amber-900 border-amber-200',
    danger: 'bg-red-100 text-red-900 border-red-200',
    info: 'bg-sky-100 text-sky-900 border-sky-200',
    purple: 'bg-purple-100 text-purple-900 border-purple-200',
    role: role && roleStyles[role] ? roleStyles[role] : 'bg-stone-100 text-stone-800 border-stone-200',
  };

  const computedVariant = role ? variants.role : variants[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${sizeStyles[size]} ${computedVariant} ${className}`}
    >
      {children}
    </span>
  );
}
