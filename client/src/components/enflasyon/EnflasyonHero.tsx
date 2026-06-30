import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { formatPercentTr, formatPeriodTr, type TufeEntry, type UfeEntry } from '@/lib/inflation';
import { cn } from '@/lib/utils';

interface Props {
  tufe: { latest: TufeEntry; previous: TufeEntry } | null;
  ufe: { latest: UfeEntry; previous: UfeEntry } | null;
}

export function EnflasyonHero({ tufe, ufe }: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <HeroCard
        title="TÜFE"
        subtitle="Tüketici Fiyat Endeksi"
        href="/enflasyon/tuketici-fiyatlari"
        accent="primary"
        data={tufe}
        renderValue={(e) => ({
          yearly: e?.yearlyChange ?? null,
          monthly: e?.monthlyChange ?? null,
        })}
      />
      <HeroCard
        title="ÜFE / Yİ-ÜFE"
        subtitle="Yurt İçi Üretici Fiyat Endeksi"
        href="/enflasyon/uretici-fiyatlari"
        accent="blue"
        data={ufe}
        renderValue={(e) => ({
          yearly: e?.yiUfeYearlyChange ?? null,
          monthly: e?.yiUfeMonthlyChange ?? null,
        })}
      />
    </div>
  );
}

interface CardProps {
  title: string;
  subtitle: string;
  href: string;
  accent: 'primary' | 'blue';
  data: { latest: any; previous: any } | null;
  renderValue: (entry: any) => { yearly: number | null; monthly: number | null };
}

function HeroCard({ title, subtitle, href, accent, data, renderValue }: CardProps) {
  const accentClass = accent === 'primary' ? 'border-primary/40 bg-primary/5' : 'border-blue-500/40 bg-blue-500/5';
  const titleClass = accent === 'primary' ? 'text-primary' : 'text-blue-600 dark:text-blue-400';
  const upClass = accent === 'primary' ? 'text-primary' : 'text-blue-600 dark:text-blue-400';

  if (!data) {
    return (
      <div className={cn('rounded-xl border-2 p-6', accentClass)}>
        <div className="flex items-baseline justify-between">
          <div>
            <div className={cn('text-lg font-bold', titleClass)}>{title}</div>
            <div className="text-sm text-muted-foreground">{subtitle}</div>
          </div>
        </div>
        <div className="mt-6 text-sm text-muted-foreground">Veri yüklenemedi.</div>
      </div>
    );
  }

  const latest = renderValue(data.latest);
  const previous = renderValue(data.previous);

  return (
    <Link
      href={href}
      className={cn(
        'group block rounded-xl border-2 p-6 transition-all hover:border-opacity-100 hover:shadow-md',
        accentClass,
      )}
    >
      <div className="flex items-baseline justify-between">
        <div>
          <div className={cn('text-lg font-bold', titleClass)}>{title}</div>
          <div className="text-sm text-muted-foreground">{subtitle}</div>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Yıllık</div>
          <div className={cn('mt-1 font-mono text-3xl font-bold tabular-nums', upClass)}>
            {formatPercentTr(latest.yearly)}
          </div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Aylık</div>
          <div className="mt-1 font-mono text-3xl font-bold tabular-nums text-foreground">
            {formatPercentTr(latest.monthly)}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
        <span>Dönem: <strong className="text-foreground">{formatPeriodTr(data.latest.period)}</strong></span>
        {data.previous && previous.yearly !== null && (
          <span>
            Önceki ay: <strong className="text-foreground">{formatPercentTr(previous.yearly)}</strong>
          </span>
        )}
      </div>
    </Link>
  );
}