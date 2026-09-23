// ── Static Search Index ─────────────────────────────────────────────────────
// Sadece basit in-memory arama için: build time'da inline, runtime'da
// 0 fetch. Generic hook YASAK (Süleyman) — burada sadece utility helper,
// UI yok. Kod tekrarı OK.

import { TOOL_META } from '../seo-data/tools';
import { INDEX_META } from '../seo-data/indices';
import { CURRENCIES } from '../instruments/currencies';
import { COMMODITIES } from '../instruments/commodities';
import { GOLD_SLUGS, getGoldMeta } from '../seo-data/gold';
import { STOCK_META } from '../seo-data/stocks';

export interface SearchItem {
  type: 'arac' | 'endeks' | 'doviz' | 'altin' | 'hisse' | 'emtia';
  slug: string;
  title: string;
  desc: string;
  url: string;
}

function trim(s: string, max: number = 160): string {
  return s.length > max ? s.slice(0, max - 1).trimEnd() + '\u2026' : s;
}

// Build-time-dolu in-memory liste. ~80-100 kayit, bundle'a inline.
export const STATIC_SEARCH_INDEX: SearchItem[] = ((): SearchItem[] => {
  const out: SearchItem[] = [];

  for (const [slug, meta] of Object.entries(TOOL_META)) {
    out.push({
      type: 'arac',
      slug,
      title: meta.title,
      desc: trim(meta.desc),
      url: '/araclar/' + slug,
    });
  }
  for (const [symbol, meta] of Object.entries(INDEX_META)) {
    out.push({
      type: 'endeks',
      slug: symbol,
      title: meta.name + ' (' + meta.symbol + ')',
      desc: trim(meta.description),
      url: '/borsa/endeksler/' + symbol,
    });
  }
  for (const c of CURRENCIES) {
    out.push({
      type: 'doviz',
      slug: c.slug,
      title: c.code + '/TRY ' + c.name,
      desc: c.name + ' (' + c.code + ') \u2014 ' + c.country + ' para birimi, g\u00fcncel kur ve grafik.',
      url: '/doviz/' + c.slug,
    });
  }
  for (const c of COMMODITIES) {
    out.push({
      type: 'emtia',
      slug: c.slug,
      title: c.name,
      desc: trim(c.name + ' fiyat\u0131 (' + c.unit + ') \u2014 ' + c.description),
      url: '/emtia/' + c.slug,
    });
  }
  for (const slug of GOLD_SLUGS) {
    const meta = getGoldMeta(slug);
    if (!meta) continue;
    out.push({
      type: 'altin',
      slug,
      title: meta.name,
      desc: meta.name + ' \u2014 g\u00fcncel fiyat, \u00e7eviri ve hesaplama ara\u00e7lar\u0131.',
      url: '/altin/' + slug,
    });
  }
  for (const [symbol, meta] of Object.entries(STOCK_META)) {
    out.push({
      type: 'hisse',
      slug: symbol,
      title: meta.name + ' (' + symbol + ')',
      desc: symbol + ' (' + meta.name + ') hisse senedi \u2014 ' + (meta.sector || 'BIST') + '.',
      url: '/borsa/hisseler/' + symbol,
    });
  }

  return out;
})();

// T\u00fcrk\u00e7e-aware normalize. Inline (no Fuse.js / Algolia).
function normTR(input: string): string {
  return input
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

interface ScoredItem {
  item: SearchItem;
  score: number;
}

// Basit score-match. Title match ba\u015fta, sonra slug, sonra desc.
export function searchStatic(query: string, limit: number = 30): SearchItem[] {
  const q: string = normTR(query.trim());
  if (q.length < 2) return [];

  const scored: ScoredItem[] = [];

  for (const item of STATIC_SEARCH_INDEX) {
    const title: string = normTR(item.title);
    const slug: string = normTR(item.slug);
    const desc: string = normTR(item.desc);
    let score: number = 0;
    if (title.startsWith(q)) score += 100;
    else if (title.includes(q)) score += 50;
    if (slug.startsWith(q)) score += 80;
    if (desc.includes(q)) score += 20;
    if (score > 0) scored.push({ item, score });
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.item.title.localeCompare(b.item.title, 'tr');
  });

  return scored.slice(0, limit).map((s): SearchItem => s.item);
}
