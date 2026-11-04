import { getServices, getArtists } from '../../lib/api';
import { ServicesClientView } from '../../components/services/ServicesClientView';

export const metadata = {
  title: 'معرفی خدمات و تخصص آرتیست‌ها',
  description: 'شفافیت تعرفه خدمات سالن زیبایی VIP، بازه قیمت، مدت زمان و سطوح تخصص و سابقه آرتیست‌ها',
};

export default async function ServicesPage() {
  // Fetch services and artists in parallel on the server
  const [services, artists] = await Promise.all([
    getServices(),
    getArtists(),
  ]);

  return <ServicesClientView services={services} artists={artists} />;
}
