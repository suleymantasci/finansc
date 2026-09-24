# FinansÇözüm — "Finansal Atlas" yeniden tasarım raporu

Tarih: 24 Eylül 2026 · Branch: `redesign/finansal-atlas` (finansc) · `fix/borsa-son-fiyat` (tasci-api)
**Hiçbir şey push edilmedi, prod'a dokunulmadı.** Prod veritabanına yalnızca okuma yapıldı.

---

## 1. Test ortamı

| | |
|---|---|
| Site | http://72.62.93.150:3100 (prod derleme, standalone) |
| Backend | 127.0.0.1:3101 — bu branch'in backend'i, **`finanscozum_dev`** kopya veritabanına bağlı |
| Test kullanıcısı | `test1-fav@example.com` / `YeniSifre123` (normal) |
| Test admin | `test2-fav@example.com` / `Test12345!` (admin) |

- Canlı fiyatlar prod tasci-api'den gelir. tasci-api düzeltmesi (bkz. 4.1) deploy edilene kadar **hisse "son fiyat" değerleri hâlâ ağırlıklı ortalamadır.**
- Test sunucusu HTTP/1.1'dir. Prod HTTP/2 olduğu için canlıda bağlantı sınırı sorunu yaşanmaz (bkz. 4.4).

---

## 2. Tasarım

### Tasarım dili (design-dna yöntemiyle)
Referans görsellerin renkleri gözle değil, `design-dna` ölçüm betiğiyle ölçüldü. Referans zemini `#030a11`, vurgusu `#ddb16d`. Koyu tema bu karaktere göre korundu.

- **Tipografi:** Başlıklarda Newsreader (serif, italiksiz). Gövde ve rakamlarda Geist; rakamlar tabular hizalı. Türkçe glifler için latin-ext yüklendi.
- **Kart dili:** `atlas-card` (hairline çizgi, katman), serif başlıklar, oklu altın CTA'lar.
- **Biçimler:** Türkçe yüzde (`+%1,23`, `-%5,61`) ve virgüllü ondalık tüm sitede tutarlı.

### Açık tema araştırması ve kararı
Göz yorgunluğunun üç sebebi vardı:
- Sarımsı kâğıt zemin (`#f5f2ea`)
- Film grain dokusu
- Bej ve düşük kontrastlı çizgiler

TradingView ve Investing'in açık temaları incelendi; ortak nokta nötr zemin, saf siyah olmayan metin ve ince gri çizgi. Uygulanan palet:

| | Eski | Yeni |
|---|---|---|
| Zemin | #f5f2ea | #f4f4f1 |
| Kart | #fffdf8 | #ffffff (+ çok hafif gölge) |
| Metin | #16140f | #24262a |
| Çizgi | #e3ddd0 | #e2e2dd |
| Grain | var | yok |

Tüm metin çiftleri WCAG AA kontrast eşiğini geçiyor (hesaplanarak doğrulandı).

### Kaldırılan "AI slop" öğeleri
- Şeritteki "Canlı piyasa" yazısı ve yeşil nokta
- Yanıp sönen durum noktaları
- Emojiler (👋, 💳, 🏠 …)
- "Canlı veri" etiketleri
- Kalın sol çizgili gradyan kutular

### Sayfalar
Tüm sayfalar yeni dile taşındı ve her biri 390px ile 1440px genişlikte ekran görüntüsüyle denetlendi. **Hiçbir sayfada yatay taşma yok ve her sayfada tek H1 var.**

- Ana sayfa
- Listeler: Altın, Döviz, Borsa (hisse ve endeks sekmeleri), Emtia (yeni), Araçlar, Blog
- Detaylar: Altın, döviz, hisse, endeks, emtia; referans görsel 3'e göre ortak şablon
- Araç sayfaları (43), blog yazısı, enflasyon (3 sayfa), altın miktar ve adet sayfaları
- Statik sayfalar, giriş, kayıt, şifremi unuttum, şifre sıfırla (yeni), hesabım, favoriler, admin, 404

**Detay şablonu (`components/instrument/`):**
- Serif başlık ve favori butonu
- Büyük canlı fiyat
- TradingView tarzı grafik: alan/mum, hacim, son fiyat etiketi
- Kaynaklara göre fiyat tablosu
- Çevirici
- İlgili liste
- "Nedir?" bloğu ve SSS (FAQPage)

