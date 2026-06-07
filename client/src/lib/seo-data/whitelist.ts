// ── BIST Hisse Sembolü Whitelist'i (Build-time API fetch + 24h cache) ──
//
// Amaç: BIST'te gerçekten var olan 600+ sembol için 200, uydurma/var
// olmayan semboller için 404 vermek. Format kontrolü kırılgandı
// (ALTINS1 7-char, DMLKTG/ENTRAR 6-char istisnaları vardı).
//
// Strateji (Seçenek A):
// - Build sırasında /api/market/stocks endpoint'inden tüm sembol
//   listesini çek (revalidate: 86400 — 24 saatte bir yenilenir).
// - Her gün yeni eklenen/delisten çıkan semboller 24 saat içinde
//   sitemap'e ve whitelist'e yansır (Süleyman'ın "geçte olsa
//   yakalansın" gereksinimi).
// - API erişilemezse (Pit 22 — Docker build stage'de network yok):
//   statik STOCK_META'daki 99 sembol fallback olarak kullanılır.
//   Sonuç: 99 sembol whitelist'te, geri kalanı 404 alır — eski
//   davranıştan daha kötü değil, sadece build geçer.
// - Runtime'da da endpoint tekrar çekilir; API değişikliği
//   deploy olmadan 24 saat içinde yansır (ISR revalidate).
//
// Not: Sitemap ile uyumlu — generateStaticParams + sitemap aynı
// whitelist'i kullanır, böylece sitemap'te listelenen her URL'in
// 200 dönmesi garanti olur.

import { unstable_cache as nextCache } from 'next/cache';
import { STOCK_META } from './stocks';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ApiStock {
  symbol: string;
  name: string;
}

/**
 * Backend'den tüm BIST sembol listesini çek.
 * Build sırasında ve runtime'da 24 saat cache'lenir.
 */
async function fetchSymbolsFromApi(): Promise<string[]> {
  try {
    const res = await fetch(`${API_BASE}/api/market/stocks`, {
      next: { revalidate: 86400 }, // 24 saat — Süleyman isteği
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return [];
    const data: ApiStock[] = await res.json();
    if (!Array.isArray(data)) return [];
    return data
      .map((s) => s?.symbol)
      .filter((s): s is string => typeof s === 'string' && s.length > 0);
  } catch {
    return [];
  }
}

// nextCache JSON-serializable data döndürmek zorundadır (Set, Map
// çalışmaz). Bu yüzden sembolleri string[] olarak saklıyoruz, lookup
// için includes() kullanıyoruz. 615 sembol için includes O(n) ama
// prerender sırasında 1 kez çalışıyor, runtime'da her istekte bir kez.
interface WhitelistResult {
  symbols: string[];
  source: 'api' | 'fallback';
  count: number;
  fetchedAt: number;
}

// nextCache ile 24 saatlik cache — generateStaticParams ve
// isKnownSymbol aynı cache'i paylaşır (build sırasında 1 kez
// çalışır, sonra 24 saat boyunca aynı sonucu döner).
const getWhitelist = nextCache(
  async (): Promise<WhitelistResult> => {
    const apiSymbols = await fetchSymbolsFromApi();
    if (apiSymbols.length > 0) {
      return {
        symbols: apiSymbols,
        source: 'api',
        count: apiSymbols.length,
        fetchedAt: Date.now(),
      };
    }
    // Fallback: STOCK_META'daki 99 sembol
    const fallbackSymbols = Object.keys(STOCK_META);
    return {
      symbols: fallbackSymbols,
      source: 'fallback',
      count: fallbackSymbols.length,
      fetchedAt: Date.now(),
    };
  },
  ['bist-stock-whitelist'],
  { revalidate: 86400, tags: ['bist-stocks'] },
);

/**
 * Verilen sembolün BIST'te gerçekten var olup olmadığını kontrol et.
 * Build ve runtime'da 24 saatlik cache'i kullanır.
 */
export async function isKnownStockSymbol(symbol: string): Promise<boolean> {
  const result = await getWhitelist();
  return result.symbols.includes(symbol);
}

/**
 * Tüm bilinen sembollerin listesini döner.
 * generateStaticParams ve sitemap tarafından kullanılır.
 */
export async function getKnownStockSymbols(): Promise<string[]> {
  const result = await getWhitelist();
  return result.symbols;
}

/**
 * Whitelist kaynak meta (debug, monitoring, sitemap log için)
 */
export async function getWhitelistMeta(): Promise<{
  source: 'api' | 'fallback';
  count: number;
}> {
  const result = await getWhitelist();
  return { source: result.source, count: result.count };
}
