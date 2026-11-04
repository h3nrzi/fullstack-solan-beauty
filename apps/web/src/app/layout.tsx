import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'پلتفرم مدیریت سالن زیبایی VIP',
  description: 'سیستم جامع مدیریت سالن زیبایی و پرسنل',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl">
      <body className="min-h-screen bg-[#fdfbf7] text-[#1c1917] antialiased">
        {children}
      </body>
    </html>
  );
}
