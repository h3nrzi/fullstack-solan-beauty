import { getServices, getArtists, getSharedResources } from '../../lib/api';
import { BookingClientView } from '../../components/booking/BookingClientView';

export const metadata = {
  title: 'برنامه کاری و ظرفیت تک‌خدمت',
  description: 'بررسی زمان‌های آزاد واقعی، ظرفیت تجهیزات مشترک و شیفت کاری آرتیست‌های سالن زیبایی VIP',
};

interface BookingPageProps {
  searchParams: Promise<{
    serviceId?: string;
  }>;
}

export default async function BookingCapacityPage({ searchParams }: BookingPageProps) {
  // Fetch services, artists, and resources in parallel on the server
  const [services, artists, resources, resolvedParams] = await Promise.all([
    getServices(),
    getArtists(),
    getSharedResources(),
    searchParams,
  ]);

  return (
    <BookingClientView
      services={services}
      artists={artists}
      resources={resources}
      initialServiceId={resolvedParams?.serviceId}
    />
  );
}
