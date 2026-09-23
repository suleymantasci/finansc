// Sunucu tarafı emtia anlık görüntüsü: son iki günlük kapanıştan fiyat ve değişim.
// Değerler /api/history'den gelir; tarih her zaman gösterilir (canlı değildir).

import { API_URL } from '@/lib/constants';
import type { CommodityEntry } from './commodities';

export interface CommoditySnapshot {
  last: number;
  prev: number | null;
  changePct: number | null;
  /** YYYY-MM-DD */
  date: string;
  high: number | null;
  low: number | null;
}

export async function fetchCommoditySnapshot(e: CommodityEntry): Promise<CommoditySnapshot | null> {
  try {
    const res = await fetch(`${API_URL}/api/history/${encodeURIComponent(e.historyKey)}?interval=1d&range=1m`, {
      next: { revalidate: 600 },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { points?: { t: string; c: number; h: number | null; l: number | null }[] };
    const pts = (data.points ?? []).filter((p) => Number.isFinite(p.c));
    if (pts.length === 0) return null;
    const last = pts[pts.length - 1];
    const prev = pts.length > 1 ? pts[pts.length - 2].c : null;
    return {
      last: last.c,
      prev,
      changePct: prev ? ((last.c - prev) / prev) * 100 : null,
      date: last.t.slice(0, 10),
      high: last.h,
      low: last.l,
    };
  } catch {
    return null;
  }
}

export function formatCommodity(e: CommodityEntry, v: number): string {
  return v.toLocaleString('tr-TR', { minimumFractionDigits: e.decimals, maximumFractionDigits: e.decimals });
}

export function formatDateTr(ymd: string): string {
  const d = new Date(`${ymd}T00:00:00`);
  return Number.isNaN(d.getTime()) ? ymd : d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
}
