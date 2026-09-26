import { API_URL } from '@/lib/constants';

/**
 * Hisse sayfası performans özeti — yalnızca kendi fiyat geçmişimizden (günlük kapanış) hesaplanır,
 * yeni veri kaynağı gerektirmez. Sunucuda (ISR) üretilir; sayfaya hisseye özgü sayısal içerik ve
 * otomatik SSS sağlar. Yatırım tavsiyesi içermez: yalnızca geçmiş değerler.
 */

interface Point {
  t: string;
  h: number | null;
  l: number | null;
  c: number;
  v: number | null;
}

export interface PeriodReturn {
  key: '1w' | '1m' | '3m' | 'ytd' | '1y';
  label: string;
  stock: number | null;
  index: number | null;
}

export interface StockStats {
  symbol: string;
  asOf: string;                    // son kapanış tarihi (YYYY-MM-DD)
  last: number;
  periods: PeriodReturn[];
  high52: { value: number; date: string };
  low52: { value: number; date: string };
  rangePos: number;                // son fiyatın 52 haftalık aralıktaki yeri (0–100)
  avgTurnover20: number | null;    // 20 günlük ortalama işlem hacmi (TL)
  volatility: number | null;       // yıllıklandırılmış oynaklık (%)
  maxDrawdown: { pct: number; from: string; to: string } | null;
  indices: string[];               // BIST30 / BIST50 / BIST100 üyelikleri
  days: number;                    // kullanılan işlem günü sayısı
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

async function indexMembership(symbol: string): Promise<string[]> {
  try {
    const res = await fetch(`${API_URL}/api/market/stocks`, { next: { revalidate: 3600 }, signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const list = (await res.json()) as { symbol: string; indices?: string[] }[];
    return list.find((s) => s.symbol === symbol)?.indices ?? [];
  } catch {
    return [];
  }
}

const pct = (from: number, to: number) => ((to - from) / from) * 100;

/** `daysBack` işlem günü önceki kapanıştan bugüne getiri; yeterli veri yoksa null */
function ret(points: Point[], daysBack: number): number | null {
  if (points.length <= daysBack) return null;
  return pct(points[points.length - 1 - daysBack].c, points[points.length - 1].c);
}

function ytd(points: Point[]): number | null {
  const year = points[points.length - 1]?.t.slice(0, 4);
  const i = points.findIndex((p) => p.t.startsWith(year));
  if (i <= 0) return null; // yıl başından önce veri yoksa (yeni halka arz) hesaplanmaz
  return pct(points[i - 1].c, points[points.length - 1].c);
}

function onDate(points: Point[], dates: string[]): Map<string, number> {
  const m = new Map(points.map((p) => [p.t, p.c] as const));
  return new Map(dates.filter((d) => m.has(d)).map((d) => [d, m.get(d)!] as const));
}

export async function getStockStats(symbol: string): Promise<StockStats | null> {
  const [pts, idx, indices] = await Promise.all([history(`bist:${symbol}`), history('index:XU100'), indexMembership(symbol)]);
  if (pts.length < 20) return null;

  // Endeks getirilerini hissenin işlem günleriyle hizala
  const idxOn = onDate(idx, pts.map((p) => p.t));
  const idxAligned = pts.filter((p) => idxOn.has(p.t)).map((p) => ({ ...p, c: idxOn.get(p.t)! }));
  const idxRet = (daysBack: number) => {
    if (idxAligned.length !== pts.length) return null;
    return ret(idxAligned, daysBack);
  };

  const periods: PeriodReturn[] = [
    { key: '1w', label: '1 hafta', stock: ret(pts, 5), index: idxRet(5) },
    { key: '1m', label: '1 ay', stock: ret(pts, 21), index: idxRet(21) },
    { key: '3m', label: '3 ay', stock: ret(pts, 63), index: idxRet(63) },
    { key: 'ytd', label: 'Yılbaşından bu yana', stock: ytd(pts), index: idxAligned.length === pts.length ? ytd(idxAligned) : null },
    { key: '1y', label: '1 yıl', stock: pts.length >= 240 ? pct(pts[0].c, pts[pts.length - 1].c) : null, index: pts.length >= 240 && idxAligned.length === pts.length ? pct(idxAligned[0].c, idxAligned[idxAligned.length - 1].c) : null },
  ];

  let hi = { value: -Infinity, date: '' };
  let lo = { value: Infinity, date: '' };
  for (const p of pts) {
    const h = p.h ?? p.c;
    const l = p.l ?? p.c;
    if (h > hi.value) hi = { value: h, date: p.t };
    if (l < lo.value) lo = { value: l, date: p.t };
  }
  const last = pts[pts.length - 1];

  // Son gün seans içindeyse hacmi eksik; ortalamada son 20 tam günü kullan
  const todayIso = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Istanbul' });
  const full = last.t === todayIso ? pts.slice(0, -1) : pts;
  const vols = full.slice(-20).map((p) => p.v).filter((v): v is number => v != null && v > 0);
  const avgTurnover20 = vols.length >= 10 ? vols.reduce((a, b) => a + b, 0) / vols.length : null;

  const logs = pts.slice(1).map((p, i) => Math.log(p.c / pts[i].c));
  const mean = logs.reduce((a, b) => a + b, 0) / logs.length;
  const sd = Math.sqrt(logs.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(1, logs.length - 1));
  const volatility = logs.length >= 60 ? sd * Math.sqrt(252) * 100 : null;

  let peak = pts[0];
  let dd: StockStats['maxDrawdown'] = null;
  for (const p of pts) {
    if (p.c > peak.c) peak = p;
    const d = pct(peak.c, p.c);
    if (!dd || d < dd.pct) dd = { pct: d, from: peak.t, to: p.t };
  }

  return {
    symbol,
    asOf: last.t,
    last: last.c,
    periods,
    high52: hi,
    low52: lo,
    rangePos: hi.value > lo.value ? ((last.c - lo.value) / (hi.value - lo.value)) * 100 : 50,
    avgTurnover20,
    volatility,
    maxDrawdown: dd && dd.pct < -0.5 ? dd : null,
    indices: indices.filter((i) => /^BIST(30|50|100)$/.test(i)).sort((a, b) => Number(a.slice(4)) - Number(b.slice(4))),
    days: pts.length,
  };
}

// ── Metin yardımcıları ───────────────────────────────────────────────────────
export const fmtNum = (v: number, d = 2) => v.toLocaleString('tr-TR', { minimumFractionDigits: d, maximumFractionDigits: d });
export const fmtPct = (v: number | null) => (v == null ? '—' : `${v > 0 ? '+' : v < 0 ? '−' : ''}%${fmtNum(Math.abs(v))}`);
export const fmtDate = (iso: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Istanbul' });
export const fmtTl = (v: number) =>
  v >= 1e9 ? `${fmtNum(v / 1e9, 1)} milyar TL` : v >= 1e6 ? `${fmtNum(v / 1e6, 1)} milyon TL` : `${fmtNum(v, 0)} TL`;
const idxLabel = (i: string) => `BIST ${i.slice(4)}`;

/** Hesaplanan değerlerden SSS — tarihli, tavsiye içermeyen, doğrudan yanıtlar */
export function statsFaq(s: StockStats): { q: string; a: string }[] {
  const out: { q: string; a: string }[] = [];
  out.push({
    q: `${s.symbol} hissesinin 52 haftalık en yüksek ve en düşük fiyatı nedir?`,
    a: `Son 52 haftada ${s.symbol} en yüksek ${fmtNum(s.high52.value)} TL (${fmtDate(s.high52.date)}), en düşük ${fmtNum(s.low52.value)} TL (${fmtDate(s.low52.date)}) seviyesini gördü. ${fmtDate(s.asOf)} kapanışı ${fmtNum(s.last)} TL ile bu aralığın yaklaşık %${Math.round(s.rangePos)} seviyesinde.`,
  });
  const y = s.periods.find((p) => p.key === '1y');
  const ytdP = s.periods.find((p) => p.key === 'ytd');
  const main = y?.stock != null ? y : ytdP?.stock != null ? ytdP : null;
  if (main && main.stock != null) {
    out.push({
      q: `${s.symbol} son ${main.key === '1y' ? '1 yılda' : 'yılbaşından bu yana'} ne kadar değişti?`,
      a: `${s.symbol}, ${fmtDate(s.asOf)} itibarıyla ${main.key === '1y' ? 'son 1 yılda' : 'yılbaşından bu yana'} ${fmtPct(main.stock)} değişti` +
        (main.index != null ? `; aynı dönemde BIST 100 endeksi ${fmtPct(main.index)} değişti.` : '.') +
        ' Geçmiş performans gelecekteki sonuçların göstergesi değildir.',
    });
  }
  out.push({
    q: `${s.symbol} hangi BIST endekslerinde yer alıyor?`,
    a: s.indices.length
      ? `${s.symbol}, güncel listeleme verisine göre ${s.indices.map(idxLabel).join(', ')} endekslerinde yer alıyor.`
      : `${s.symbol}, güncel listeleme verisine göre BIST 30, BIST 50 ve BIST 100 endekslerinde yer almıyor.`,
  });
  if (s.avgTurnover20 != null) {
    out.push({
      q: `${s.symbol} hissesinin günlük işlem hacmi ne kadar?`,
      a: `${s.symbol} hissesinde son 20 işlem gününde ortalama günlük işlem hacmi yaklaşık ${fmtTl(s.avgTurnover20)} oldu.`,
    });
  }
  return out;
}
