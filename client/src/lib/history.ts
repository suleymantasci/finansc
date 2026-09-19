const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/** Grafik periyotları — backend ile birebir aynı */
export type Interval = '1h' | '1d' | '1w' | '1mo' | '1y';

export interface HistoryPoint {
  t: string;
  o: number | null;
  h: number | null;
  l: number | null;
  c: number;
  v: number | null;
}

export interface HistorySeries {
  success: boolean;
  instrument: string;
  label: string;
  kind: string;
  source: string;
  interval: Interval;
  from: string;
  to: string;
  count: number;
  live: boolean;
  points: HistoryPoint[];
}

/** Kullanıcıya gösterilen aralık seçenekleri ve her birinin uygun çözünürlüğü */
export const RANGE_PRESETS: {
  id: string;
  label: string;
  range: string;
  interval: Interval;
}[] = [
  { id: '1h', label: '1G', range: '2d', interval: '1h' },
  { id: '1m', label: '1A', range: '1m', interval: '1d' },
  { id: '6m', label: '6A', range: '6m', interval: '1d' },
  { id: '1y', label: '1Y', range: '1y', interval: '1d' },
  { id: '5y', label: '5Y', range: '5y', interval: '1w' },
  { id: 'max', label: 'Tümü', range: 'max', interval: '1mo' },
];

export async function fetchHistory(
  instrument: string,
  opts: {
    interval?: Interval;
    range?: string;
    from?: string;
    to?: string;
    source?: string;
    signal?: AbortSignal;
  } = {},
): Promise<HistorySeries> {
  const params = new URLSearchParams();
  params.set('interval', opts.interval ?? '1d');
  if (opts.range) params.set('range', opts.range);
  if (opts.from) params.set('from', opts.from);
  if (opts.to) params.set('to', opts.to);
  if (opts.source) params.set('source', opts.source);

  const res = await fetch(
    `${API_BASE}/api/history/${encodeURIComponent(instrument)}?${params.toString()}`,
    { signal: opts.signal },
  );
  if (!res.ok) throw new Error(`Geçmiş veri alınamadı (${res.status})`);
  return res.json();
}

/**
 * Son mum akışı. Grafiğin tamamı yeniden çekilmez — sadece son bar güncellenir.
 * Dönen fonksiyon bağlantıyı kapatır.
 */
export function subscribeHistory(
  instrument: string,
  onBar: (bar: { t: string; o: number; h: number; l: number; c: number; v: number | null }, interval: string) => void,
): () => void {
  const es = new EventSource(`${API_BASE}/api/history/${encodeURIComponent(instrument)}/stream`);
  es.onmessage = (e) => {
    try {
      const msg = JSON.parse(e.data);
      if (msg?.type === 'bar' && msg.bar) onBar(msg.bar, msg.interval ?? '1d');
    } catch {
      /* bozuk paket — yoksay */
    }
  };
  es.onerror = () => {
    /* EventSource kendi yeniden bağlanır */
  };
  return () => es.close();
}

/** Enstrüman anahtarı üreticiler — backend'deki instrument-registry ile aynı format */
export const instrumentKey = {
  gold: (source: string, type: string) => `gold:${source}:${type}`,
  fx: (code: string, source: 'serbest-piyasa' | 'merkez-bankasi' = 'serbest-piyasa') =>
    `fx:${code.toUpperCase()}:${source}`,
  stock: (symbol: string) => `bist:${symbol.toUpperCase()}`,
  index: (symbol: string) => `index:${symbol.toUpperCase()}`,
};
