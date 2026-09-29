// Araçların kullandığı canlı ve tarihsel veri yükleyicileri (yalnızca tarayıcıda çağrılır).

import { API_URL } from '@/lib/constants';
import { CURRENCIES } from '@/lib/instruments/currencies';
import { endeksSerisi, type EndeksNoktasi, type EndeksSerisi } from '@/lib/calculators/piyasa';

async function getJson<T>(path: string, signal: AbortSignal): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

// ── TÜFE endeksi ──
export interface TufeVerisi { seri: EndeksSerisi; ilk: string; son: string }

export async function loadTufe(signal: AbortSignal): Promise<TufeVerisi> {
  const d = await getJson<{ firstPeriod: string; lastPeriod: string; data: EndeksNoktasi[] }>('/api/inflation/tufe/endeks', signal);
  return { seri: endeksSerisi(d.data), ilk: d.firstPeriod, son: d.lastPeriod };
}

// ── Canlı altın (serbest piyasa) ──
export interface Fiyat { alis: number; satis: number; zaman?: string }
export type FiyatTablosu = Record<string, Fiyat>;

export async function loadAltin(signal: AbortSignal): Promise<FiyatTablosu> {
  const list = await getJson<{ source: string; goldType: string; buyPrice: number; sellPrice: number; timestamp?: string }[]>('/api/market/gold', signal);
  const out: FiyatTablosu = {};
  for (const x of list) if (x.source === 'serbest-piyasa') out[x.goldType] = { alis: x.buyPrice, satis: x.sellPrice, zaman: x.timestamp };
  return out;
}

// ── Canlı döviz (serbest piyasa, 1 birim = TL) ──
export async function loadDoviz(signal: AbortSignal): Promise<FiyatTablosu> {
  const list = await getJson<{ name: string; buyPrice: number; sellPrice: number; timestamp?: string }[]>('/api/market/currency/serbest-piyasa', signal);
  const byName = new Map(list.map((x) => [x.name, x]));
  const out: FiyatTablosu = { TRY: { alis: 1, satis: 1 } };
  for (const c of CURRENCIES) {
    const x = c.serbestName ? byName.get(c.serbestName) : undefined;
    if (x) out[c.code] = { alis: x.buyPrice, satis: x.sellPrice, zaman: x.timestamp };
  }
  return out;
}

export const DOVIZ_SECENEKLERI = [
  { value: 'TRY', label: 'Türk Lirası (TRY)' },
  ...CURRENCIES.filter((c) => c.serbestName).map((c) => ({ value: c.code, label: `${c.name} (${c.code})` })),
];

export const GECMIS_DOVIZ_SECENEKLERI = CURRENCIES.filter((c) => c.historyCode).map((c) => ({ value: c.code, label: `${c.name} (${c.code})` }));

// ── Tarihsel kapanış (tarih veya öncesindeki son işlem günü) ──
export interface TarihliFiyat { tarih: string; deger: number }

async function sonKapanis(instrument: string, tarih: string, signal: AbortSignal): Promise<TarihliFiyat | null> {
  const bitis = new Date(`${tarih}T00:00:00Z`);
  const bas = new Date(bitis.getTime() - 10 * 86400000).toISOString().slice(0, 10);
  const d = await getJson<{ points: { t: string; c: number }[] }>(`/api/history/${encodeURIComponent(instrument)}?interval=1d&from=${bas}&to=${tarih}`, signal);
  const p = d.points?.filter((x) => x.t.slice(0, 10) <= tarih).at(-1);
  return p ? { tarih: p.t.slice(0, 10), deger: p.c } : null;
}

export async function loadGecmisAltin(tarih: string, signal: AbortSignal): Promise<TarihliFiyat> {
  const r = await sonKapanis('gold:serbest-piyasa:gram-altin', tarih, signal);
  if (!r) throw new Error('veri yok');
  return r;
}

/** TCMB kuru, yoksa serbest piyasa. Kotasyon birimi (JPY 100) 1 birime çevrilir. */
export async function loadGecmisKur(kod: string, tarih: string, signal: AbortSignal): Promise<TarihliFiyat & { kaynak: string }> {
  const c = CURRENCIES.find((x) => x.code === kod);
  if (!c?.historyCode) throw new Error('kur yok');
  for (const kaynak of ['merkez-bankasi', 'serbest-piyasa']) {
    const r = await sonKapanis(`fx:${c.historyCode}:${kaynak}`, tarih, signal).catch(() => null);
    if (r) return { tarih: r.tarih, deger: r.deger / c.historyUnit, kaynak: kaynak === 'merkez-bankasi' ? 'TCMB' : 'serbest piyasa' };
  }
  throw new Error('veri yok');
}
