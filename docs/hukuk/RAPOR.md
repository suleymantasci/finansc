# FinansÇözüm — Hukuki Uyum ve Veri Kaynakları Raporu

**Tarih:** 24 Eylül 2026
**Kapsam:** Kurumsal/hukuki sayfalar, kişisel veri işleme (KVKK), çerezler, tanıtıcı bilgiler, pazarlama beyanları ve piyasa verilerinin toplanma yöntemi (tasci-api).

> Bu rapor kod ve sayfa incelemesine dayanan teknik bir uyum değerlendirmesidir; avukat görüşü değildir. Özellikle **Bölüm 3'teki veri kaynakları riski** ve **Bölüm 2'deki "sizin yapmanız gerekenler"** için bilişim/KVKK alanında çalışan bir avukata danışmanızı öneririm.

---

## 1. Özet

| # | Konu | Risk | Durum |
|---|------|------|-------|
| 1 | Alt bilgi ve borsa sayfalarında **"BISTECH Veri Dağıtım Sistemi kapsamında iletilmektedir… Kaynak: Borsa İstanbul A.Ş."** beyanı. Veri aslında mynet.com sayfasından kazınıyor; bu beyan BIST ile lisans ilişkisi varmış izlenimi veriyor. | **Yüksek** | ✅ Düzeltildi |
| 2 | Google Analytics **izinsiz** yükleniyordu (çerez onayı yoktu). | **Yüksek** | ✅ Düzeltildi |
| 3 | Gizlilik metni KVKK md.10 aydınlatma şartlarını karşılamıyordu; "üçüncü taraflarla paylaşılmaz" ifadesi yanlıştı (Google, barındırma, e-posta). | **Yüksek** | ✅ Düzeltildi |
| 4 | **Tüm üyelik verileri yurt dışında** (Hostinger, Almanya) — KVKK md.9 yurt dışı aktarım yükümlülükleri yerine getirilmemiş. | **Yüksek** | ⚠️ Sizin işleminiz gerekli |
| 5 | Sitede **işletenin kimliği ve adresi yok** (5651 md.3, KVKK md.10, 6563 md.3). | **Orta–Yüksek** | ⚠️ Sizin bilginiz gerekli |
| 6 | Piyasa verilerinin rakip sitelerden otomatik toplanması (haksız rekabet, veri tabanı hakkı, BIST/LBMA lisansı). | **Yüksek** | 📋 Karar sizde (Bölüm 3) |
| 7 | Editör Ekibi/Kaynak/Düzeltme sayfalarında **gerçeği yansıtmayan süreç iddiaları** (editöryal inceleme, çapraz kontrol alarmı, saatlik düzeltme süreleri). Yazılar yapay zekâyla üretilip otomatik yayınlanıyor. | Orta | ✅ Düzeltildi |
| 8 | Kullanım şartlarında geçersiz/yanlış hükümler (tüm içerik bize aittir; sınırsız sorumsuzluk; hukuk/yetki yok). | Orta | ✅ Düzeltildi |
| 9 | Kayıt formunda aydınlatma metninin "kabul" ettirilmesi (aydınlatma onaya bağlanamaz). | Orta | ✅ Düzeltildi |
| 10 | Kanıtlanamayan üstünlük iddiası ("Türkiye'nin en kapsamlı finans platformu"). | Düşük–Orta | ✅ Düzeltildi |
| 11 | Hesap silme özelliği yok; oturum anahtarı JavaScript'in okuyabildiği çerezde. | Düşük–Orta | 📋 Öneri |

---

## 2. KVKK, çerezler ve tanıtıcı bilgiler

### 2.1 Yapılan düzeltmeler

**Gizlilik Politikası ve KVKK Aydınlatma Metni** (`/gizlilik`) baştan yazıldı. KVKK md.10 ve Aydınlatma Tebliği'nin istediği unsurlar artık metinde var:
- **Veri sorumlusu:** kimlik ve iletişim.
- **Veri, amaç ve hukuki sebep:** her veri grubu için ayrı ayrı yazıldı.
  - Üyelik: md.5/2-c.
  - İletişim formu: md.5/2-c ve md.5/2-f.
  - Sunucu kayıtları: md.5/2-ç ve md.5/2-f.
  - Analitik: açık rıza, md.5/1.
