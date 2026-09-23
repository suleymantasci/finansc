# Finansal Atlas — Ana Sayfa Yeniden Tasarımı (Faz 1)

Branch: `redesign/finansal-atlas` · Referans: 3 adet ChatGPT görseli (masaüstü ana sayfa, mobil ana sayfa, Gram Altın detay)

## Hedef
Awwwards kalitesinde, editoryal + terminal hissi veren, ama aranan şeyin **tek tıkla** bulunduğu ana sayfa.
Canlı veri mevcut SSE akışları ve `/api/history` üzerinden gelir. SEO/GEO sinyalleri korunur, güçlendirilir.

## Tasarım dili
| Token | Koyu | Açık |
|---|---|---|
| Zemin | `#0A0B0D` mürekkep | `#F5F2EA` kâğıt |
| Kart | `#111317` | `#FFFFFF` |
| Çizgi | `#22252B` | `#E3DDD0` |
| Vurgu (altın) | `#D4A94F` | `#86641C` (AA) |
| Yükseliş | `#22C38E` | `#0E7A52` |
| Düşüş | `#F0595E` | `#C23B36` |

- Başlık: **Instrument Serif** (latin-ext → ş, ğ, ı, İ). Gövde: Geist (latin-ext eklendi). Rakamlar: Geist, `tabular-nums` (tablo hizalı, orantılı görünüm).
- Hairline çizgiler, çok hafif grain, kartlarda iç parıltı; gölge yerine katman.
- Rakam geçişleri `@number-flow/react`. Hareket `prefers-reduced-motion`'a saygılı.

## Sayfa yapısı
1. **Canlı şerit** (global): CANLI PİYASA noktası + USD, EUR, Gram Altın, BIST 100, Ons, GBP — sabit dizilim, dar ekranda yatay kaydırma (okunabilirlik > marquee).
2. **Header** (global): logo işareti + serif wordmark, nav, ⌘K arama tetikleyici, tema anahtarı.
3. **Hero**: H1 = anahtar kelimeli üst satır + büyük serif slogan. Komut paleti tarzı arama (statik indeks, anında öneri, ↑↓/Enter), hızlı çipler. Sağda sanat alanı (görsel gelene kadar SVG kompozisyon).
4. **Piyasa bento**: Gram Altın (alan grafik + aralık sekmeleri) · USD/TRY + EUR/TRY (sparkline) · BIST 100 (mum grafik) · Kredi hesaplayıcı (slider, BSMV+KKDF dahil).
5. **Araç bento**: Maaş net/brüt (gerçek motor: `maas-engine`) · Altın vs Enflasyon reel getiri (TÜFE + gram altın yıllık) · Araç dizini kartı.
6. **Hareket Edenler**: Yükselenler / Düşenler / En Çok İşlem sekmeleri, likit hisseler (işlem hacmi ilk 150), gün içi aralık çubuğu.
7. **Bilgi Merkezi**: sunucuda render edilen son 3 yazı (SEO).
8. **Hızlı Erişim dizini + SSS** (FAQPage JSON-LD, GEO için alıntılanabilir kısa cevaplar).
9. **Footer** + **mobil alt bar** (Ana Sayfa, Piyasalar, Araçlar, Ara, Bilgi).

## Teknik kararlar
- Test ortamı: `next dev -p 3100`. Canlı API CORS'u sadece prod origin'e açık → `NEXT_PUBLIC_API_URL` test sunucusunun kendisi, `/api/*` rewrite hedefi `API_PROXY_TARGET=https://api.finanscozum.net`.
- Grafikler bağımlılıksız SVG (mevcut PriceChart felsefesi).
- Tasarım token'ları `globals.css`'te; tüm site yeni paleti otomatik alır (diğer sayfalar Faz 2'de ayrıca revize edilecek).

## Doğrulama
- `tsc --noEmit`, `next build`
- Koyu/açık tema, 390px / 768px / 1440px ekran görüntüsü
- Erişilebilirlik: klavye ile arama, odak halkaları, kontrast, `aria-live` fiyatlar
- Metadata: title/description/canonical/OG korunuyor, H1 tek
