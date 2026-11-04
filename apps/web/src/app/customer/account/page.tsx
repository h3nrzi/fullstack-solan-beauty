import React from 'react';
import { Metadata } from 'next';
import { getCurrentCustomer, getCustomerBookings, getCustomerConsultations } from '../../../lib/api';
import { CustomerLoginClientView } from '../../../components/customer/CustomerLoginClientView';
import { CustomerDashboardView } from '../../../components/customer/CustomerDashboardView';

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
    <div className="container mx-auto py-8 sm:py-12 px-4 sm:px-6 max-w-5xl">
      <CustomerDashboardView
        customer={customer}
        bookings={bookings}
        consultations={consultations}
      />
    </div>
  );
}