- **Toplama yöntemi.**
- **Aktarılan alıcılar:** barındırma (Almanya), e-posta altyapısı, Google (yalnızca onayla), kamu kurumları. Yurt dışı aktarım açıkça belirtildi.
- **Saklama süreleri.**
- **md.11'deki dokuz hakkın tamamı.** Eski metinde dört hak vardı; bunlardan "işlemenin kısıtlanması" GDPR kavramıdır, KVKK'da yoktur.
- **Başvuru yolu, 30 günlük yanıt süresi ve Kurul'a şikâyet hakkı.**

**Çerez onayı:**
- Google Analytics artık yalnızca "Kabul et" seçilirse yükleniyor. Seçim yapılmadan Google'a tek bir istek bile gitmiyor; bunu test ettim.
- "Reddet" ve "Kabul et" butonları eşit ağırlıkta. KVKK Çerez Rehberi, reddetmenin kabul etmek kadar kolay olmasını istiyor.
- Onay geri alınınca `_ga` çerezleri siliniyor.
- Alt bilgiye **"Çerez tercihleri"** bağlantısı eklendi.
- `<head>` içindeki Google'a önceden bağlantı etiketleri kaldırıldı. Bu etiketler onaydan önce ziyaretçinin IP adresini Google'a iletiyordu.

**Çerez Politikası** (`/cerez-politikasi`) sayfası eklendi. Sitenin gerçekte kullandığı her çerez ve depolama anahtarı ayrı ayrı listelendi:
- `finanscozum-token`
- `finanscozum-role`
- `finanscozum-auth`
- `theme`
- `fc-consent`
- `_ga`

**Kayıt formu:**
- Onay kutusu yalnızca Kullanım Şartları için.
- Aydınlatma metni, onay kutusu olmadan bir bilgilendirme cümlesiyle gösteriliyor.
- Aydınlatma bir "kabul" değildir; hizmeti açık rızaya bağlamak da rızayı geçersiz kılar.

**İletişim formu:**
- Altına kısa bir aydınlatma notu eklendi.
- "Pazartesi–Cuma 09:00–18:00" çalışma saati iddiası "iş günlerinde e-posta ile dönüş" olarak değiştirildi.

**Künye:**
- Hakkımızda sayfasına künye bölümü eklendi.
- Tüm yasal sayfalar kimlik bilgisini tek bir dosyadan okuyor: `client/src/lib/legal.ts`.

### 2.2 ⚠️ Sizin yapmanız gerekenler

1. **Kimlik bilgilerini doldurun.** `client/src/lib/legal.ts` içindeki alanlar:
   - `name`: gerçek kişiyseniz ad-soyad, şirketseniz unvan.
   - `address`: açık adres.
   - `registry`: şirketse MERSİS no / vergi no.

   Şu an sayfalar kimlik yerine "finanscozum.net işletmecisi" yazıyor. Bu ifade şu yükümlülükleri **tam karşılamaz**:
   - 5651 sayılı Kanun md.3: içerik sağlayıcının tanıtıcı bilgilerini yayında tutması.
   - KVKK md.10: veri sorumlusunun kimliği.
   - Siteden reklam geliri elde edilirse 6563 sayılı Kanun md.3.

   Gerçek kişiyseniz ev adresi yerine iş/posta adresi, sanal ofis veya KEP adresi kullanılabilir.

2. **Yurt dışına aktarım (KVKK md.9).** 7499 sayılı Kanun'la 1 Haziran 2024'ten itibaren yeni sistem geçerli.
   - **Barındırma:** Sunucu Almanya'da; Türkiye için yeterlilik kararı yok. Bu durumda Kurul'un ilan ettiği **standart sözleşmenin** Hostinger ile imzalanması ve imzadan sonra **5 iş günü içinde Kurul'a bildirilmesi** gerekir.
   - **Pratik alternatif:** Sunucuyu Türkiye'deki bir sağlayıcıya taşımak. Bu, barındırma kaynaklı aktarım sorununu tamamen ortadan kaldırır.
   - **Google Analytics:** Açık rızayla çalışıyor. md.9'daki arızi aktarım istisnaları dar yorumlanıyor; en temizi Google ile de standart sözleşme veya Google'ın sunduğu veri işleme ekleri. Bunu avukatınızla netleştirin.

