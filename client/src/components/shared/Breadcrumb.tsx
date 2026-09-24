import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

/**
 * Breadcrumb — Sayfanın üstünde hierarşik navigasyon.
 * Aktif öğe (son) bold, geri kalan tıklanabilir link.
 *
 * Örnek:
 *   <Breadcrumb items={[
 *     { label: 'FinansÇözüm', href: '/' },
 *     { label: 'Araçlar', href: '/araclar' },
 *     { label: 'Maaş Hesaplama' },
 *   ]} />
 */
export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        'mb-5 flex flex-wrap items-center gap-1 text-[13px] text-muted-foreground',
        className,
      )}
    >
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        const isFirst = i === 0;
        const Icon = isFirst ? Home : ChevronRight;
        return (
          <span key={`${item.label}-${i}`} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5 opacity-50" aria-hidden="true" />}
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="hover:text-foreground transition-colors truncate max-w-[40ch]"
                title={item.label}
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={cn(
                  'truncate max-w-[40ch]',
                  isLast && 'font-medium text-foreground',
                )}
                aria-current={isLast ? 'page' : undefined}
                title={item.label}
              >
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}

/**
 * Shortcut helper — uzun araç adlarını kısaltır.
 * "İhtiyaç Kredisi Hesaplama" → "İhtiyaç Kredisi"
 * "Kredi Yıllık Maliyet Oranı" → "Kredi YMO"
 */
export function shortToolName(title: string): string {
  // Bilinen uzun ekleri kırp
  return title
    .replace(/\s+Hesaplama\.?$/, '')
    .replace(/\s+Hesaplaması\.?$/, '')
    .replace(/\s+Hesaplama\s+Aracı\.?$/, '')
    .replace(/\s+Ne Kadar\s+/, '')
    .replace(/\s+Oranı\.?$/, ' Oranı')
    .trim();
}