---

## 3. Kapsam: her enstrümanın sayfası ve grafiği

| | Önce | Şimdi |
|---|---|---|
| Altın türü | 10 | **17** (Has, 14/18 ayar, Beşli, İkibuçuk, Reşat, Hamit eklendi) |
| Döviz | 8 | **55** (serbest piyasa + TCMB) |
| Endeks | 10 (+ doğrulamasız) | **105**, gerçek listeye karşı doğrulanıyor |
| Hisse | 634 | 633 (sahte `code` kaydı temizlendi) |
| Emtia | yok | **16** (Brent, WTI, doğalgaz, ons gümüş, platin, gram platin, paladyum, altın/gümüş oranı, bakır, buğday, mısır, soya, kahve, kakao, şeker, pamuk) |

Bu sayfaların hepsi şu kanallarla birbirine bağlandı:
- Menü, footer ve hızlı erişim dizini
- Ctrl+K araması: 55 döviz, 17 altın, 16 emtia, 43 araç, hisse ve endeksler
- İlgili listeler, sitemap ve llms.txt

**Doğrulama:** Sitemap'teki 1.052 URL'nin, `llms-full.txt`'deki 890 URL'nin ve kaynak koddaki 83 sabit iç linkin hepsi 200 döndü.

**Favoriler:** Altın, döviz, hisse, endeks, emtia ve hesaplama aracı favorilere eklenebiliyor. Arayüzden uçtan uca test edildi: ekle, listele, sil, çıkış.

---

## 4. Bulunan ve düzeltilen hatalar

### 4.1 Veri doğruluğu (en kritik)

| Bulgu | Etki | Düzeltme |
|---|---|---|
| **tasci-api hisse "son fiyat" olarak gün içi ağırlıklı ortalamayı veriyordu.** Kaynağın kendi başlık satırı `…\|b\|a\|wa\|…`; `wa` = işlem hacmi ₺ / lot ile doğrulandı. | Sitedeki **tüm hisse fiyatları** yanlıştı. THYAO 299,94 görünüyordu, gerçek son fiyat 298,50. | `lastPrice` = `l` alanı; ağırlıklı ortalama ayrı alan. **tasci-api `fix/borsa-son-fiyat`** |
| `change` alanı yüzdenin kopyasıydı (hisse ve endeks) | Mutlak değişim yanlıştı | TL/puan farkı olarak hesaplanıyor |
| Kaynağın başlık satırı sahte `code` hissesi ve endeksi üretiyordu | llms.txt'de kırık link | Ayıklanıyor |
| JPY: serbest piyasa 1 yen, TCMB ve geçmiş veri 100 yen üzerinden | Yen grafiği boştu; TCMB değeri 100 kat görünüyordu | Ölçek ve "100 JPY" etiketi |
| CHF sayfası boştu (API "Frankı", kod "Frangı" arıyordu) | Veri yoktu | Kayıt defteri API adlarıyla doğrulandı (55/55) |
| Döviz listesinde "Reeskont" satırları tekrar ediyordu | Mükerrer kur | Ayıklandı |
| TÜFE "2003'ten bugüne" deniyordu | Veri Ocak 2005'te başlıyor | Düzeltildi (ÜFE 2003 doğru) |
| Enflasyon "TCMB resmi verisi" deniyordu | Açıklayan kurum TÜİK | "TÜİK verileri, TCMB üzerinden" |
| "X gram altınla Y çeyrek alınır" ağırlıkla hesaplanıyordu | Çeyrek 22 ayar ve işçilikli; yanlış eşdeğerlik | Fiyattan "değerce" hesap |
| "Ziynet altında KDV muafiyeti" iddiası | Doğrulanamadı; istisna külçe altın için | Kaldırıldı |
| Gremse 18,15 g (altın sayfası 17,5 g diyordu) | Tutarsızlık | 17,5 g |
| Miktar sayfası "aylık performans" vaat ediyordu ama göstermiyordu | Yanıltıcı | 1 aylık gram altın grafiği eklendi |
| Blog JSON-LD her yazıyı TCMB ve BIST'i kaynak gösteriyormuş gibi işaretliyordu | Sahte kaynak | Kaldırıldı |
| Editör ekibi JSON-LD'de ekipler `Person` (kişi) olarak işaretliydi | Yanıltıcı yapılandırılmış veri | Departman (`Organization`) |
| "Tüm hesaplamalar reklamsız", "42 araç" | Sitede reklam var; araç sayısı 43 | Düzeltildi |
| Emtia birimleri | — | Büyüklük ve çapraz hesapla doğrulandı (ör. platin gram = ons ÷ 31,1035 × USD/TRY, API ile birebir) |

