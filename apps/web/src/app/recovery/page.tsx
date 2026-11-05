import { RecoveryClientView } from '../../components/recovery/RecoveryClientView';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'بازیابی اضطراری حساب کارمند | سالن زیبایی VIP',
  description: 'فرآیند بازیابی حساب کاربری پرسنل در صورت از دست رفتن احراز هویت دوعاملی با تایید مدیر سالن',
};

export default function RecoveryPage() {
  return <RecoveryClientView />;
}
