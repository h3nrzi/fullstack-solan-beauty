import { LoginClientView } from '../../components/auth/LoginClientView';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'ورود ایمن پرسنل',
  description: 'ورود پرسنل سالن زیبایی VIP با پشتیبانی از احراز هویت دو مرحله‌ای (MFA) و کدهای اضطراری',
};

export default function LoginPage() {
  return <LoginClientView />;
}
