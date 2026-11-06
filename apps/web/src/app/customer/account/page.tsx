import React from 'react';
import { Metadata } from 'next';
import { Shield } from 'lucide-react';
import { getCurrentCustomer, getCustomerBookings, getCustomerConsultations } from '../../../lib/api';
import { CustomerLoginClientView } from '../../../components/customer/CustomerLoginClientView';
import { CustomerProfileHeader } from '../../../components/customer/CustomerProfileHeader';
import { CustomerBookingsList } from '../../../components/customer/CustomerBookingsList';
import { CustomerConsultationsSection } from '../../../components/customer/CustomerConsultationsSection';

export const metadata: Metadata = {
  title: 'حساب کاربری مشتری | سالن زیبایی VIP',
  description: 'ورود امن با رمز یک‌بارمصرف و مشاهده نوبت‌ها، درخواست‌های مشاوره و سوابق شخصی مشتری',
};

export default async function CustomerAccountPage() {
  const customer = await getCurrentCustomer();

  if (!customer) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <CustomerLoginClientView />
      </div>
    );
  }

  const [bookings, consultations] = await Promise.all([
    getCustomerBookings(),
    getCustomerConsultations(),
  ]);

  return (
    <div className="container mx-auto py-8 sm:py-12 px-4 sm:px-6 max-w-4xl space-y-6 text-right">
      {/* Server Component Header with Client Logout Island */}
      <CustomerProfileHeader customer={customer} />

      {/* Server Component Security Banner */}
      <div className="bg-emerald-50 border border-emerald-200/80 rounded-xl p-4 flex items-center gap-3 text-xs sm:text-sm text-emerald-900">
        <Shield className="w-5 h-5 text-emerald-700 shrink-0" aria-hidden="true" />
        <p className="leading-relaxed">
          حساب کاربری شما تحت حفاظت کامل امنیتی است. نوبت‌ها و درخواست‌های مشاوره اختصاصی تنها با شماره تلفن و رمز یک‌بارمصرف شما قابل دسترسی است.
        </p>
      </div>

      {/* Interactive Consultations Island */}
      <CustomerConsultationsSection consultations={consultations} />

      {/* Server Component Bookings List */}
      <CustomerBookingsList bookings={bookings} />
    </div>
  );
}
