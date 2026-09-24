import Link from 'next/link';
import { cn } from '@/lib/utils';

/**
 * Marka amblemi: gravürlü serif "F" ve içinden yükselen grafik oku.
 * Koyu temada parlak altın, açık temada aynı çizimin bronz tonu. İnce gravür çizgileri
 * tarayıcı küçültmesinde soluklaştığı için 1x/2x boyutları önceden hazırlandı (public/atlas/logo-mark-36|72*.png).
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span className={cn('block h-9 w-[35px] shrink-0', className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/atlas/logo-mark-36.png" srcSet="/atlas/logo-mark-36.png 1x, /atlas/logo-mark-72.png 2x" alt="" width={35} height={36} fetchPriority="high" className="theme-dark-only" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/atlas/logo-mark-36-light.png" srcSet="/atlas/logo-mark-36-light.png 1x, /atlas/logo-mark-72-light.png 2x" alt="" width={35} height={36} fetchPriority="high" className="theme-light-only" />
    </span>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="FinansÇözüm ana sayfa"
      className={cn('group flex items-center gap-2.5 text-foreground', className)}
    >
      <LogoMark className="transition-transform duration-300 group-hover:scale-105" />
      <span className="font-display text-[1.6rem] leading-none tracking-tight">
        Finans<span className="text-primary">Çözüm</span>
      </span>
    </Link>
  );
}
