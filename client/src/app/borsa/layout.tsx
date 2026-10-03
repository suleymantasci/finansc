import { notFound } from 'next/navigation';
import { BORSA_ENABLED } from '@/lib/features';

// Borsa kapalıyken /borsa altındaki hiçbir sayfa render edilmez (dışarıdan
// istekler zaten proxy.ts'te 410 alır; bu katman SSR/ISR'ı da durdurur).
export default function BorsaLayout({ children }: { children: React.ReactNode }) {
  if (!BORSA_ENABLED) notFound();
  return children;
}
