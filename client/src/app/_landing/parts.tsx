// Ana sayfa kartlarının ortak parçaları (sadece _landing içinde kullanılır)

import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export function CardHead({
  icon,
  title,
  href,
  meta,
  as: Tag = 'h3',
}: {
  icon: ReactNode;
  title: string;
  href?: string;
  meta?: ReactNode;
  as?: 'h2' | 'h3';
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-border bg-elevated text-primary" aria-hidden="true">
        {icon}
      </span>
      <Tag className="min-w-0 flex-1 truncate text-[15px] font-medium text-foreground">
        {href ? (
          <Link href={href} className="group inline-flex items-center gap-1 hover:text-primary">
            {title}
            <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true" />
          </Link>
        ) : (
          title
        )}
      </Tag>
      {meta && <span className="num shrink-0 text-[11px] text-muted-foreground">{meta}</span>}
    </div>
  );
}

export function ChangePill({ value, className }: { value: number | null | undefined; className?: string }) {
  const v = value ?? 0;
  const dir = v > 0 ? 'up' : v < 0 ? 'down' : 'flat';
  return (
    <span
      className={cn(
        'num inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-medium',
        dir === 'up' && 'bg-up/12 text-up',
        dir === 'down' && 'bg-down/12 text-down',
        dir === 'flat' && 'bg-muted text-neutral',
        className,
      )}
    >
      <span aria-hidden="true">{dir === 'up' ? '▲' : dir === 'down' ? '▼' : '•'}</span>
      <span className="sr-only">{dir === 'up' ? 'Artış' : dir === 'down' ? 'Düşüş' : 'Değişim yok'}</span>
      %{Math.abs(v).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    </span>
  );
}

/** Aralık seçici (1A / 6A / 1Y / 5Y) */
export function RangeTabs<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="flex items-center gap-1">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={o.id === value}
          onClick={() => onChange(o.id)}
          className={cn(
            'num h-7 min-w-9 rounded-md px-2 text-[11px] transition-colors',
            o.id === value
              ? 'border border-primary/50 bg-primary/10 text-foreground'
              : 'text-muted-foreground hover:bg-surface-hover hover:text-foreground',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export { ArrowLink } from '@/components/shared/ArrowLink';
import { ArrowLink } from '@/components/shared/ArrowLink';

export function SectionHead({
  id,
  eyebrow,
  title,
  href,
  hrefLabel,
}: {
  id: string;
  eyebrow?: string;
  title: string;
  href?: string;
  hrefLabel?: string;
}) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="eyebrow mb-2 text-primary">{eyebrow}</p>}
        <h2 id={id} className="font-display text-3xl text-foreground sm:text-4xl">
          {title}
        </h2>
      </div>
      {href && (
        <ArrowLink href={href}>{hrefLabel}</ArrowLink>
      )}
    </div>
  );
}

export function timeOf(ts?: string | null): string | null {
  if (!ts) return null;
  if (/^\d{1,2}:\d{2}/.test(ts)) return ts.slice(0, 5);
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' });
}