3. **Google Analytics ayarları.**
   - GA yönetim panelinde "Veri saklama" süresini **14 ay** ya da daha kısa yapın; gizlilik metni 14 ay diyor.
   - "Google sinyalleri" ve reklam kişiselleştirmesini kapalı tutun.

4. **VERBİS.** Yıllık çalışan sayısı 50'den az ve yıllık mali bilanço toplamı Kurul'un belirlediği eşiğin altında olan, ana faaliyeti özel nitelikli veri işlemek olmayan veri sorumluları kayıttan muaftır. Eşik Kurul kararlarıyla güncellendiği için güncel tutarı KVKK sitesinden kontrol edin. Muhtemelen muafsınız; şirketleşirseniz yeniden kontrol edin.

5. **Metinlerde verdiğimiz sözleri uygulayın.** Gizlilik ve kullanım şartlarındaki üç süreç sizin elle takip etmeniz gereken taahhütler:
   - Hesap silme talebinden sonra **30 gün içinde** silme.
   - Esaslı değişikliklerde kayıtlı kullanıcılara e-posta bildirimi.
   - KVKK başvurularına 30 gün içinde yanıt.

6. **AdSense açarsanız** çerez onayını genişletmek gerekir: reklam çerezleri için ayrı onay ve Google'ın istediği "sertifikalı CMP". Şu an AdSense etkin değil (canlı sitede ads.txt yok).

---

## 3. Veri kaynakları ve otomatik toplama (scraping) — risk analizi

### 3.1 Şu an ne yapılıyor

`tasci-api` servisi aşağıdaki sitelerden otomatik veri topluyor:

| Veri | Kaynak (gerçek) | Yöntem / sıklık |
|------|-----------------|-----------------|
| BIST hisse ve endeks fiyatları | `finans.mynet.com/borsa/canliborsa` | HTML kazıma, seans içinde 30 sn |
| Serbest piyasa döviz | `finans.mynet.com/doviz/serbestpiyasa` | HTML kazıma, 30 sn |
| TCMB kurları | `finans.mynet.com/doviz/merkezbankasi` (TCMB'nin kendisi değil) | HTML kazıma, 1 saat |
| Altın (Harem, Altınkaynak, Kapalıçarşı, Garanti, Akbank, serbest) | `altin.doviz.com/*` (kurumların kendi siteleri değil) | HTML kazıma, 30–60 sn |
| Grafik geçmişi | `haremaltin.com/ajax/cur/history`, `isyatirim.com.tr`, `canlidoviz.com`, mynet | Belgelenmemiş iç uç noktalar ve sayfalar |
| Ons altın/gümüş geçmişi | `prices.lbma.org.uk/json/*.json` | JSON |
| TÜFE/ÜFE, enflasyon hesabı | `tcmb.gov.tr`, `appg.tcmb.gov.tr` | HTML, 6 saatte bir / günlük |

Kazıyıcılar kendilerini bot olarak tanıtmıyor:
- İsteklerde **gerçek tarayıcı gibi görünen, dönüşümlü User-Agent** kullanılıyor.
- Harem geçmişi için önce `/grafik` sayfası çağrılıp oturum çerezi alınıyor.

Robots.txt kontrolü:
- Mynet'te taranan yollar `Disallow` değil.
- altin.doviz.com ve canlidoviz.com tümüyle `Allow`.
- İş Yatırım'da ilgili yollar yasaklı değil.

Yani robots.txt açısından açık bir ihlal yok. Ancak robots.txt bir izin sözleşmesi değildir; kullanım koşulları ve aşağıdaki kanunlar ayrıca geçerlidir.

### 3.2 Hukuki çerçeve ve riskler

**a) Haksız rekabet — TTK md.54–55 · risk: yüksek.**
- TTK md.55/1-c-3, "başkasının pazarlanmaya hazır çalışma ürünlerini, kendi emeğiyle uygun bir katkı sağlamaksızın teknik çoğaltma yöntemleriyle devralmak ve yararlanmak" eylemini açıkça haksız rekabet sayar.
- mynet, doviz.com, canlidoviz ve Harem'in grafik servisi **doğrudan rakip** finans siteleri. Onların topladığı, lisansladığı ve yayınladığı fiyatları otomatik olarak alıp aynı amaçla yayınlamak bu hükmün tipik örneğidir.
- Olası sonuçlar: tespit, men, **maddi-manevi tazminat** ve ihtiyati tedbir (sitenin ilgili bölümlerinin kapatılması).
- En olası senaryo önce ihtarname, ardından IP engeli.

