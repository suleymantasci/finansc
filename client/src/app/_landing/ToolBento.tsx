'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import NumberFlow from '@number-flow/react';
import { ArrowRight, ArrowUpRight, LineChart, Wallet } from 'lucide-react';
import { API_URL } from '@/lib/constants';
import { fetchHistory, instrumentKey, type HistoryPoint } from '@/lib/history';
import { DualLineChart } from '@/components/charts/MiniCharts';
import { bruttenNete, nettenBrute } from '@/app/araclar/[slug]/_tools/_shared/maas-engine';
import { AVAILABLE_YEARS, TAX_DATA, type MaasFormData } from '@/app/araclar/[slug]/_tools/_shared/tax-data';
import { cn } from '@/lib/utils';
import { CardHead } from './parts';

const fmt2 = { minimumFractionDigits: 2, maximumFractionDigits: 2 } as const;

// ── Maaş net/brüt ──────────────────────────────────────────────────

function SalaryCard() {
  const thisYear = new Date().getFullYear();
  const year = TAX_DATA[thisYear] ? thisYear : AVAILABLE_YEARS[AVAILABLE_YEARS.length - 1];
  const [direction, setDirection] = useState<MaasFormData['direction']>('brutten-nete');
  const [amount, setAmount] = useState(50_000);

  const result = useMemo(() => {
    if (!amount || amount < 1) return null;
    const form: MaasFormData = {
      year,
      month: 1,
      direction,
      employeeType: '4a-ucretli',
      amount,
      disability: 'yok',
      cumulativeMatrah: 0,
      minWageCumulativeMatrah: 0,
      showEmployerCost: false,
    };
    try {
      return direction === 'brutten-nete' ? bruttenNete(form) : nettenBrute(form);
    } catch {
      return null;
    }
  }, [amount, direction, year]);

  const toNet = direction === 'brutten-nete';
  const headline = result ? (toNet ? result.net : result.gross) : 0;
  const detailHref = `/araclar/maas-hesaplama?amount=${amount}&direction=${direction}&year=${year}`;

  return (
    <article className="atlas-card flex flex-col p-5 sm:p-6">
      <CardHead icon={<Wallet className="h-4 w-4" />} title="Maaş Hesaplama" href="/araclar/maas-hesaplama" meta={String(year)} />

      <div role="radiogroup" aria-label="Hesaplama yönü" className="mt-5 grid grid-cols-2 rounded-full border border-border bg-elevated p-1 text-[13px]">
        {(
          [
            ['brutten-nete', 'Brütten nete'],
            ['netten-brute', 'Netten brüte'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={direction === id}
            onClick={() => setDirection(id)}
            className={cn(
              'h-8 rounded-full transition-colors',
              direction === id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <label htmlFor="salary-amount" className="mt-5 block text-[12px] text-muted-foreground">
        {toNet ? 'Brüt maaş' : 'Net maaş'} (aylık)
      </label>
      <div className="mt-1.5 flex h-11 items-center rounded-lg border border-border bg-elevated px-3 focus-within:border-primary">
        <input
          id="salary-amount"
          type="number"
          inputMode="decimal"
          min={0}
          step={500}
          value={amount || ''}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="num w-full bg-transparent text-[15px] text-foreground focus:outline-none focus-visible:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
        />
        <span className="text-muted-foreground">₺</span>
      </div>

      <div className="mt-5 rounded-xl border border-border bg-elevated p-4">
        <p className="text-[12px] text-muted-foreground">{toNet ? 'Net maaş' : 'Brüt maaş'}</p>
        <p className="num mt-1 text-[1.75rem] font-medium leading-none text-up" aria-live="polite">
          <NumberFlow value={headline} locales="tr-TR" format={fmt2} suffix=" ₺" />
        </p>
        <p className="num mt-2 text-[12px] text-muted-foreground">
          Toplam kesinti {(result?.totalDeduction ?? 0).toLocaleString('tr-TR', fmt2)} ₺
        </p>
      </div>

      <Link
        href={detailHref}
        className="group mt-6 flex h-11 items-center justify-center gap-2 rounded-full border border-primary/60 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
      >
        12 aylık dökümü gör
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
      </Link>
      <p className="mt-3 text-[11px] text-muted-foreground">4/a ücretli, ocak ayı, engellilik yok varsayımıyla.</p>
    </article>
  );
}

// ── Altın vs Enflasyon (reel getiri) ──────────────────────────────

interface TufeEntry {
  period: string; // "08-2026"
  yearlyChange: number | null;
}

/** Ay sonu kapanışları: "MM-YYYY" → son fiyat */
function monthEndCloses(points: HistoryPoint[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const p of points) {
    const d = new Date(p.t.length <= 10 ? `${p.t}T00:00:00` : p.t);
    if (Number.isNaN(d.getTime())) continue;
    const key = `${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
    m.set(key, p.c); // sıralı geldiği için son yazan ayın kapanışı
  }
  return m;
}

function prevYearKey(key: string): string {
  const [mm, yyyy] = key.split('-');
  return `${mm}-${Number(yyyy) - 1}`;
}

function RealReturnCard() {
  const [tufe, setTufe] = useState<TufeEntry[]>([]);
  const [gold, setGold] = useState<HistoryPoint[]>([]);

  useEffect(() => {
    const ctrl = new AbortController();
    fetch(`${API_URL}/api/inflation/tufe`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.history && setTufe(d.history as TufeEntry[]))
      .catch(() => {});
    fetchHistory(instrumentKey.gold('serbest-piyasa', 'gram-altin'), { range: '5y', interval: '1w', signal: ctrl.signal })
      .then((s) => setGold(s.points ?? []))
      .catch(() => {});
    return () => ctrl.abort();
  }, []);

  const data = useMemo(() => {
    if (!tufe.length || !gold.length) return null;
    const closes = monthEndCloses(gold);
    const rows: { period: string; inf: number; gold: number }[] = [];
    // TÜFE en yeni başta geliyor — kronolojik sıraya çevir
    for (const e of [...tufe].reverse()) {
      if (e.yearlyChange == null) continue;
      const now = closes.get(e.period);
      const prev = closes.get(prevYearKey(e.period));
      if (!now || !prev) continue;
      rows.push({ period: e.period, inf: e.yearlyChange, gold: (now / prev - 1) * 100 });
    }
    const recent = rows.slice(-36);
    if (recent.length < 2) return null;
    const last = recent[recent.length - 1];
    const real = ((1 + last.gold / 100) / (1 + last.inf / 100) - 1) * 100;
    return { rows: recent, last, real };
  }, [tufe, gold]);

  const periodLabel = data
    ? new Date(Number(data.last.period.slice(3)), Number(data.last.period.slice(0, 2)) - 1).toLocaleDateString('tr-TR', {
        month: 'long',
        year: 'numeric',
      })
    : '';

  return (
    <article className="atlas-card flex flex-col p-5 sm:p-6 md:order-last md:col-span-2 lg:order-none">
      <CardHead icon={<LineChart className="h-4 w-4" />} title="Altın mı, enflasyon mu?" href="/araclar/reel-getiri" meta={periodLabel} />

      <div className="mt-5 grid flex-1 gap-6 sm:grid-cols-[1fr_auto]">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap gap-4 text-[12px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 rounded bg-primary" aria-hidden="true" /> Enflasyon (TÜFE, yıllık)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 rounded bg-up" aria-hidden="true" /> Gram altın (yıllık getiri)
            </span>
          </div>
          {data ? (
            <DualLineChart
              labels={data.rows.map((r) => r.period)}
              a={data.rows.map((r) => r.inf)}
              b={data.rows.map((r) => r.gold)}
              height={170}
              label={`Son ${data.rows.length} ayda yıllık TÜFE ile gram altının yıllık getirisi karşılaştırması`}
            />
          ) : (
            <div className="skeleton-shimmer h-[190px] rounded-lg" aria-hidden="true" />
          )}
        </div>

        <dl className="grid grid-cols-3 gap-4 sm:w-40 sm:grid-cols-1 sm:content-center sm:gap-5 sm:border-l sm:border-border sm:pl-6">
          <div>
            <dt className="text-[11px] text-muted-foreground">Enflasyon</dt>
            <dd className="num mt-1 text-xl font-medium text-primary">{data ? `%${data.last.inf.toLocaleString('tr-TR', fmt2)}` : '—'}</dd>
          </div>
          <div>
            <dt className="text-[11px] text-muted-foreground">Altın getirisi</dt>
            <dd className="num mt-1 text-xl font-medium text-up">{data ? `%${data.last.gold.toLocaleString('tr-TR', fmt2)}` : '—'}</dd>
          </div>
          <div>
            <dt className="text-[11px] text-muted-foreground">Reel getiri</dt>
            <dd className={cn('num mt-1 text-xl font-medium', data && data.real < 0 ? 'text-down' : 'text-foreground')}>
              {data ? `%${data.real.toLocaleString('tr-TR', fmt2)}` : '—'}
            </dd>
          </div>
        </dl>
      </div>
      <p className="mt-4 text-[11px] text-muted-foreground">
        Kaynak: TCMB (TÜFE), serbest piyasa gram altın ay sonu kapanışları. Reel getiri = (1 + altın) ÷ (1 + enflasyon) − 1.
      </p>
    </article>
  );
}

// ── Araç dizini kartı ──────────────────────────────────────────────

const FEATURED_TOOLS = [
  { label: 'Konut kredisi', href: '/araclar/konut-kredisi' },
  { label: 'Vadeli mevduat', href: '/araclar/vadeli-mevduat' },
  { label: 'Enflasyon hesaplama', href: '/araclar/enflasyon-hesaplama' },
  { label: 'Döviz çevirici', href: '/araclar/doviz-hesaplama' },
  { label: 'Altın hesaplama', href: '/araclar/altin-hesaplama' },
  { label: 'Kredi kartı asgari ödeme', href: '/araclar/kredi-karti-asgari-odeme' },
];

function ToolsCard() {
  return (
    <article className="atlas-card relative flex flex-col overflow-hidden p-5 sm:p-6">
      {/* Dekoratif pusula — görsel gelene kadar */}
      <svg
        viewBox="0 0 100 100"
        className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 text-primary opacity-[0.14]"
        aria-hidden="true"
      >
        <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="0.6" />
        <circle cx="50" cy="50" r="36" fill="none" stroke="currentColor" strokeWidth="0.4" strokeDasharray="1 2" />
        {Array.from({ length: 36 }).map((_, i) => (
          <line
            key={i}
            x1="50"
            y1="4"
            x2="50"
            y2={i % 9 === 0 ? 12 : 8}
            stroke="currentColor"
            strokeWidth="0.5"
            transform={`rotate(${i * 10} 50 50)`}
          />
        ))}
        <path d="M50 18 L55 50 L50 82 L45 50 Z" fill="currentColor" opacity="0.8" />
      </svg>

      <p className="eyebrow text-primary">Hesaplama araçları</p>
      <h3 className="font-display mt-3 max-w-[14ch] text-[2rem] leading-[1.05] text-foreground">
        Daha akıllı kararlar, 40+ ücretsiz araçla.
      </h3>
      <ul className="mt-5 grid grid-cols-1 gap-x-4 gap-y-1 text-sm sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        {FEATURED_TOOLS.map((t) => (
          <li key={t.href}>
            <Link href={t.href} className="group flex items-center gap-1.5 py-1 text-foreground/80 hover:text-primary">
              <span className="h-px w-3 bg-border-strong transition-all group-hover:w-4 group-hover:bg-primary" aria-hidden="true" />
              {t.label}
            </Link>
          </li>
        ))}
      </ul>
      <Link href="/araclar" className="group mt-auto inline-flex items-center gap-1.5 pt-6 text-sm font-medium text-primary">
        Tüm araçları keşfet
        <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
      </Link>
    </article>
  );
}

export function ToolBento() {
  return (
    <section aria-labelledby="araclar-title" className="mx-auto max-w-[1440px] px-4 lg:px-8">
      <h2 id="araclar-title" className="sr-only">
        Finansal hesaplama araçları: maaş, reel getiri, kredi
      </h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-[1fr_1.1fr_1.1fr_1fr]">
        <SalaryCard />
        <RealReturnCard />
        <ToolsCard />
      </div>
    </section>
  );
}
