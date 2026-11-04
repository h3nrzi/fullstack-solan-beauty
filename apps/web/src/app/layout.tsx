import type { Metadata, Viewport } from 'next';
import { Vazirmatn } from 'next/font/google';
import './globals.css';

const vazirmatn = Vazirmatn({
  subsets: ['arabic', 'latin'],
  display: 'swap',
  variable: '--font-vazirmatn',
});

export const metadata: Metadata = {
  title: {
    template: '%s | سالن زیبایی VIP',
    default: 'پلتفرم مدیریت سالن زیبایی VIP | رزرو و پرسنل',
  },
  description: 'سیستم جامع، امن و هوشمند مدیریت نوبت‌دهی، خدمات و دسترسی پرسنل سالن زیبایی VIP',
  applicationName: 'سالن زیبایی VIP',
  keywords: ['سالن زیبایی', 'رزرو نوبت', 'آرتیست', 'مدیریت سالن', 'پرسنل سالن زیبایی'],
  authors: [{ name: 'VIP Beauty Salon Team' }],
  creator: 'VIP Beauty Salon',
  publisher: 'VIP Beauty Salon',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: 'پلتفرم مدیریت سالن زیبایی VIP',
    description: 'سیستم جامع مدیریت عملیات، رزرو و دسترسی پرسنل سالن زیبایی',
    siteName: 'سالن زیبایی VIP',
    locale: 'fa_IR',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'پلتفرم مدیریت سالن زیبایی VIP',
    description: 'سیستم جامع مدیریت عملیات، رزرو و دسترسی پرسنل سالن زیبایی',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: '#881337',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl" className={vazirmatn.variable}>
      <body className={`${vazirmatn.className} min-h-screen bg-[#fdfbf7] text-[#1c1917] antialiased selection:bg-rose-100 selection:text-rose-900`}>
        {/* WCAG 2.2 Skip to main content link for keyboard users */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:right-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-rose-900 focus:text-white focus:rounded-lg focus:shadow-lg focus:ring-2 focus:ring-rose-500"
        >
          پرش به محتوای اصلی
        </a>
        <div id="main-content">{children}</div>
      </body>
    </html>
  );
}
