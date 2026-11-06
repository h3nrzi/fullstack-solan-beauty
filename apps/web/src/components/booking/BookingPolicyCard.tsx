import React from 'react';
import { Info } from 'lucide-react';

export function BookingPolicyCard() {
  return (
    <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-5 mb-8 text-xs sm:text-sm text-stone-700 leading-relaxed shadow-sm flex items-start gap-3">
      <Info className="w-5 h-5 text-rose-900 shrink-0 mt-0.5" aria-hidden="true" />
      <div>
        <p className="font-bold text-rose-950 mb-1">
          قوانین ظرفیت واقعی و حریم خصوصی سالن:
        </p>
        <ul className="list-disc list-inside space-y-1 text-stone-600">
          <li>پیشنهاد زمان تعهد ظرفیت یا نوبت قطعی ایجاد نمی‌کند. نوبت پس از پرداخت بیعانه تثبیت می‌گردد.</li>
          <li>آرتیست در سراسر مدت خدمت، شامل زمان مکث مواد و پردازش، به صورت کامل متعهد و اشغال است.</li>
          <li>تخصیص تجهیزات و منابع مشترک (مانند صندلی سرشور و تخت فیشیال) براساس مراحل دقیق خدمت کنترل می‌شود.</li>
          <li>تقویم و نوبت‌های مراجعین دیگر به طور کامل محرمانه بوده و هویت دیگران فاش نمی‌شود.</li>
        </ul>
      </div>
    </div>
  );
}
