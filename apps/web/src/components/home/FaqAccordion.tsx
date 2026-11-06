'use client';

import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
}

const faqs: FaqItem[] = [
  {
    question: 'آیا برای اولین مراجعه باید بیعانه پرداخت کنم؟ سیاست بیعانه چگونه است؟',
    answer:
      'بله، جهت رزرو قطعی صندلی و زمان اختصاصی آرتیست، مبلغ بیعانه مشخصی (معمولاً حدود ۲۰ تا ۳۰ درصد تعرفه خدمت) دریافت می‌شود. نکته متمایز سالن سولان «اعتبار بیعانه» است: چنانچه تا ۲۴ ساعت قبل از نوبت هماهنگ کنید، بیعانه شما به هیچ عنوان نمی‌سوزد و به‌صورت اعتبار بدون انقضا در حسابتان برای نوبت‌های بعدی یا هر خدمت دیگر محفوظ می‌ماند.',
  },
  {
    question: 'آیا قیمت نهایی با تعرفه اعلام‌شده در سایت تفاوت دارد؟',
    answer:
      'خیر، شفافیت مالی اصل اساسی سالن سولان است. تمام تعرفه‌ها دارای بازه مشخص یا نرخ قطعی هستند و جزئیات هزینه پیش از آغاز کار توسط آرتیست به شما توضیح داده می‌شود. هیچ‌گونه هزینه مخفی، ورودی ناخواسته یا انعام اجباری در سالن وجود ندارد.',
  },
  {
    question: 'آیا ممکن است در سالن معطل شوم؟',
    answer:
      'خیر؛ سیستم زمان‌بندی سالن سولان هوشمند است و ظرفیت تجهیزات مشترک (مانند تخت‌های فیشیال و سرشورها) را هم‌زمان با زمان آرتیست رزرو می‌کند. بنابراین به محض حضور شما در ساعت رزرو شده، میز یا اتاق اختصاصی آماده پذیرش شما خواهد بود.',
  },
  {
    question: 'هنوز مطمئن نیستم چه رنگ یا سبکی مناسب من است، آیا مشاوره قبل از کار انجام می‌شود؟',
    answer:
      'کاملاً! در اولین مراجعه شما، آرتیست منتخب ۱۵ دقیقه پیش از شروع کار به بررسی و آنالیز نوع مو، تناژ پوست و سلیقه شما می‌پردازد. همچنین می‌توانید از طریق پرتال مشتریان «درخواست بررسی و مشاوره» ثبت کنید تا پیش از مراجعه قطعی با متخصص مشورت نمایید.',
  },
  {
    question: 'چگونه می‌توانم در اولین مراجعه نوبت خود را ثبت کنم؟',
    answer:
      'بسیار ساده است: کافیست روی دکمه «رزرو نوبت آنلاین» کلیک کنید، خدمت و آرتیست مورد نظرتان را انتخاب نمایید، سپس روز و ساعت خالی را برگزینید. تنها با وارد کردن شماره موبایل و کد تایید پیامکی، نوبت شما بدون نیاز به ثبت‌نام طولانی ثبت خواهد شد.',
  },
  {
    question: 'آیا امکان رزرو چند خدمت هم‌زمان در یک روز وجود دارد؟',
    answer:
      'بله، در سامانه نوبت‌دهی سولان می‌توانید خدمات سازگار (مثلاً ناخن و پدیکور یا رنگ و کوتاهی) را با رعایت فاصله زمانی و مراحل مکث مواد طوری تنظیم کنید که در یک مراجعه انجام شوند.',
  },
];

export function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="space-y-3 max-w-3xl mx-auto">
      {faqs.map((faq, index) => {
        const isOpen = openIndex === index;
        return (
          <div
            key={index}
            className="border border-stone-200/90 rounded-2xl bg-white overflow-hidden transition-all shadow-2xs hover:border-stone-300"
          >
            <button
              type="button"
              onClick={() => toggle(index)}
              className="w-full flex items-center justify-between p-4 sm:p-5 text-right font-bold text-stone-900 text-sm sm:text-base cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-800"
              aria-expanded={isOpen}
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-xl bg-rose-50 border border-rose-200/60 flex items-center justify-center text-rose-900 flex-shrink-0">
                  <HelpCircle className="w-4 h-4" aria-hidden="true" />
                </div>
                <span>{faq.question}</span>
              </div>
              <ChevronDown
                className={`w-5 h-5 text-stone-400 transition-transform duration-200 flex-shrink-0 ${
                  isOpen ? 'rotate-180 text-rose-900' : ''
                }`}
                aria-hidden="true"
              />
            </button>

            {isOpen && (
              <div className="px-4 pb-5 sm:px-5 sm:pb-5 pt-1 text-xs sm:text-sm text-stone-600 leading-relaxed border-t border-stone-100">
                <p className="bg-stone-50/70 p-3.5 rounded-xl border border-stone-100/80">
                  {faq.answer}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