### 4.2 Güvenlik

| Önem | Bulgu | Düzeltme |
|---|---|---|
| **Yüksek** | Oturum açmamış biri `/api/blogs?status=draft` ile **taslak yazıları listeleyebiliyor, slug ile tam içeriğini okuyabiliyordu** | Yalnızca admin görür; herkese açık rotalarda opsiyonel kimlik |
| **Yüksek** | **XSS:** `/arama?q=</script>…` JSON-LD içinden script enjekte edebiliyordu. Blog başlıkları gibi veritabanı içeriği de aynı risk altındaydı. | Tüm JSON-LD `safeJsonLd` ile |
| **Yüksek** | Blog içeriği ham HTML basılıyordu. Veritabanında gömülü `<script>` ve tam `<html>` belgesi içeren yazılar vardı. | `sanitize-html` izin listesi (test: script, onclick, onerror ve javascript: linkleri atılıyor) |
| **Yüksek** | Backend'de `trust proxy` yoktu. **İstek sınırı bütün ziyaretçiler için tek kova gibi çalışıyordu:** dakikada ~100 istekten sonra herkes 429 alıyordu (prod'da ölçüldü: 98×200 ardından 32×429). | `trust proxy` açıldı; okuma uçlarında sınır yok |
| Orta | Giriş için dakikada 100 deneme (kaba kuvvet) | Giriş 10/dk, kayıt 5/10dk, token yenileme 30/dk |
| Orta | Çıkış sunucudaki yenileme token'ını iptal etmiyordu | İptal ediliyor (DB'de doğrulandı) |
| Orta | Şifre sıfırlama uç noktası yoktu; sayfa ham 404 gösteriyordu | Tam akış (bkz. 5) |
| Düşük | `X-XSS-Protection: 1` eskimiş, CSP ve HSTS yok | CSP (frame-ancestors, base-uri, object-src, form-action), HSTS, XSS başlığı 0 |
| Düşük | `/api/og` ve `/api/search` girdileri sınırsızdı | Uzunluk sınırı |
| Bilgi | Admin API'leri normal kullanıcıya 403 veriyor (test edildi); arama sorgusu parametreli, SQL enjeksiyonu yok | — |

**Henüz yapılmayan:** Erişim token'ı `localStorage`'da tutuluyor. XSS açıkları kapatıldı, ama daha sağlam yol httpOnly çerez kullanmak. Bu hem backend'i hem istemciyi değiştiren ayrı bir iş.

### 4.3 SEO / GEO

- **Blog 404'leri:** Blog sayfası her geçici API hatasını 404 + noindex yapıyordu. Rate limit sorunuyla birleşince, Googlebot yoğun taradığında var olan yazılar "bulunamadı" görünüyordu. Artık yalnızca gerçek 404'te; ilgili yazılar isteğinin hatası ana yazıyı düşürmüyor.
- **`robots.txt` paylaşım görsellerini engelliyordu:** `/api/og` engelliydi; X ve Facebook önizlemelerinde görsel çıkmıyordu. İzin verildi.
- **Kırık linkler:**
  - llms.txt: var olmayan 12 araç linki vardı; artık her şey gerçek listelerden üretiliyor.
  - Arama sonucundaki hisse linkleri 404'tü (küçük harf).
  - Kayıt formundaki gizlilik linki kırıktı (`/gizlilik-politikasi`).
- **Kopya içerik:** `/doviz/ons-altin` ile `/altin/ons-altin` aynı içeriği yayınlıyordu → 308 yönlendirme.
- **Soft-404:** Endeks sayfaları var olmayan sembollerde de içerik üretiyordu → gerçek listeye karşı doğrulanıyor.
- **Hesap sayfaları:** `X-Robots-Tag: noindex` eklendi; `SearchAction` doğru arama sayfasını gösteriyor.
- **Metadata:** İletişim sayfasına eklendi; uzun açıklamalar 160 karakterin altına indirildi; yeni sayfalara ItemList/FAQPage şemaları eklendi.
- **Alıntılanabilir özetler:** Detay sayfalarındaki "X nedir?" blokları ve `speakable` işaretleri.
- **E-posta ve sosyal profiller:** Adresler `info@finanscozum.net` olarak birleştirildi (`.com` adresleri karışıktı). Ölü LinkedIn profili `sameAs` listesinden kaldırıldı.

