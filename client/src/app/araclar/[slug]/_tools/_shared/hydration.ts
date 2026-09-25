/**
 * Araç sayfaları statik üretilir; sunucu URL parametrelerini görmez. Araçların read*FromUrl()
 * fonksiyonları render sırasında window.location okursa ilk (hydration) çizim sunucudan farklı olur:
 * React #418 hatası ve URL'deki değerlerin görünmemesi. Bayrak kalkana kadar okuyucular varsayılan
 * değerleri döndürür; ToolClient yüklenince bayrağı kaldırıp aracı yeniden kurar ve URL okunur.
 */
let hydrated = false;

export function markToolHydrated() {
  hydrated = true;
}

export function isToolHydrated() {
  return hydrated;
}
