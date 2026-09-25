import { API_URL } from '@/lib/constants';

/**
 * Sunucuda üretilen "doğrudan yanıt" cümlesi: güncel fiyat + tarih/saat + değişim.
 *
 * Fiyatlar sayfada istemcide (SSE) yükleniyor; yapay zekâ tarayıcıları (GPTBot, ClaudeBot,
 * PerplexityBot…) JavaScript çalıştırmadığı için HTML'de hiç fiyat görmüyor ve sayfayı kaynak
 * gösteremiyordu. Bu cümle ISR ile (sayfanın revalidate süresi) sunucuda yenilenir.
 * Veri alınamazsa hiçbir şey çizilmez.
 */

export type Spec =
  | { kind: 'gold'; liveName: string; label: string; currency: 'TRY' | 'USD' }
  | { kind: 'fx'; code: string; serbestName: string; label: string }
  | { kind: 'stock'; symbol: string; label: string }
  | { kind: 'index'; symbol: string; label: string }
  | { kind: 'gold-list' }
  | { kind: 'fx-list' }
  | { kind: 'borsa-list' };

const TZ = 'Europe/Istanbul';

async function getJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}${path}`, { next: { revalidate: 60 }, signal: AbortSignal.timeout(6000) });
    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    return null;
  }
}

const num = (v: number, d = 2) => v.toLocaleString('tr-TR', { minimumFractionDigits: d, maximumFractionDigits: d });
const pct = (v: number | null | undefined) =>
  v == null ? null : `${v > 0 ? '+' : v < 0 ? '−' : ''}%${Math.abs(v).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function stamp(iso?: string | null): string {
  const d = iso ? new Date(iso) : new Date();
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: TZ });
}

/** Borsa verisi yalnız "HH:MM" taşır; bugünün İstanbul tarihiyle birleştirilir */
function stampToday(hhmm?: string | null): string {
  const day = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: TZ });
  return hhmm && /^\d{1,2}:\d{2}$/.test(hhmm) ? `${day} ${hhmm}` : day;
}

/** Özet cümlesinin düz metni (llms.txt gibi sayfa dışı kullanım için) */
export async function answerText(spec: Spec): Promise<string | null> {
  return (await sentence(spec))?.text ?? null;
}

