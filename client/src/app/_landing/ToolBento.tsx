'use client';

import { useEffect, useMemo, useState } from 'react';
import { pctTr } from '@/lib/formatters';
import Link from 'next/link';
import Image from 'next/image';
import NumberFlow from '@number-flow/react';
import { ArrowRight, LineChart, Wallet } from 'lucide-react';
import { API_URL } from '@/lib/constants';
import { fetchHistory, instrumentKey, type HistoryPoint } from '@/lib/history';
import { CompareChart, type CompareRow } from '@/components/charts/MiniCharts';
import { bruttenNete, nettenBrute } from '@/app/araclar/[slug]/_tools/_shared/maas-engine';
import { AVAILABLE_YEARS, TAX_DATA, type MaasFormData } from '@/app/araclar/[slug]/_tools/_shared/tax-data';
import { cn } from '@/lib/utils';
import { BORSA_ENABLED } from '@/lib/features';
import { ArrowLink, CardHead } from './parts';

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
  const detailHref = `/araclar/maas-hesaplama?amount=${amount}&direction=${direction}&year=${year}&month=1`; // 12 aylık döküm: yıl başından

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

type AssetId = 'gold' | 'usd' | 'eur' | 'bist';
const ALL_ASSETS: { id: AssetId; label: string; short: string; instrument: string; href: string }[] = [
  { id: 'gold', label: 'Altın', short: 'Gram altın', instrument: instrumentKey.gold('serbest-piyasa', 'gram-altin'), href: '/altin/gram-altin' },
  { id: 'usd', label: 'Dolar', short: 'Dolar', instrument: instrumentKey.fx('USD'), href: '/doviz/dolar' },
  { id: 'eur', label: 'Euro', short: 'Euro', instrument: instrumentKey.fx('EUR'), href: '/doviz/euro' },
  { id: 'bist', label: 'BIST 100', short: 'BIST 100', instrument: instrumentKey.index('XU100'), href: '/borsa/endeksler/XU100' },
];
const ASSETS = BORSA_ENABLED ? ALL_ASSETS : ALL_ASSETS.filter((a) => a.id !== 'bist');

