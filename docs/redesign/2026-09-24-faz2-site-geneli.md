# Faz 2 — Site geneli "Finansal Atlas" uyarlaması

Branch: `redesign/finansal-atlas`

## Bulgular (başlangıç)
- Favoriler: backend'de yalnızca entity var; controller/servis/modül yok, DB'de tablo yok → `/api/favorites` 404. Client alan adları entity ile uyuşmuyor.
- Emtia: canlı akış yok; `/api/history` üzerinden 34 emtia enstrümanı (günlük kapanış, güncel) mevcut.
- tasci-api kaynağı: hermes workspace `tasci-api/` (canlı altın/döviz/borsa/TÜFE/ÜFE scraper).

## Fazlar
1. **Global:** şerit etiketini kaldır, açık tema paletini yeniden tasarla (göz yorgunluğu), `ui/` bileşenlerini yeni dile taşı, ortak `PageHeader`.
2. **Detay şablonu** (referans görsel 3): `InstrumentDetail` — büyük fiyat, grafik, çevirici/ilgili liste, SSS, tablo. Altın, döviz, hisse, endeks, emtia.
3. **Listeleme:** altın, döviz, borsa (hisseler/endeksler), emtia (yeni), araçlar, blog, enflasyon, arama.
4. **Statik + auth + hesabım + admin.**
5. **Favoriler:** backend modülü + migrasyon (gold/stock/index/currency/commodity/tool), client store, her detay/araç sayfasında buton, hesabım/favoriler.
6. **Blog içerik stili:** prose, tablolar (yatay kaydırma), görseller, kod, alıntı; mobil.
7. **SEO/GEO + güvenlik:** metadata/canonical/OG her sayfa, JSON-LD, sitemap (emtia dahil), llms.txt, güvenlik başlıkları (CSP), blog HTML sanitizasyonu.
8. **Doğrulama:** tsc, build, tüm sayfalarda 390/768/1440 taşma + ekran görüntüsü, veri doğruluğu kontrolü.
9. **Rapor:** `docs/redesign/RAPOR.md`.
