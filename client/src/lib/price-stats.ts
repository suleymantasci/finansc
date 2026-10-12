import { API_URL } from '@/lib/constants';

/**
 * Altın, döviz ve emtia sayfaları için performans özeti — kendi fiyat geçmişimizden (günlük kapanış)
 * hesaplanır. Sunucuda (ISR) üretilir; sayfaya enstrümana özgü, tarihli sayısal içerik ve otomatik SSS
 * sağlar. Yatırım tavsiyesi içermez: yalnızca geçmiş değerler.
 */

interface Point {
  t: string;
  h: number | null;
  l: number | null;
  c: number;
}

export interface PricePeriod {
  key: '1w' | '1m' | '3m' | 'ytd' | '1y';
  label: string;
  pct: number | null;
}

export interface PriceStats {
  asOf: string;                    // son kapanış tarihi (YYYY-MM-DD)
  last: number;
  periods: PricePeriod[];
  high52: { value: number; date: string };
  low52: { value: number; date: string };
  rangePos: number;                // son fiyatın 52 haftalık aralıktaki yeri (0–100)
}

async function history(instrument: string): Promise<Point[]> {
  try {
    const res = await fetch(`${API_URL}/api/history/${encodeURIComponent(instrument)}?interval=1d&range=1y`, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const d = (await res.json()) as { points?: Point[] };
    return (d.points ?? []).filter((p) => p && p.c > 0);
  } catch {
    return [];
  }
}

const pct = (from: number, to: number) => ((to - from) / from) * 100;
const DAY = 86_400_000;
const ms = (iso: string) => Date.parse(`${iso}T12:00:00Z`);

/** Son kapanıştan `days` takvim günü önceki (ya da daha eski en yakın) kapanışa göre değişim */
function since(points: Point[], days: number): number | null {
  const last = points[points.length - 1];
  const target = ms(last.t) - days * DAY;
  // Hafta sonu/tatil boşluklarında 4 güne kadar sapmaya izin ver; veri daha geç başlıyorsa hesaplama
  if (ms(points[0].t) > target + 4 * DAY) return null;
  let base = points[0];
  for (const p of points) {
    if (ms(p.t) > target) break;
    base = p;
  }
  return pct(base.c, last.c);
}

function ytd(points: Point[]): number | null {
  const year = points[points.length - 1].t.slice(0, 4);
  const i = points.findIndex((p) => p.t.startsWith(year));
  if (i <= 0) return null;
  return pct(points[i - 1].c, points[points.length - 1].c);
}

/** `scale`: geçmiş seri birden fazla birimle kotasyonluysa (örn. 100 JPY) bölen */
export async function getPriceStats(instrument: string | null | undefined, scale = 1): Promise<PriceStats | null> {
  if (!instrument) return null;
  const pts = (await history(instrument)).map((p) => ({
    t: p.t,
    c: p.c / scale,
    h: p.h == null ? null : p.h / scale,
    l: p.l == null ? null : p.l / scale,
  }));
  if (pts.length < 20) return null;

  let hi = { value: -Infinity, date: '' };
  let lo = { value: Infinity, date: '' };
  for (const p of pts) {
    const h = p.h ?? p.c;
    const l = p.l ?? p.c;
    if (h > hi.value) hi = { value: h, date: p.t };
    if (l < lo.value) lo = { value: l, date: p.t };
  }
  const last = pts[pts.length - 1];
  return {
    asOf: last.t,
    last: last.c,
    periods: [
      { key: '1w', label: '1 hafta', pct: since(pts, 7) },
      { key: '1m', label: '1 ay', pct: since(pts, 30) },
      { key: '3m', label: '3 ay', pct: since(pts, 91) },
      { key: 'ytd', label: 'Yılbaşından bu yana', pct: ytd(pts) },
      { key: '1y', label: '1 yıl', pct: since(pts, 365) },
    ],
    high52: hi,
    low52: lo,
    rangePos: hi.value > lo.value ? ((last.c - lo.value) / (hi.value - lo.value)) * 100 : 50,
  };
}

// ── Metin yardımcıları ───────────────────────────────────────────────────────
export const fmtNum = (v: number, d = 2) => v.toLocaleString('tr-TR', { minimumFractionDigits: d, maximumFractionDigits: d });
export const fmtPct = (v: number | null) => (v == null ? '—' : `${v > 0 ? '+' : v < 0 ? '−' : ''}%${fmtNum(Math.abs(v))}`);
export const fmtDate = (iso: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Istanbul' });

export interface PriceLabel {
  /** "Gram altın", "Amerikan Doları" */
  name: string;
  /** Fiyat birimi metni: "TL", "ABD doları/ons", "USD/varil" */
  unit: string;
  decimals?: number;
}

const main = (s: PriceStats) => s.periods.find((p) => p.key === '1y' && p.pct != null) ?? s.periods.find((p) => p.key === 'ytd' && p.pct != null);
const mainLabel = (p: PricePeriod) => (p.key === '1y' ? 'son 1 yılda' : 'yılbaşından bu yana');

/** Sayfada görünen tek paragraflık özet */
export function priceStatsSentence(l: PriceLabel, s: PriceStats): string {
  const d = l.decimals ?? 2;
  const m = main(s);
  const m1 = s.periods.find((p) => p.key === '1m')?.pct ?? null;
  return (
    `${l.name}, ${fmtDate(s.asOf)} kapanışında ${fmtNum(s.last, d)} ${l.unit} seviyesinde. ` +
    (m && m.pct != null ? `Fiyat ${mainLabel(m)} ${fmtPct(m.pct)}` + (m1 != null ? `, son 1 ayda ${fmtPct(m1)} değişti. ` : ' değişti. ') : '') +
    `Son 52 haftanın en yüksek seviyesi ${fmtNum(s.high52.value, d)} ${l.unit} (${fmtDate(s.high52.date)}), ` +
    `en düşük seviyesi ${fmtNum(s.low52.value, d)} ${l.unit} (${fmtDate(s.low52.date)}).`
  );
}

/** Hesaplanan değerlerden SSS — tarihli, tavsiye içermeyen, doğrudan yanıtlar */
export function priceStatsFaq(l: PriceLabel, s: PriceStats): { q: string; a: string }[] {
  const d = l.decimals ?? 2;
  const out: { q: string; a: string }[] = [
    {
      q: `${l.name} son 52 haftada en yüksek ve en düşük kaç oldu?`,
      a: `Son 52 haftada ${l.name.toLocaleLowerCase('tr-TR')} en yüksek ${fmtNum(s.high52.value, d)} ${l.unit} (${fmtDate(s.high52.date)}), en düşük ${fmtNum(s.low52.value, d)} ${l.unit} (${fmtDate(s.low52.date)}) seviyesini gördü. ${fmtDate(s.asOf)} kapanışı ${fmtNum(s.last, d)} ${l.unit} ile bu aralığın yaklaşık %${Math.round(s.rangePos)} seviyesinde.`,
    },
  ];
  const m = main(s);
  if (m && m.pct != null) {
    out.push({
      q: `${l.name} ${mainLabel(m)} ne kadar değişti?`,
      a: `${l.name}, ${fmtDate(s.asOf)} itibarıyla ${mainLabel(m)} ${fmtPct(m.pct)} değişti. Geçmiş performans gelecekteki sonuçların göstergesi değildir.`,
    });
  }
  return out;
}