**b) Veri tabanı hakkı — FSEK · risk: orta–yüksek.**
- Tek tek fiyatlar "olgu"dur ve telif koruması yoktur.
- Ancak FSEK, önemli yatırımla oluşturulmuş bir veri tabanının **tamamının veya esaslı bir bölümünün** sistematik olarak çoğaltılmasını yasaklama hakkını veri tabanı yapımcısına tanır.
- 30 saniyede bir tüm hisse listesini ya da yıllara uzanan fiyat geçmişini almak bu kapsama girebilir. Özellikle Harem, İş Yatırım ve canlidoviz'den alınan geçmiş seriler bu açıdan riskli.

**c) Borsa İstanbul verisinin yeniden yayını · risk: yüksek.**
- BIST piyasa verisi Borsa İstanbul'un lisansladığı ticari bir üründür. mynet bu veriyi BIST'ten (veya lisanslı bir dağıtıcıdan) lisansla alıp **kendi sitesinde** gösteriyor; bu lisans sizi kapsamaz.
- Gecikmeli verinin üçüncü taraf internet sitelerinde yayınının hangi koşullarda serbest olduğu BIST'in veri yayın politikasına bağlı. Bunu **doğrudan Borsa İstanbul Veri Yayın birimine sorarak teyit etmeniz** gerekir.
- Önceki metin "BISTECH Veri Dağıtım Sistemi kapsamında iletilmektedir, Kaynak: Borsa İstanbul A.Ş." diyerek **lisanslı yayıncı gibi görünüyordu**. Bu hem TTK md.55/1-a (işletme hakkında gerçeğe aykırı beyan) hem de BIST ile ayrı bir uyuşmazlık konusu olabilirdi. Beyan kaldırıldı; artık "kamuya açık kaynaklardan derlenir, en az 15 dakika gecikmelidir, Borsa İstanbul A.Ş. ile bağlantılı değildir" deniyor.

**d) LBMA fiyatları · risk: orta.**
- LBMA Gold/Silver Price'ın yöneticisi ICE Benchmark Administration'dır (IBA). LBMA sitesindeki fiyatlar genel bilgi amaçlı sunuluyor; ticari bir sitede yeniden yayını için lisans IBA'dadır.
- Kullanım koşullarını kontrol edin. Gerekirse ons geçmişini lisanssız bir kaynağa geçirin; örneğin yalnızca kendi topladığınız günlük kapanışlar.

**e) Marka kullanımı · risk: düşük–orta.**
- "Harem Altın", "Garanti BBVA", "Akbank" gibi adları fiyatın hangi piyasaya ait olduğunu belirtmek için kullanmak genelde tanımlayıcı kullanım sayılır.
- Ancak fiyatların bu kurumlardan değil **doviz.com'dan** geldiği bilinmeden "kaynak: Akbank" demek yanıltıcıydı.
- Metinler "bu piyasaların kamuya açık fiyat yayınlarından derlenir; bu kurumlarla ortaklığımız yoktur" şeklinde düzeltildi.

**f) Bilişim suçları — TCK md.243–244 · risk: düşük.**
- Herkese açık sayfaları okumak "sisteme hukuka aykırı girme" sayılmaz.
- Ancak şu durumlar riski artırır:
  - Kendini gizleme (sahte tarayıcı kimliği, dönüşümlü User-Agent).
  - Belgelenmemiş iç uç noktaları çağırma.
  - Karşı tarafın koyacağı bir engeli (IP bloğu, CAPTCHA) **aşmaya çalışma**. Bunu kesinlikle yapmayın.
- Karşı taraf erişimi açıkça engellerse kazımayı durdurmak gerekir.

**g) Kullanım koşulları (sözleşme).** mynet, doviz.com ve İş Yatırım gibi sitelerin kullanım koşulları genellikle otomatik erişimi ve ticari yeniden yayını yasaklar. Sitelerin güncel koşullarını tek tek okumanızı öneririm; ben bu metinleri incelemedim.