### 4.4 Altyapı ve performans

- **Favoriler hiç çalışmıyordu:** Entity vardı ama modül ve tablo yoktu. Modül, migration ve sahiplik kontrolü eklendi.
- **Migration'lar prod'da otomatik çalışmıyordu:** Yol yanlıştı (`dist/database/database/migrations`). Düzeltildi. Kopya DB'de otomatik çalıştığı doğrulandı.
- **Sayfa başına 9-10 kalıcı bağlantı açılıyordu:** HTTP/1.1'de tarayıcının 6 bağlantı sınırı sayfa geçişlerini kilitliyordu. Düzeltildi:
  - Tek birleşik akış: `/api/market/stream` (borsa + altın + serbest piyasa + TCMB).
  - Kaynak tablosu REST ile yokluyor.
  - Grafik canlı akışı sadece saatlik görünümde açılıyor.
- **`API_INTERNAL_URL`:** SSR istekleri Traefik yerine iç ağdan backend'e gidiyor; `docker-compose.yml`'a eklendi.

---

## 5. Şifre sıfırlama (yeni)

- `POST /api/auth/forgot-password`: her durumda aynı yanıt; hesabın varlığı sızdırılmaz.
- `POST /api/auth/reset-password`: 32 bayt token; veritabanında yalnızca SHA-256 özeti; 30 dakika geçerli ve tek kullanımlık. Başarılı sıfırlamada tüm oturumlar iptal edilir.
- E-posta mevcut SMTP ayarlarıyla gönderiliyor; bağlantı `/sifre-sifirla?token=…` sayfasına gidiyor.
- Test sonuçları:
  - Aynı token ikinci kez reddediliyor.
  - Yeni şifre çalışıyor, eski şifre reddediliyor.
  - Dördüncü istek 429 alıyor.

---

## 6. Deploy sırası ve kontrol listesi

1. **tasci-api:** `fix/borsa-son-fiyat` branch'ini main'e merge edip imajı yeniden oluşturun. Hisse fiyatları bu adımla düzelir.
2. **finansc backend:**
   - İlk açılışta iki migration otomatik çalışır: `favorites` ve `password_reset_tokens`. Log'da görüldüğünü doğrulayın.
   - İsteğe bağlı: `SITE_URL=https://finanscozum.net` env değişkeni; sıfırlama linkleri için, yoksa CORS'taki ilk adres kullanılır.
3. **finansc client:** `docker-compose.yml`'daki `API_INTERNAL_URL=http://finansc-backend:3001` değişkenini sunucudaki compose dosyasına da ekleyin.
4. **Deploy sonrası doğrulama:**
   - `curl https://api.finanscozum.net/api/blogs?status=draft` yalnızca yayınlanmış yazıları döndürmeli.
   - Bir hisse sayfasında son fiyat, alış-satış aralığında olmalı.

### Test ortamını temizlemek için
```bash
docker exec postgres dropdb -U postgres finanscozum_dev
```
Test süreçleri: 3100 (client) ve 3101 (backend) portlarındaki `node` süreçlerini durdurmanız yeterli.

---

## 7. İçerik ve veritabanı önerileri (dokunulmadı)

- **Blog kategorileri tutarsız:** "Finans" ve "finans", "Kredi" ve "kredi" ayrı kayıtlı; ayrıca serbest metin "Finansal Okuryazarlık" var. Filtre birebir eşleştiği için bu yazılar kategori sayfasında çıkmıyor. Öneri:
  ```sql
  UPDATE blogs SET category = lower(category) WHERE category <> lower(category);
  UPDATE blogs SET category = 'yatirim' WHERE category = 'finansal okuryazarlık';
  ```
