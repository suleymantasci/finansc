import Link from 'next/link';
import { cn } from '@/lib/utils';

/**
 * Marka amblemi: kolları yukarı doğru eğik kesik "F" — harfin kendisi yükselişi anlatır.
 * Tek parça vektör; 16px'te de okunur, rengi temadan (currentColor) gelir.
 * Favicon/uygulama ikonlarında aynı F altın sikke içinde kullanılır (public/icon.svg).
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="currentColor" aria-hidden="true" className={cn('h-8 w-8 shrink-0', className)}>
      <path d="M7 35V9a3 3 0 0 1 3-3h24l-7 8H15v5h11l-6 7h-5v9z" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="FinansÇözüm ana sayfa"
      className={cn('group flex items-center gap-2.5 text-foreground', className)}
    >
      <LogoMark className="text-primary transition-transform duration-300 group-hover:-translate-y-0.5" />
      <span className="font-display text-[1.6rem] leading-none tracking-tight">
        Finans<span className="text-primary">Çözüm</span>
      </span>
    </Link>
  );
}
