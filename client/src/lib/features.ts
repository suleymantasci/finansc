/**
 * Özellik bayrakları.
 *
 * BORSA_ENABLED: Borsa İstanbul (hisse/endeks) verisi sitede gösterilmez.
 * Kod yerinde duruyor; false iken /borsa sayfaları 410 döner (proxy.ts),
 * menü/ana sayfa/kayan yazı/arama/sitemap borsa içeriği üretmez ve
 * BIST verisi için istek atılmaz. Geri açmak için backend'deki
 * MARKET_BORSA_ENABLED ve tasci-api'deki BORSA_PUBLIC bayrakları da açılmalı.
 */
export const BORSA_ENABLED = false;
