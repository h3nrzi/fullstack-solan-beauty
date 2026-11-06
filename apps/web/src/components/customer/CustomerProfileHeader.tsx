import React from 'react';
import Link from 'next/link';
import { User, PlusCircle } from 'lucide-react';
import { CustomerDto } from '@salon/shared';
import { Button } from '../ui/Button';
import { CustomerLogoutButton } from './CustomerLogoutButton';

interface CustomerProfileHeaderProps {
  customer: CustomerDto;
}

export function CustomerProfileHeader({ customer }: CustomerProfileHeaderProps) {
  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-900 shadow-inner">
          <User className="w-7 h-7" aria-hidden="true" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-stone-900">
              {customer.fullName || 'مشتری گرامی'}
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-stone-100 text-stone-700">
              هویت پایدار
            </span>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 font-mono mt-1 dir-ltr text-right">
            {customer.phone}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 w-full sm:w-auto">
        <Link href="/booking" className="flex-1 sm:flex-none">
          <Button variant="primary" className="w-full text-sm py-2.5">
            <PlusCircle className="w-4 h-4 ml-1.5" aria-hidden="true" />
            رزرو نوبت جدید
          </Button>
        </Link>
        <CustomerLogoutButton />
      </div>
    </div>
  );
}