async function sentence(spec: Spec): Promise<{ text: string; iso?: string } | null> {
  if (spec.kind === 'gold') {
    const list = await getJson<{ source: string; goldType: string; buyPrice: number; sellPrice: number; changePercent: number | null; timestamp?: string }[]>(
      '/api/market/gold',
    );
    const g = list?.find((x) => x.goldType === spec.liveName && x.source === 'serbest-piyasa') ?? list?.find((x) => x.goldType === spec.liveName);
    if (!g || !(g.sellPrice > 0)) return null;
    const cur = spec.currency === 'USD' ? 'ABD doları' : 'TL';
    const ch = pct(g.changePercent);
    return {
      iso: g.timestamp,
      text:
        `${spec.label} satış fiyatı ${stamp(g.timestamp)} itibarıyla ${num(g.sellPrice)} ${cur}, ` +
        `alış fiyatı ${num(g.buyPrice)} ${cur}.` +
        (ch ? ` Günlük değişim ${ch}.` : ''),
    };
  }
  if (spec.kind === 'fx') {
    const list = await getJson<{ name: string; buyPrice: number; sellPrice: number; changePercent: number | null; timestamp?: string }[]>(
      '/api/market/currency/serbest-piyasa',
    );
    const c = list?.find((x) => x.name === spec.serbestName);
    if (!c || !(c.sellPrice > 0)) return null;
    const ch = pct(c.changePercent);
    return {
      iso: c.timestamp,
      text:
        `1 ${spec.label} (${spec.code}) serbest piyasada ${stamp(c.timestamp)} itibarıyla ${num(c.sellPrice, 4)} TL'den satılıyor, ` +
        `${num(c.buyPrice, 4)} TL'den alınıyor.` +
        (ch ? ` Günlük değişim ${ch}.` : ''),
    };
  }
  if (spec.kind === 'stock') {
    const list = await getJson<{ symbol: string; lastPrice: number; low: number; high: number; changePercent: number | null; time?: string }[]>(
      '/api/market/stocks',
    );
    const s = list?.find((x) => x.symbol === spec.symbol);
    if (!s || !(s.lastPrice > 0)) return null;
    const ch = pct(s.changePercent);
    return {
      text:
        `${spec.label} hissesi ${stampToday(s.time)} itibarıyla ${num(s.lastPrice)} TL'den işlem görüyor` +
        (ch ? `; günlük değişim ${ch}` : '') +
        (s.low > 0 && s.high > 0 ? `, gün içi aralık ${num(s.low)}–${num(s.high)} TL` : '') +
        '. Borsa verileri en az 15 dakika gecikmelidir.',
    };
  }
  if (spec.kind === 'gold-list') {
    const list = await getJson<{ source: string; goldType: string; sellPrice: number; timestamp?: string }[]>('/api/market/gold');
    const pick = (n: string) => list?.find((x) => x.goldType === n && x.source === 'serbest-piyasa') ?? list?.find((x) => x.goldType === n);
    const parts = (['Gram Altın', 'Çeyrek Altın', 'Yarım Altın', 'Tam Altın', 'Cumhuriyet Altını'] as const)
      .map((n) => [n, pick(n)] as const)
      .filter(([, g]) => g && g.sellPrice > 0)
      .map(([n, g]) => `${n.toLocaleLowerCase('tr-TR')} ${num(g!.sellPrice)} TL`);
    const ons = pick('Ons Altın');
    if (!parts.length) return null;
    const ref = pick('Gram Altın');
    return {
      text:
        `Serbest piyasada ${stamp(ref?.timestamp)} itibarıyla satış fiyatları: ${parts.join(', ')}` +
        (ons && ons.sellPrice > 0 ? `; ons altın ${num(ons.sellPrice)} ABD doları.` : '.'),
    };
  }
  if (spec.kind === 'fx-list') {
    const list = await getJson<{ name: string; sellPrice: number; timestamp?: string }[]>('/api/market/currency/serbest-piyasa');
    const want: [string, string][] = [['Amerikan Doları', 'dolar'], ['Euro', 'euro'], ['İngiliz Sterlini', 'sterlin'], ['İsviçre Frankı', 'İsviçre frangı']];
    const parts = want.map(([n, l]) => [l, list?.find((x) => x.name === n)] as const).filter(([, c]) => c && c.sellPrice > 0)
      .map(([l, c]) => `1 ${l} ${num(c!.sellPrice, 4)} TL`);
    if (!parts.length) return null;
    return { text: `Serbest piyasada ${stamp(list?.[0]?.timestamp)} itibarıyla satış kurları: ${parts.join(', ')}.` };
  }
  if (spec.kind === 'borsa-list') {
    const list = await getJson<{ symbol: string; value: number; changePercent: number | null; time?: string }[]>('/api/market/indices');
    const parts = (['XU100', 'XU030', 'XU050'] as const).map((sym) => list?.find((x) => x.symbol === sym)).filter((x) => x && x.value > 0)
      .map((x) => `BIST ${x!.symbol.slice(2).replace(/^0/, '')} ${num(x!.value)} puan${pct(x!.changePercent) ? ` (${pct(x!.changePercent)})` : ''}`);
    if (!parts.length) return null;
    const t = list?.find((x) => x.symbol === 'XU100')?.time;
    return { text: `Borsa İstanbul'da ${stampToday(t)} itibarıyla ${parts.join(', ')}. Veriler en az 15 dakika gecikmelidir.` };
  }
  const list = await getJson<{ symbol: string; value: number; low: number; high: number; changePercent: number | null; time?: string }[]>(
    '/api/market/indices',
  );
  const x = list?.find((i) => i.symbol === spec.symbol);
  if (!x || !(x.value > 0)) return null;
  const ch = pct(x.changePercent);
  return {
    text:
      `${spec.label} endeksi ${stampToday(x.time)} itibarıyla ${num(x.value)} puan` +
      (ch ? `; günlük değişim ${ch}` : '') +
      (x.low > 0 && x.high > 0 ? `, gün içi aralık ${num(x.low)}–${num(x.high)} puan` : '') +
      '. Borsa verileri en az 15 dakika gecikmelidir.',
  };
}

export async function AnswerSummary({ spec, className }: { spec: Spec; className?: string }) {
  const s = await sentence(spec);
  if (!s) return null;
  return (
    <p className={className ?? 'answer-summary mx-auto max-w-[1440px] px-4 pt-5 text-[15px] leading-relaxed text-muted-foreground lg:px-8'}>
      <span className="text-foreground/80">{s.text}</span>
    </p>
  );
}