**h) TCMB ve TÜİK verileri · risk: düşük.** TCMB kurları ve enflasyon verileri kamu verisidir; kaynak gösterilerek kullanılabilir. Ancak TCMB kurunu da şu an **mynet üzerinden** alıyorsunuz. Doğrudan TCMB'nin `today.xml` dosyasına ya da EVDS API'sine geçmek hem daha doğru hem de riski sıfırlar.

### 3.3 Öneriler (öncelik sırasıyla)

1. **Hemen (yapıldı):** Lisans ve ortaklık izlenimi veren tüm beyanlar kaldırıldı; kaynaklar dürüstçe "kamuya açık yayınlardan derlenir" diye anlatılıyor.
2. **Kısa vade, düşük maliyet:**
   - TCMB kurlarını doğrudan TCMB'den (`https://www.tcmb.gov.tr/kurlar/today.xml`) veya EVDS API'sinden alın.
   - Enflasyon için EVDS kullanın.
   - Kazıyıcıların User-Agent'ını dürüst bir bot kimliğiyle değiştirin (ör. `FinansCozumBot/1.0 (+https://finanscozum.net/iletisim)`). İstek sıklığını mümkün olduğunca düşürün.
3. **BIST için:** Borsa İstanbul'a veya lisanslı bir veri dağıtıcısına gecikmeli veri yayın lisansının koşullarını sorun. Yanıta göre ya lisans alın ya da BIST fiyatlarını yalnızca lisanslı bir sağlayıcının API'si üzerinden gösterin.
4. **Altın ve döviz için:** Kuyumcu/döviz fiyatı sağlayan lisanslı API'lerden birine geçmeyi veya fiyatını aldığınız kaynakla **yazılı izin/iş birliği** yapmayı değerlendirin. doviz.com, canlidoviz ve mynet rakip olduğu için en yüksek risk bunlarda.
5. **Geçmiş seriler:** Harem, İş Yatırım ve canlidoviz'den toplu geçmiş çekimini durdurun. Kendi kaydettiğiniz günlük kapanışlarla ve TCMB/EVDS gibi açık kaynaklarla devam edin.
6. **İhtarname gelirse:** İlgili kaynaktan veri çekmeyi derhal durdurun ve bir avukata danışın. Hızlı durdurma, tazminat riskini belirgin biçimde azaltır.

---

## 4. Diğer sayfalarda yapılan düzeltmeler

| Sayfa | Önce | Sonra |
|-------|------|-------|
| **Kullanım Şartları** | "Tüm içerikler FinansCozum'a aittir"; "doğrudan veya dolaylı hiçbir zarardan sorumlu değildir"; bildirim yapılmadan değişiklik; uygulanacak hukuk yok | Piyasa verileri üzerindeki hakların kaynaklara ait olduğu belirtildi. Sorumluluk "mevzuatın izin verdiği ölçüde; kast ve ağır ihmal ile tüketici hakları hariç" şeklinde sınırlandı (TBK md.115: kast ve ağır ihmalde önceden sorumsuzluk anlaşması kesin hükümsüzdür). Esaslı değişiklik üyelere e-postayla bildirilir. Türk hukuku uygulanır; Tüketici Hakem Heyeti ve Tüketici Mahkemesi yetkilidir. Üyelikten çıkış yolu eklendi. "Aracı kurum değildir, SPK lisanslı yatırım danışmanlığı değildir" açıklaması eklendi. |
| **Kaynak Politikası** | "Harem Altın İstanbul Kuyumcular Odası verilerine dayalı", "1–3 saniye canlı", "TCMB günde 5 yayın (10:30…)", "BIST anlık", "resmî kurum verileri her zaman öncelikli", "anomali durumunda kaynak değiştirilir", "TÜİK işsizlik verisi" | Gerçek toplama yöntemi ve sıklıklar yazıldı (30/60 sn, BIST en az 15 dk gecikmeli). TCMB kurlarının her iş günü 15.30'da ilan edildiği belirtildi. Uygulanmayan kontrol iddiaları çıkarıldı. |
| **Editör Ekibi** | "Uzman kadromuz", "her içerik editöryal incelemeden geçer", "birden fazla bağımsız kaynaktan doğrulanır" | Yazıların yapay zekâ araçları desteğiyle hazırlandığı açıkça belirtildi. Uygulanmayan inceleme iddiaları çıkarıldı. |
| **Düzeltme Politikası** | "Çapraz kontrol alarmı", "2–4 saat / 4–12 saat / 12–24 saat" süre taahhütleri, "ana sayfada durum bildirimi", "güncelleme geçmişi, editör adı" | Mevcut olmayan özellikler çıkarıldı. Süreler "hedef: 2 / 5 iş günü" olarak gerçekçi hâle getirildi. |
| **Hakkımızda** | "Borsayı canlı takip edin" | "Altın/döviz yaklaşık 30 sn, BIST en az 15 dk gecikmeli" yazıldı. Yapay zekâ kullanımı belirtildi. SPK yetkili danışman önerisi eklendi. Künye eklendi. |
| **Alt bilgi ve veri uyarıları** | BISTECH / Borsa İstanbul kaynak beyanı | Dürüst kaynak, gecikme ve "ortaklık yoktur" açıklaması |
| **Paylaşım açıklaması (OG)** | "Türkiye'nin en kapsamlı finans platformu" | Üstünlük iddiası kaldırıldı. Ticari Reklam ve Haksız Ticari Uygulamalar Yönetmeliği, karşılaştırmalı üstünlük iddialarının ispatlanabilir olmasını ister. |