- **Bozuk içerik:** `kredi-karti-taksit-stratejileri-2026` içinde tam bir HTML belgesi, `altin-gram-fiyati-neden-degisir-2026` içinde gömülü bir script var. Ön yüz temizliyor, ama kaynağın düzeltilmesi iyi olur.
- **İçerikte H1:** 6 yazıda içerik içinde `<h1>` var (ön yüz H2'ye çeviriyor).
- **Sosyal profiller:** X ve Facebook profilleri her kullanıcı adı için 200 döndüğünden size ait olduğu doğrulanamadı. Değilse `layout.tsx` içindeki `sameAs` listesinden çıkarın.
- **Aynı fiyatlar:** Ata, Reşat ve Hamit altın serbest piyasa kaynağında birebir aynı fiyatla geliyor. Bu kaynaktaki gerçek veri, uydurma değil.

---

## 8. Commit'ler

finansc (`redesign/finansal-atlas`):
```
9f83005 fix: taslak blog sızıntısı, güvenlik başlıkları, içerik ve biçim tutarlılığı
7ff18d4 feat: listeler, blog, hesap, şifre sıfırlama, birleşik akış; içerik doğruluğu
f5415fc fix: güvenlik, favoriler, rate limit, blog, SEO/GEO
1124325 feat: site geneli tasarım + ortak detay şablonu
5e1632b feat(anasayfa): açık tema hero ve araç kartı görselleri
04cebae fix(anasayfa): revizyon 1 — font, CTA linkleri, enflasyon grafiği, palet
6df0eb1 feat(anasayfa): "Finansal Atlas" yeniden tasarımı
```
tasci-api (`fix/borsa-son-fiyat`): `bab017a fix(borsa): son fiyat yerine ağırlıklı ortalama veriliyordu`

---

## 9. Hazırlatmanız gereken görseller

Dosyaları `client/public/atlas/` altına bu adlarla koymanız yeterli. Kod dosyanın varlığını kendisi kontrol ediyor; görsel yoksa başlık görselsiz görünür.

Detay sayfası başlık görselleri için hepsinde ortak kural:
- **Boyut:** 1600×1000 px, WebP.
- **Konum:** Başlığın sağ %46'sında durur; solu kart rengine doğru solar.
- **Kompozisyon:** Öznenin sağda ve ortada olması, sol üçte birin boş ve koyu olması gerekir.

**1. `detail-altin.webp`**
```
Cinematic dark still life for a luxury finance website header, 16:10. Stacked 24k gold bars
and a few gold coins on a dark slate surface, warm amber rim light (#D4A94F), deep ink-black
background (#0A0B0D), subject on the RIGHT half, LEFT third empty and dark for text overlay,
shallow depth of field, subtle film grain, premium, no text, no logos, no watermark.
```

**2. `detail-doviz.webp`**
```
Cinematic dark still life, 16:10. A fan of international banknotes (dollar, euro, pound)
slightly out of focus with a brass desk globe, warm gold rim light, ink-black background,
subject on the RIGHT, LEFT third empty and dark, shallow depth of field, premium editorial,
no readable text, no logos.
```

**3. `detail-borsa.webp`**
```
Dark cinematic scene, 16:10. A trading floor at night seen through glass, blurred green and
red candlestick screens as bokeh, a bronze bull figurine silhouette in the foreground right,
warm amber accents, ink-black background, LEFT third empty and dark, no readable text.
```

**4. `detail-emtia.webp`**
```
Dark cinematic still life, 16:10. Raw commodities arranged on dark stone: a copper ingot,
silver bar, a small pile of wheat grains and coffee beans, a glass vial of crude oil,
warm amber rim light, ink-black background, subjects on the RIGHT, LEFT third empty,
premium editorial, no text.
```

**5. `og-default.png` — 1200×630 px, `client/public/` kökünde; mevcut dosyanın yerine.** Varsayılan paylaşım görseli, yeni kimlikle uyumlu olacak.
```
Minimal brand card 1200x630. Ink-black background (#0A0B0D) with very subtle grain, a thin
gold (#D4A94F) circular mark with two horizontal bars on the left (like a stylised ₺/€),
large elegant serif wordmark "FinansÇözüm" in off-white (#ECE8DF) with "Çözüm" in gold,
below it small sans text "Canlı altın · döviz · borsa · 40+ hesaplama aracı",
faint gold candlestick line art on the right edge. Clean, premium, lots of negative space.
```

**6. İsteğe bağlı:** `hero.webp` ve `hero-light.webp` dosyalarının 2400×1200 sürümleri. Mevcutlar 1376×768; retina ekranlarda hafif yumuşak görünüyor.