function RealReturnCard() {
  const [tufe, setTufe] = useState<TufeEntry[]>([]);
  const [asset, setAsset] = useState<AssetId>('gold');
  const [series, setSeries] = useState<Partial<Record<AssetId, HistoryPoint[]>>>({});
  const meta = ASSETS.find((a) => a.id === asset)!;

  useEffect(() => {
    const ctrl = new AbortController();
    fetch(`${API_URL}/api/inflation/tufe`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.history && setTufe(d.history as TufeEntry[]))
      .catch(() => {});
    return () => ctrl.abort();
  }, []);

  // Seçilen varlığın 5 yıllık haftalık serisi — bir kez çekilir, önbellekte kalır
  useEffect(() => {
    if (series[asset]) return;
    const ctrl = new AbortController();
    fetchHistory(meta.instrument, { range: '5y', interval: '1w', signal: ctrl.signal })
      .then((s) => setSeries((prev) => ({ ...prev, [asset]: s.points ?? [] })))
      .catch(() => {});
    return () => ctrl.abort();
  }, [asset, meta.instrument, series]);

  const data = useMemo(() => {
    const points = series[asset];
    if (!tufe.length || !points?.length) return null;
    const closes = monthEndCloses(points);
    const rows: CompareRow[] = [];
    // TÜFE en yeni başta geliyor — kronolojik sıraya çevir
    for (const e of [...tufe].reverse()) {
      if (e.yearlyChange == null) continue;
      const now = closes.get(e.period);
      const prev = closes.get(prevYearKey(e.period));
      if (!now || !prev) continue;
      rows.push({ period: e.period, inflation: e.yearlyChange, asset: (now / prev - 1) * 100 });
    }
    const recent = rows.slice(-36);
    if (recent.length < 2) return null;
    const last = recent[recent.length - 1];
    const real = ((1 + last.asset / 100) / (1 + last.inflation / 100) - 1) * 100;
    return { rows: recent, last, real };
  }, [tufe, series, asset]);

  const periodLabel = data
    ? new Date(Number(data.last.period.slice(3)), Number(data.last.period.slice(0, 2)) - 1).toLocaleDateString('tr-TR', {
        month: 'long',
        year: 'numeric',
      })
    : '';

  return (
    <article className="atlas-card flex flex-col p-5 sm:p-6 md:order-last md:col-span-2 lg:order-none">
      <CardHead icon={<LineChart className="h-4 w-4" />} title="Enflasyonu kim yendi?" href="/araclar/reel-getiri" meta={periodLabel} />

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div role="group" aria-label="Karşılaştırılacak varlık" className="flex rounded-full border border-border bg-elevated p-1">
          {ASSETS.map((a) => (
            <button
              key={a.id}
              type="button"
              aria-pressed={asset === a.id}
              onClick={() => setAsset(a.id)}
              className={cn(
                'h-7 rounded-full px-3 text-[12px] transition-colors',
                asset === a.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {a.label}
            </button>
          ))}
        </div>
        <div className="flex gap-4 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 rounded bg-primary" aria-hidden="true" /> {meta.short} (yıllık)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-0 w-4 border-t-2 border-dashed border-down" aria-hidden="true" /> Enflasyon (TÜFE)
          </span>
        </div>
      </div>

      <div className="mt-4 grid flex-1 gap-5 sm:grid-cols-[1fr_auto]">
        <div className="min-w-0">
          <CompareChart
            rows={data?.rows ?? []}
            assetLabel={meta.short}
            height={230}
            label={
              data
                ? `Son ${data.rows.length} ayda yıllık TÜFE ile ${meta.short} yıllık getirisi. Son ay: ${meta.short} %${data.last.asset.toLocaleString('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}, enflasyon %${data.last.inflation.toLocaleString('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}.`
                : 'Grafik yükleniyor'
            }
          />
        </div>

        <dl className="grid grid-cols-3 gap-4 sm:w-36 sm:grid-cols-1 sm:content-center sm:gap-5 sm:border-l sm:border-border sm:pl-5">
          <div>
            <dt className="text-[11px] text-muted-foreground">Enflasyon</dt>
            <dd className="num mt-1 text-xl font-medium text-down">{data ? pctTr(data.last.inflation) : '—'}</dd>
          </div>
          <div>
            <dt className="text-[11px] text-muted-foreground">{meta.short} getirisi</dt>
            <dd className="num mt-1 text-xl font-medium text-primary">{data ? pctTr(data.last.asset) : '—'}</dd>
          </div>
          <div>
            <dt className="text-[11px] text-muted-foreground">Reel getiri</dt>
            <dd className={cn('num mt-1 text-xl font-medium', data && data.real < 0 ? 'text-down' : 'text-up')}>
              {data ? pctTr(data.real, { signed: true }) : '—'}
            </dd>
          </div>
        </dl>
      </div>
      <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
        Yıllık getiri: ay sonu kapanışının 12 ay öncesine göre değişimi. Kaynak: TCMB (TÜFE){BORSA_ENABLED ? ', serbest piyasa ve BIST' : ' ve serbest piyasa'}. Reel = (1 + getiri) ÷ (1 + enflasyon) − 1.
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
      {/* Arka plan: pusula görseli tüm kartı kaplar. Görsel her temada koyu olduğundan
          bu kartın yazı renkleri temadan bağımsız sabit açık tonlardır. */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <Image
          src="/atlas/tools.webp"
          alt=""
          fill
          sizes="(min-width:1024px) 25vw, (min-width:768px) 50vw, 100vw"
          className="object-cover object-[10%_65%]"
        />
        {/* Metin okunurluğu: soldan koyu geçiş (görsel tüm alanı kaplar) */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-black/0" />
      </div>

      <p className="eyebrow relative text-[#d4a94f]">Hesaplama araçları</p>
      <h3 className="font-display relative mt-3 max-w-[13ch] text-[1.85rem] leading-[1.08] text-[#f3efe6]">
        Daha akıllı kararlar, 100+ ücretsiz araçla.
      </h3>
      <ul className="relative mt-5 grid max-w-[62%] grid-cols-1 gap-y-0.5 text-sm">
        {FEATURED_TOOLS.map((t) => (
          <li key={t.href}>
            <Link href={t.href} className="group flex items-center gap-1.5 py-1 text-[#f3efe6]/85 hover:text-[#f0d49a]">
              <span className="h-px w-3 bg-[#f3efe6]/35 transition-all group-hover:w-4 group-hover:bg-[#d4a94f]" aria-hidden="true" />
              {t.label}
            </Link>
          </li>
        ))}
      </ul>
      <ArrowLink href="/araclar" className="relative mt-auto self-start pt-6 text-[#d4a94f] decoration-[#d4a94f]/40">
        Tüm araçları keşfet
      </ArrowLink>
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