**Dokunmadığım ama bilmeniz gereken:**
- Sayfa başlıklarında ve anahtar kelimelerde hâlâ **"Canlı borsa"** ifadesi var. Altın ve döviz için "canlı" savunulabilir; BIST için yanıltıcı sayılabilir. SEO etkisi olduğu için kararı size bırakıyorum.
- Blog yazılarında yazar olarak **"FinansÇözüm Editör Ekibi"** görünüyor. Yazılar yapay zekâyla üretilip otomatik yayınlandığı için bunu "FinansÇözüm" olarak değiştirmeyi ya da yazı altına "yapay zekâ desteğiyle hazırlanmıştır" notu eklemeyi öneririm.
- Otomatik yazılarda **"alınır/satılır/hedef fiyat"** gibi yönlendirici ifadeler çıkmamalı. 6362 sayılı SPK Kanunu kapsamında yatırım danışmanlığı izne tabi; ayrıca yanıltıcı bilgi yayma piyasa dolandırıcılığı hükümlerine girebilir. Blog üretim komutuna bu yasağı açıkça eklemenizi öneririm.

---

## 5. Güvenlik notları (KVKK md.12 — teknik tedbir)

- Oturum anahtarı (`finanscozum-token`) JavaScript'in okuyabildiği bir çerezde ve yerel depolamada tutuluyor. Olası bir XSS açığında çalınabilir. Sunucu tarafında `HttpOnly; Secure; SameSite=Lax` çerezine geçilmesi önerilir.
- Kullanıcının hesabını kendisinin silebileceği bir **"Hesabımı sil"** düğmesi yok; şimdilik e-posta başvurusuyla yürüyor. Hesap sayfasına eklenmesi önerilir.

---

## 6. Değişen dosyalar

- `client/src/lib/legal.ts` — işletmeci bilgileri (**doldurulmalı**)
- `client/src/lib/consent.ts`, `client/src/components/consent/*`, `client/src/components/analytics/GoogleAnalytics.tsx` — çerez onayı
- `client/src/app/gizlilik/page.tsx`, `client/src/app/cerez-politikasi/page.tsx` (yeni), `client/src/app/kullanim-sartlari/page.tsx`
- `client/src/app/kaynak-politikasi/page.tsx`, `client/src/app/editor-ekibi/page.tsx`, `client/src/app/duzeltme-politikasi/page.tsx`, `client/src/app/hakkimizda/page.tsx`, `client/src/app/iletisim/page.tsx`, `client/src/app/kayit/KayitClient.tsx`
- `client/src/components/layout/Footer.tsx`, `client/src/components/shared/DataDisclaimer.tsx`, `client/src/lib/constants.ts`, `client/src/app/layout.tsx`, `client/src/app/sitemap.ts`
