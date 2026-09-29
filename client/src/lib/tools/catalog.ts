// Tüm hesaplama araçlarının tek listesi. Araçlar sayfası, sitemap, admin senkronu ve sayfa
// metadata'sı buradan beslenir. `generic: true` araçlar bildirimsel motorla (lib/tools/specs)
// çizilir; yalnızca maaş hesaplama _tools/ altındaki elle yazılmış bileşendir.

export const GUNCEL_YIL = 2026;
const Y = GUNCEL_YIL;

export type ToolGroupId = 'maas' | 'emeklilik' | 'vergi' | 'kredi' | 'faiz' | 'yatirim' | 'emlak' | 'ticaret' | 'gunluk';

export const TOOL_GROUPS: { id: ToolGroupId; title: string; category: 'kredi' | 'yatirim' | 'vergi' | 'tasarruf' | 'diger' }[] = [
  { id: 'maas', title: 'Maaş ve çalışma hayatı', category: 'vergi' },
  { id: 'emeklilik', title: 'Emeklilik, SGK ve BES', category: 'tasarruf' },
  { id: 'vergi', title: 'Vergi, stopaj ve faiz cezaları', category: 'vergi' },
  { id: 'kredi', title: 'Kredi ve kredi kartı', category: 'kredi' },
  { id: 'faiz', title: 'Faiz, mevduat ve enflasyon', category: 'tasarruf' },
  { id: 'yatirim', title: 'Borsa, altın ve yatırım', category: 'yatirim' },
  { id: 'emlak', title: 'Emlak, tapu ve kira', category: 'diger' },
  { id: 'ticaret', title: 'Yüzde, kâr ve ticaret', category: 'diger' },
  { id: 'gunluk', title: 'Tarih, yakıt ve günlük hesaplar', category: 'diger' },
];

export interface ToolEntry {
  slug: string;
  /** H1 ve <title> */
  title: string;
  /** Kart ve breadcrumb başlığı */
  short: string;
  /** Kart açıklaması (tek cümle) */
  card: string;
  /** Meta description */
  desc: string;
  group: ToolGroupId;
  icon: string;
  generic?: boolean;
}

const t = (slug: string, group: ToolGroupId, icon: string, title: string, short: string, card: string, desc: string, generic = true): ToolEntry =>
  ({ slug, group, icon, title, short, card, desc, generic });

export const TOOL_CATALOG: ToolEntry[] = [
  // ── Maaş ve çalışma hayatı ──
  t('maas-hesaplama', 'maas', 'CircleDollarSign', 'Maaş Hesaplama | Brütten Nete ve Netten Brüte', 'Maaş Hesaplama', 'Brütten nete ve netten brüte maaş. SGK, gelir ve damga vergisi dahil.', 'Brütten nete ve netten brüte maaş hesaplama aracı. SGK primi, gelir vergisi dilimleri, damga vergisi, asgari ücret istisnası ve işveren maliyeti dahil. Sonuç PDF indirilebilir.', false),
  t('kidem-tazminati-hesaplama', 'maas', 'Briefcase', `Kıdem Tazminatı Hesaplama ${Y}`, 'Kıdem Tazminatı', 'Brüt ve net kıdem tazminatı, güncel tavanla.', `Kıdem tazminatı hesaplama ${Y}: işe giriş ve çıkış tarihi, brüt maaş ve yan haklarla brüt ve net tazminatı güncel kıdem tavanı ve damga vergisiyle hesaplayın.`),
  t('ihbar-tazminati-hesaplama', 'maas', 'BellRing', `İhbar Tazminatı Hesaplama ${Y}`, 'İhbar Tazminatı', 'İhbar süresi, brüt ve net ihbar tazminatı.', `İhbar tazminatı hesaplama ${Y}: çalışma sürenize göre ihbar süresi (2–8 hafta), brüt tutar, gelir vergisi, damga vergisi ve net ihbar tazminatı.`),
  t('issizlik-maasi-hesaplama', 'maas', 'LifeBuoy', `İşsizlik Maaşı Hesaplama ${Y}`, 'İşsizlik Maaşı', 'Aylık işsizlik ödeneği ve kaç ay alınacağı.', `İşsizlik maaşı hesaplama ${Y}: son 4 ay brüt ortalamanız ve prim gününüzle aylık net işsizlik ödeneğini, üst sınırı ve kaç ay ödeneceğini hesaplayın.`),
  t('rapor-parasi-hesaplama', 'maas', 'Stethoscope', `Rapor Parası Hesaplama ${Y}`, 'Rapor Parası', 'SGK geçici iş göremezlik ödeneği.', `Rapor parası (geçici iş göremezlik ödeneği) hesaplama ${Y}: hastalık, iş kazası ve analık raporlarında SGK'nın ödeyeceği günlük ve toplam tutar.`),
  t('yillik-izin-hesaplama', 'maas', 'Palmtree', 'Yıllık İzin Hesaplama', 'Yıllık İzin', 'Kıdeme ve yaşa göre izin günü.', 'Yıllık izin hesaplama: iş kanununa göre kıdem yılı ve yaşınıza göre kaç gün ücretli izin hakkınız olduğunu ve bir sonraki hak ediş tarihini öğrenin.'),
  t('fazla-mesai-hesaplama', 'maas', 'Clock3', `Fazla Mesai Hesaplama ${Y}`, 'Fazla Mesai', 'Fazla çalışma ve bayram mesaisi ücreti.', `Fazla mesai ücreti hesaplama ${Y}: brüt maaşınıza göre %50 zamlı fazla çalışma, %25 fazla sürelerle çalışma ve resmî tatil çalışması brüt ve net tutarı.`),
  t('saatlik-ucret-hesaplama', 'maas', 'Timer', 'Saatlik Ücret Hesaplama', 'Saatlik Ücret', 'Aylık maaştan saatlik ve günlük ücret.', 'Saatlik ücret hesaplama: aylık maaştan saatlik, günlük, haftalık ve yıllık ücreti; saatlik ücretten aylık maaşı 225 saat esasıyla hesaplayın.'),
  t('asgari-ucret-hesaplama', 'maas', 'Wallet', `Asgari Ücret ${Y} Hesaplama`, 'Asgari Ücret', 'Net, brüt asgari ücret ve işveren maliyeti.', `Asgari ücret ${Y} hesaplama: brüt ve net asgari ücret, SGK ve işsizlik kesintileri, teşvikli ve teşviksiz işveren maliyeti, günlük ve saatlik asgari ücret.`),
  t('dogum-izni-hesaplama', 'maas', 'Baby', `Doğum İzni Hesaplama ${Y}`, 'Doğum İzni', 'Doğum izni başlangıç ve bitiş tarihi.', `Doğum izni hesaplama ${Y}: tahmini doğum tarihinize göre 24 haftalık analık izninin başlangıç, bitiş ve işe dönüş tarihlerini; çoğul gebelik ve devredilen haftaları görün.`),
  t('reel-maas-hesaplama', 'maas', 'TrendingDown', 'Maaş Enflasyon Karşısında (Reel Maaş) Hesaplama', 'Reel Maaş', 'Zammınız enflasyonu karşıladı mı?', 'Reel maaş hesaplama: eski ve yeni maaşınız ile dönem enflasyonuna göre reel artışınızı, alım gücü kaybınızı ve enflasyona göre olması gereken maaşı hesaplayın.'),

  // ── Emeklilik, SGK ve BES ──
  t('emeklilik-hesaplama', 'emeklilik', 'Hourglass', 'Ne Zaman Emekli Olurum? Emeklilik Hesaplama', 'Emeklilik Hesaplama', 'EYT, kademeli yaş ve prim gününe göre emeklilik tarihi.', 'Emeklilik hesaplama: SGK (4/a) ve Bağ-Kur (4/b) için ilk giriş tarihi, prim günü ve yaşınıza göre ne zaman emekli olacağınızı; EYT ve kademeli yaş şartlarıyla hesaplayın.'),
  t('askerlik-borclanmasi-hesaplama', 'emeklilik', 'Shield', `Askerlik Borçlanması Hesaplama ${Y}`, 'Askerlik Borçlanması', 'Askerlik süresi borçlanma tutarı.', `Askerlik borçlanması hesaplama ${Y}: askerlik süreniz ve seçtiğiniz günlük kazançla SGK'ya ödeyeceğiniz borçlanma tutarını güncel %45 oranıyla hesaplayın.`),
  t('dogum-borclanmasi-hesaplama', 'emeklilik', 'HeartHandshake', `Doğum Borçlanması Hesaplama ${Y}`, 'Doğum Borçlanması', 'Çocuk başına 720 güne kadar borçlanma.', `Doğum borçlanması hesaplama ${Y}: çocuk sayısı ve borçlanılacak gün ile doğum borçlanması tutarını %32 oranı ve güncel alt-üst günlük kazançla hesaplayın.`),
  t('yurtdisi-borclanmasi-hesaplama', 'emeklilik', 'Plane', `Yurt Dışı Borçlanması Hesaplama ${Y}`, 'Yurt Dışı Borçlanması', 'Yurt dışı hizmet süresi borçlanma tutarı.', `Yurt dışı borçlanması hesaplama ${Y}: yurt dışında geçen sürenin borçlanma tutarını güncel prime esas kazanç sınırları ve %45 oranıyla hesaplayın.`),
  t('bes-hesaplama', 'emeklilik', 'PiggyBank', `BES Hesaplama ${Y} (Devlet Katkısı)`, 'BES Hesaplama', 'Devlet katkısı %20 ile BES birikimi.', `BES hesaplama ${Y}: aylık katkı payı, süre ve beklenen getiriyle bireysel emeklilik birikiminizi, %20 devlet katkısını ve hak ediş oranınızı hesaplayın.`),
  t('emekli-zammi-hesaplama', 'emeklilik', 'BadgePercent', 'Emekli Zammı Hesaplama', 'Emekli Zammı', '6 aylık enflasyon farkıyla yeni emekli aylığı.', 'Emekli zammı hesaplama: aylık enflasyon oranlarından 6 aylık kümülatif zam oranını ve SSK, Bağ-Kur emekli aylığınızın zamlı tutarını hesaplayın.'),
  t('finansal-ozgurluk-hesaplama', 'emeklilik', 'Sunrise', 'Finansal Özgürlük (Erken Emeklilik) Hesaplama', 'Finansal Özgürlük', 'Çalışmadan yaşamak için gereken birikim.', 'Finansal özgürlük hesaplama: aylık giderinize göre gereken birikimi (%4 kuralı) ve düzenli yatırımla bu hedefe kaç yılda ulaşacağınızı hesaplayın.'),

  // ── Vergi ──
  t('kdv-hesaplama', 'vergi', 'Receipt', `KDV Hesaplama ${Y} (Dahil / Hariç)`, 'KDV Hesaplama', 'KDV dahil ve hariç tutar, %1-%10-%20.', `KDV hesaplama ${Y}: KDV dahil fiyattan hariç tutarı veya KDV hariç tutardan dahil fiyatı %1, %10 ve %20 oranlarıyla anında hesaplayın.`),
  t('kdv-tevkifati-hesaplama', 'vergi', 'SplitSquareHorizontal', 'KDV Tevkifatı Hesaplama', 'KDV Tevkifatı', 'Tevkifatlı faturada KDV ve ödenecek tutar.', 'KDV tevkifatı hesaplama: matrah, KDV oranı ve tevkifat oranıyla (2/10–10/10) tevkif edilen KDV, satıcıya ödenecek KDV ve fatura toplamını hesaplayın.'),
  t('gelir-vergisi-hesaplama', 'vergi', 'Landmark', `Gelir Vergisi Hesaplama ${Y}`, 'Gelir Vergisi', 'Dilimlere göre yıllık gelir vergisi.', `Gelir vergisi hesaplama ${Y}: ücret ve ücret dışı gelirler için ${Y} gelir vergisi dilimlerine göre vergi tutarı, ortalama ve marjinal oran, dilim dökümü.`),
  t('damga-vergisi-hesaplama', 'vergi', 'Stamp', `Damga Vergisi Hesaplama ${Y}`, 'Damga Vergisi', 'Sözleşme, kira ve ücrette damga vergisi.', `Damga vergisi hesaplama ${Y}: sözleşmeler (binde 9,48), kira sözleşmeleri (binde 1,89) ve ücretler (binde 7,59) için damga vergisini güncel azami tutarla hesaplayın.`),
  t('stopaj-hesaplama', 'vergi', 'Scissors', 'Stopaj Hesaplama (Brütten Nete / Netten Brüte)', 'Stopaj Hesaplama', 'Her orana göre brüt-net stopaj.', 'Stopaj hesaplama: kira, serbest meslek, temettü ve mevduat gibi gelirlerde brüt tutardan neti veya netten brütü seçtiğiniz stopaj oranıyla hesaplayın.'),
  t('kira-stopaji-hesaplama', 'vergi', 'Building', 'Kira Stopajı Hesaplama (%20)', 'Kira Stopajı', 'İş yeri kirasında brüt-net ve %20 stopaj.', 'Kira stopajı hesaplama: iş yeri kiralarında net kiradan brüt kirayı veya brüt kiradan neti %20 stopaj oranıyla hesaplayın; yıllık stopaj tutarını görün.'),
  t('kira-geliri-vergisi-hesaplama', 'vergi', 'KeyRound', `Kira Geliri Vergisi Hesaplama ${Y}`, 'Kira Geliri Vergisi', 'Konut kira gelirinde istisna ve vergi.', `Kira geliri vergisi hesaplama ${Y}: konut kira gelirinizde ${Y} istisnası (58.000 TL), götürü veya gerçek gider ve gelir vergisi dilimleriyle ödenecek vergiyi hesaplayın.`),
  t('serbest-meslek-makbuzu-hesaplama', 'vergi', 'FileSignature', 'Serbest Meslek Makbuzu Hesaplama', 'Serbest Meslek Makbuzu', 'SMM brüt, net, stopaj ve KDV.', 'Serbest meslek makbuzu (SMM) hesaplama: brüt ücret, %20 stopaj, KDV, net ücret ve tahsil edilecek tutarı brütten, netten veya toplamdan hesaplayın.'),
  t('gecikme-zammi-hesaplama', 'vergi', 'AlarmClock', `Gecikme Zammı Hesaplama ${Y}`, 'Gecikme Zammı', 'Vergi ve SGK borcu gecikme zammı.', `Gecikme zammı hesaplama ${Y}: vergi, SGK primi, MTV ve emlak vergisi borçlarında vade ve ödeme tarihine göre gecikme zammını dönem oranlarıyla hesaplayın.`),
  t('yasal-faiz-hesaplama', 'vergi', 'Gavel', `Yasal Faiz Hesaplama ${Y}`, 'Yasal Faiz', 'Kanuni faiz ve temerrüt faizi.', `Yasal faiz hesaplama ${Y}: alacak tutarı ve tarih aralığıyla kanuni faizi (%9, %24, %31 dönemleri) veya sözleşmeyle belirlenen temerrüt faizini gün esasıyla hesaplayın.`),

  // ── Kredi ve kredi kartı ──
  t('ihtiyac-kredisi', 'kredi', 'Calculator', 'İhtiyaç Kredisi Hesaplama', 'İhtiyaç Kredisi', 'İhtiyaç kredisi taksit ve faiz hesaplaması.', 'İhtiyaç kredisi taksit, faiz ve toplam geri ödeme tutarını anında hesaplayın. Aylık taksit tutarı, toplam maliyet ve efektif yıllık faiz oranını görün.'),
  t('konut-kredisi', 'kredi', 'Home', 'Konut Kredisi Hesaplama', 'Konut Kredisi', 'Konut kredisi taksit ve maliyet hesaplaması.', 'Konut kredisi aylık taksit, toplam geri ödeme ve yıllık maliyet oranı hesaplaması. Farklı vade ve faiz oranlarını karşılaştırın.'),
  t('tasit-kredisi', 'kredi', 'Car', 'Taşıt Kredisi Hesaplama', 'Taşıt Kredisi', 'Taşıt kredisi taksit hesaplaması.', 'Taşıt kredisi aylık taksit, toplam geri ödeme ve yıllık maliyet hesaplaması. 0 ve 2. el araç için kredi karşılaştırması.'),
  t('is-yeri-kredisi', 'kredi', 'Building2', 'İş Yeri Kredisi Hesaplama', 'İş Yeri Kredisi', 'İş yeri kredisi taksit hesaplaması.', 'İş yeri kredisi aylık taksit, toplam geri ödeme ve efektif maliyet hesaplaması. Esnaf ve KOBİler için kredi karşılaştırması.'),
  t('ticari-kredi', 'kredi', 'Building', 'Ticari Kredi Hesaplama', 'Ticari Kredi', 'Ticari kredi taksit hesaplaması.', 'Ticari kredi taksit, faiz ve toplam maliyet hesaplaması. İşletme kredisi için vade ve tutar karşılaştırması.'),
  t('ticari-ihtiyac-kredisi', 'kredi', 'Briefcase', 'Ticari İhtiyaç Kredisi', 'Ticari İhtiyaç Kredisi', 'Ticari ihtiyaç kredisi hesaplaması.', 'Ticari ihtiyaç kredisi aylık taksit ve toplam geri ödeme hesaplaması. Esnaf ve KOBİler için kısa vadeli finansman.'),
  t('ticari-arac-kredisi', 'kredi', 'Truck', 'Ticari Araç Kredisi', 'Ticari Araç Kredisi', 'Ticari araç kredisi hesaplaması.', 'Ticari araç kredisi taksit ve toplam maliyet hesaplaması. Firmalar için ticari araç finansmanı karşılaştırması.'),
  t('kredi-hesaplama', 'kredi', 'Calculator', 'Kredi Hesaplama', 'Kredi Hesaplama', 'Genel kredi hesaplama aracı.', 'Genel kredi hesaplama aracı ile aylık taksit, toplam geri ödeme ve faiz maliyetini kolayca hesaplayın.'),
  t('ne-kadar-kredi-alabilirim', 'kredi', 'Wallet', 'Ne Kadar Kredi Alabilirim?', 'Ne Kadar Kredi Alabilirim?', 'Gelirinize göre maksimum kredi tutarı.', 'Gelirinize göre alabileceğiniz maksimum kredi tutarını hesaplayın. BDDK oran limitleri ve aylık taksit oranı bazında.'),
  t('kredi-faiz-orani-hesaplama', 'kredi', 'SearchCheck', 'Kredi Faiz Oranı Hesaplama (Taksitten Faiz Bulma)', 'Taksitten Faiz Oranı', 'Taksit ve vadeden gerçek faiz oranı.', 'Kredi faiz oranı hesaplama: çekilen tutar, aylık taksit ve vadeden kredinin aylık akdi faizini, vergiler dahil efektif oranı ve yıllık maliyetini bulun.'),
  t('kredi-karsilastirma', 'kredi', 'Scale', 'Kredi Karşılaştırma Hesaplama', 'Kredi Karşılaştırma', 'İki krediyi taksit ve toplam maliyetle kıyaslayın.', 'Kredi karşılaştırma: iki farklı kredi teklifini faiz, vade ve masraflarıyla yan yana koyup aylık taksit, toplam geri ödeme ve maliyet farkını görün.'),
  t('kredi-dosya-masrafi', 'kredi', 'FileText', 'Kredi Dosya Masrafı', 'Kredi Dosya Masrafı', 'Dosya masrafı tutarını hesaplayın.', 'Kredi dosya masrafı tutarını yasal sınırlar dahilinde hesaplayın. Bankaların tahsil edebileceği masraf üst limiti.'),
  t('kredi-erken-kapatma', 'kredi', 'Clock', 'Kredi Erken Kapatma', 'Kredi Erken Kapatma', 'Erken kapatma tutarı ve ceza hesaplaması.', 'Kredi erken kapatma tutarı ve ceza hesaplaması. Ödenen anapara, kalan faiz ve erken ödeme ücretini görün.'),
  t('kredi-gecikme-faizi', 'kredi', 'AlertTriangle', 'Kredi Gecikme Faizi', 'Kredi Gecikme Faizi', 'Gecikme faizi tutarını hesaplayın.', 'Kredi gecikme faizi tutarını hesaplayın. Gecikme anapara ve gün sayısına göre uygulanan faiz miktarını öğrenin.'),
  t('kredi-yapilandirma', 'kredi', 'RefreshCw', 'Kredi Yapılandırma', 'Kredi Yapılandırma', 'Kredi yeniden yapılandırma karşılaştırması.', 'Mevcut krediyi yeniden yapılandırma karşılaştırması. Eski ve yeni kredi koşullarına göre aylık taksit ve toplam maliyet farkı.'),
  t('kredi-yillik-maliyet-orani', 'kredi', 'Percent', 'Kredi Yıllık Maliyet Oranı', 'Yıllık Maliyet Oranı', 'Efektif yıllık maliyet oranı hesaplaması.', 'Kredinin efektif yıllık maliyet oranını (YMO) hesaplayın. Faiz, vergi ve masraflar dahil gerçek maliyet yüzdesi.'),
  t('kredi-karti-borc-kapatma', 'kredi', 'CreditCard', 'Kredi Kartı Borcu Kaç Ayda Biter? Hesaplama', 'Kart Borcu Kapatma', 'Sabit ödemeyle kart borcunun bitiş süresi.', 'Kredi kartı borcu kapatma hesaplama: borç, aylık akdi faiz ve ödeme tutarınızla borcun kaç ayda biteceğini, toplam faiz, BSMV ve KKDF maliyetini görün.'),
  t('kredi-karti-asgari-odeme', 'kredi', 'CreditCard', 'Kredi Kartı Asgari Ödeme', 'Asgari Ödeme', 'Kredi kartı asgari ödeme tutarı.', 'Kredi kartı asgari ödeme tutarını ve dönem borcunu hesaplayın. Asgari ödeme yapmanın toplam maliyete etkisini görün.'),
  t('kredi-karti-ek-taksit', 'kredi', 'Plus', 'Kredi Kartı Ek Taksit', 'Ek Taksit', 'Kredi kartı borcunu taksitlendirme.', 'Kredi kartı borcunu taksitlendirme hesaplaması. Ek taksit ile toplam geri ödeme ve faiz maliyetini karşılaştırın.'),
  t('kredi-karti-gecikme-faizi', 'kredi', 'AlertTriangle', 'Kredi Kartı Gecikme Faizi', 'Kart Gecikme Faizi', 'Kredi kartı gecikme faizi hesaplaması.', 'Kredi kartı gecikme faizi hesaplaması. Asgari ödeme yapılmadığında uygulanan akdi ve temerrüt faiz oranlarını görün.'),
  t('kredi-karti-islem-taksitlendirme', 'kredi', 'DollarSign', 'Kredi Kartı İşlem Taksitlendirme', 'İşlem Taksitlendirme', 'Tek işlemi taksitlendirme hesaplaması.', 'Tek bir kredi kartı işlemini taksitlendirme hesaplaması. Taksit sayısına göre aylık ödeme ve toplam maliyet.'),
  t('kredi-karti-taksitli-nakit-avans', 'kredi', 'Banknote', 'Kredi Kartı Nakit Avans', 'Nakit Avans', 'Taksitli nakit avans maliyet hesaplaması.', 'Taksitli nakit avans maliyet hesaplaması. Nakit avans çekiminde uygulanan faiz, komisyon ve toplam geri ödeme tutarı.'),

  // ── Faiz, mevduat, enflasyon ──
  t('faiz-hesaplama', 'faiz', 'Percent', 'Faiz Hesaplama', 'Faiz Hesaplama', 'Basit ve bileşik faiz hesaplaması.', 'Basit ve bileşik faiz hesaplaması. Anapara, faiz oranı ve vade bilgileriyle kazancınızı anında görün.'),
  t('vadeli-mevduat', 'faiz', 'Vault', 'Vadeli Mevduat', 'Vadeli Mevduat', 'Vadeli mevduat getiri ve stopaj hesaplaması.', 'Vadeli mevduat getiri ve stopaj hesaplaması. Anapara, faiz oranı ve vade ile net kazanç tutarını görün.'),
  t('gunluk-faiz-hesaplama', 'faiz', 'CalendarClock', 'Günlük Faiz Hesaplama (Mevduat Getirisi)', 'Günlük Faiz', 'Paranızın günlük ve dönemlik net faizi.', 'Günlük faiz hesaplama: anapara, yıllık faiz oranı ve gün sayısıyla mevduatınızın brüt ve net (stopaj sonrası) faiz getirisini, günlük kazancınızı hesaplayın.'),
  t('faiz-orani-donusturme', 'faiz', 'ArrowLeftRight', 'Aylık Faizi Yıllığa Çevirme (Faiz Oranı Dönüştürme)', 'Faiz Oranı Dönüştürme', 'Aylık ↔ yıllık, basit ↔ bileşik faiz.', 'Faiz oranı dönüştürme: aylık faizi yıllık basit ve bileşik (efektif) faize, yıllık faizi aylık faize çevirin; günlük faiz karşılığını görün.'),
  t('birikim-hesaplama', 'faiz', 'PiggyBank', 'Birikim Hesaplama', 'Birikim Hesaplama', 'Düzenli tasarruf ile birikim hesaplaması.', 'Düzenli tasarruf ile birikim hedefine ulaşma hesaplaması. Aylık birikim tutarı, vade ve hedef ilişkisini planlayın.'),
  t('enflasyon-hesaplama', 'faiz', 'TrendingUp', 'Enflasyon Hesaplama', 'Enflasyon Hesaplama', 'Paranızın değer değişimini hesaplayın.', 'Enflasyona göre paranızın değer değişimini hesaplayın. TÜFE oranı ile geçmiş ve gelecek dönem alım gücü karşılaştırması.'),
  t('reel-getiri', 'faiz', 'ChartLine', 'Reel Getiri', 'Reel Getiri', 'Enflasyondan arındırılmış getiri hesaplaması.', 'Enflasyondan arındırılmış reel getiriyi hesaplayın. Nominal faiz oranı ve enflasyon farkı ile gerçek kazanç oranı.'),
  t('parasal-deger', 'faiz', 'Scale', 'Parasal Değer', 'Parasal Değer', 'Enflasyona göre parasal değer güncelleme.', 'Enflasyona göre parasal değer güncelleme hesaplaması. TLnin yıllar içindeki satın alma gücü değişimini görün.'),
  t('kira-artis-orani', 'emlak', 'HousePlus', 'Kira Artış Oranı', 'Kira Artış Oranı', 'Kira artış tutarını hesaplayın.', 'Kira artış tutarını TÜFE (12 aylık ortalama) oranına göre hesaplayın. Yıllık ve aylık yeni kira tutarı hesaplaması.'),

  // ── Borsa, altın, yatırım ──
  t('altin-hesaplama', 'yatirim', 'Coins', 'Altın Hesaplama', 'Altın Hesaplama', 'Altın türleri arasında çeviri ve değer hesaplaması.', 'Altın türleri arasında çeviri ve değer hesaplaması. Gram, çeyrek, yarım, tam altın ve bilezik arasında anlık dönüşüm.'),
  t('altin-ayar-hesaplama', 'yatirim', 'Gem', 'Altın Ayar Hesaplama (14, 18, 22 Ayar)', 'Altın Ayar Hesaplama', '14, 18, 22 ayarın has altın karşılığı.', 'Altın ayar hesaplama: 8, 14, 18, 21, 22 ve 24 ayar altının milyemine göre has altın gramını ve has gram fiyatıyla değerini hesaplayın.'),
  t('altin-kar-zarar-hesaplama', 'yatirim', 'Coins', 'Altın Kâr Zarar Hesaplama', 'Altın Kâr/Zarar', 'Alış-satış fiyatıyla altın kârınız.', 'Altın kâr zarar hesaplama: gram veya adet altının alış ve satış fiyatıyla kâr/zarar tutarınızı ve yüzde getirinizi hesaplayın.'),
  t('doviz-kar-zarar-hesaplama', 'yatirim', 'DollarSign', 'Döviz Kâr Zarar Hesaplama', 'Döviz Kâr/Zarar', 'Dolar, euro alım-satım kârı.', 'Döviz kâr zarar hesaplama: dolar, euro veya sterlin alış ve satış kuru ile miktar üzerinden kâr/zarar tutarınızı ve yüzde getirinizi hesaplayın.'),
  t('doviz-hesaplama', 'yatirim', 'ArrowLeftRight', 'Döviz Hesaplama', 'Döviz Hesaplama', 'Döviz kuru ile çeviri hesaplaması.', 'Döviz kuru ile çeviri hesaplaması. Dolar, euro, sterlin ve diğer para birimleri arasında anlık kur dönüşümü.'),
  t('ortalama-maliyet-hesaplama', 'yatirim', 'Layers', 'Hisse Ortalama Maliyet Hesaplama', 'Ortalama Maliyet', 'Kademeli alımlarda ortalama maliyet.', 'Hisse ortalama maliyet hesaplama: farklı fiyatlardan yaptığınız alımların ağırlıklı ortalama maliyetini, komisyon dahil toplam maliyeti ve güncel kâr/zararı görün.'),
  t('hisse-kar-zarar-hesaplama', 'yatirim', 'CandlestickChart', 'Hisse Kâr Zarar Hesaplama', 'Hisse Kâr/Zarar', 'Komisyon dahil net kâr ve başabaş fiyat.', 'Hisse senedi kâr zarar hesaplama: alış, satış fiyatı ve lot ile aracı kurum komisyonu ve BSMV dahil net kâr/zararı, getiriyi ve başabaş satış fiyatını hesaplayın.'),
  t('temettu-hesaplama', 'yatirim', 'HandCoins', 'Temettü Hesaplama (Net Temettü ve Verim)', 'Temettü Hesaplama', 'Brüt, net temettü ve temettü verimi.', 'Temettü hesaplama: hisse adedi ve hisse başı brüt temettü ile alacağınız brüt ve net temettüyü (%15 stopaj) ve temettü verimini hesaplayın.'),
  t('pozisyon-buyuklugu-hesaplama', 'yatirim', 'Crosshair', 'Pozisyon Büyüklüğü (Lot) Hesaplama', 'Pozisyon Büyüklüğü', 'Risk yüzdesine göre alınacak lot.', 'Pozisyon büyüklüğü hesaplama: sermaye, risk yüzdesi, giriş ve stop fiyatına göre kaç lot almanız gerektiğini, risk/ödül oranını ve pozisyon tutarını hesaplayın.'),
  t('fk-orani-hesaplama', 'yatirim', 'Sigma', 'F/K Oranı ve PD/DD Hesaplama', 'F/K ve PD/DD', 'Fiyat/kazanç, PD/DD ve hisse başı kâr.', 'F/K oranı hesaplama: hisse fiyatı, hisse adedi, net kâr ve öz kaynakla fiyat/kazanç oranı, PD/DD, piyasa değeri ve hisse başına kârı hesaplayın.'),
  t('paranin-ikiye-katlanma-suresi', 'yatirim', 'Repeat2', 'Paranın İkiye Katlanma Süresi (72 Kuralı)', 'İkiye Katlanma Süresi', 'Paranız kaç yılda ikiye katlanır?', 'Paranın ikiye katlanma süresi hesaplama: yıllık getiri oranınıza göre paranızın kaç yılda iki ve üç katına çıkacağını 72 kuralı ve kesin formülle hesaplayın.'),
  t('gecmis-altin-fiyatlari', 'yatirim', 'History', 'Geçmiş Altın Fiyatları', 'Geçmiş Altın Fiyatları', 'Geçmiş tarihli altın fiyatları ile hesaplama.', 'Geçmiş tarihli altın fiyatları ile hesaplama. Herhangi bir tarihteki gram, çeyrek, ons altın fiyatını sorgulayın.'),
  t('gecmis-doviz-kurlari', 'yatirim', 'History', 'Geçmiş Döviz Kurları', 'Geçmiş Döviz Kurları', 'Geçmiş tarihli döviz kurları ile hesaplama.', 'Geçmiş tarihli döviz kurları ile hesaplama. Dolar, euro ve diğer para birimlerinin geçmiş değerlerini görün.'),
  t('sermaye-temettu', 'yatirim', 'Award', 'Sermaye ve Temettü', 'Sermaye ve Temettü', 'Temettü ve sermaye artırımı hesaplaması.', 'Temettü, bedelsiz ve bedelli sermaye artırımı hesaplaması. Hisse başına düşen pay ve toplam getiri tutarı.'),
  t('bono-hesaplama', 'yatirim', 'Receipt', 'Bono Hesaplama', 'Bono Hesaplama', 'Hazine bonosu getiri hesaplaması.', 'Hazine bonosu basit ve bileşik getiri hesaplaması. Vade, faiz oranı ve anapara ile net getiri tutarını öğrenin.'),
  t('tahvil-hesaplama', 'yatirim', 'Landmark', 'Tahvil Hesaplama', 'Tahvil Hesaplama', 'Devlet tahvili getiri hesaplaması.', 'Devlet tahvili kupon ve vadeye kadar getiri (YTM) hesaplaması. Kupon oranı ve piyasa fiyatına göre yıllık getiri.'),
  t('repo-hesaplama', 'yatirim', 'BookOpen', 'Repo Hesaplama', 'Repo Hesaplama', 'Repo yatırım getirisi hesaplaması.', 'Repo yatırım getirisi hesaplaması. Anapara, repo oranı ve vade bilgileriyle net kazanç tutarını öğrenin.'),
  t('eurobond-hesaplama', 'yatirim', 'Globe', 'Eurobond Hesaplama', 'Eurobond Hesaplama', 'Eurobond vadeye kadar getiri hesaplaması.', 'Eurobond vadeye kadar getiri (YTM) hesaplaması. Kupon oranı, vade ve ihraç fiyatına göre yıllık getiri oranı.'),
  t('bilesik-buyume', 'yatirim', 'BarChart3', 'Bileşik Büyüme Oranı (CAGR)', 'Bileşik Büyüme (CAGR)', 'Yıllık bileşik büyüme oranı hesaplaması.', 'Yıllık bileşik büyüme oranını (CAGR) hesaplayın. Yatırımınızın veya gelirinizin yıllar içindeki ortalama büyümesini ölçün.'),
  t('net-bugunku-deger', 'yatirim', 'LineChart', 'Net Bugünkü Değer (NPV)', 'Net Bugünkü Değer (NPV)', 'Nakit akışlarının bugünkü değerini hesaplayın.', 'Nakit akışlarının bugünkü değerini (NPV) hesaplayın. Yatırım projelerinin karlılığını indirgenmiş nakit akışı ile değerlendirin.'),
  t('ic-verim-orani', 'yatirim', 'Target', 'İç Verim Oranı (IRR)', 'İç Verim Oranı (IRR)', 'Yatırımın iç verim oranını hesaplayın.', 'Yatırımın iç verim oranını (IRR) hesaplayın. Farklı dönem nakit akışları için projenin gerçek getiri oranı.'),
  t('vadeli-islem-fiyati', 'yatirim', 'Zap', 'Vadeli İşlem Fiyatı', 'Vadeli İşlem Fiyatı', 'Vadeli işlem teorik fiyat hesaplaması.', 'Vadeli işlem teorik fiyat hesaplaması. Dayanak varlık spot fiyatı, vade ve faiz oranına göre vadeli işlem teorik fiyatı.'),

  // ── Emlak ──
  t('tapu-harci-hesaplama', 'emlak', 'FileKey', `Tapu Harcı Hesaplama ${Y}`, 'Tapu Harcı', 'Alıcı-satıcı tapu harcı ve döner sermaye.', `Tapu harcı hesaplama ${Y}: satış bedeli üzerinden alıcı ve satıcı için %2'şer tapu harcını, toplam harcı ve döner sermaye ücretiyle birlikte hesaplayın.`),
  t('emlak-vergisi-hesaplama', 'emlak', 'Home', `Emlak Vergisi Hesaplama ${Y}`, 'Emlak Vergisi', 'Konut, iş yeri, arsa emlak vergisi.', `Emlak vergisi hesaplama ${Y}: konut, iş yeri, arsa ve arazi için vergi değeri, büyükşehir durumu ve hisse payına göre yıllık emlak vergisi ve taksit tutarı.`),
  t('emlakci-komisyonu-hesaplama', 'emlak', 'Handshake', `Emlakçı Komisyonu Hesaplama ${Y}`, 'Emlakçı Komisyonu', 'Satış ve kiralamada yasal komisyon.', `Emlakçı komisyonu hesaplama ${Y}: satışta alıcı ve satıcıdan %2 + KDV, kiralamada bir aylık kira + KDV yasal üst sınırına göre ödenecek hizmet bedeli.`),
  t('ev-amortisman-hesaplama', 'emlak', 'House', 'Ev Amortisman Süresi ve Kira Getirisi Hesaplama', 'Ev Amortisman Süresi', 'Ev kendini kaç yılda öder?', 'Ev amortisman hesaplama: konut fiyatı ve kira gelirine göre evin kendini kaç yılda ödeyeceğini, brüt ve net kira getirisi oranını, kira artışlı senaryoyla hesaplayın.'),

  // ── Yüzde, kâr, ticaret ──
  t('yuzde-hesaplama', 'ticaret', 'Percent', 'Yüzde Hesaplama', 'Yüzde Hesaplama', 'Yüzdesi, yüzde kaçı, yüzde artış-azalış.', 'Yüzde hesaplama: bir sayının yüzdesini, bir sayının diğerinin yüzde kaçı olduğunu, yüzde artış ve azalışı, yüzde ekleme ve çıkarmayı anında hesaplayın.'),
  t('indirim-hesaplama', 'ticaret', 'Tag', 'İndirim Hesaplama', 'İndirim Hesaplama', 'İndirimli fiyat ve indirim oranı.', 'İndirim hesaplama: etiket fiyatı ve indirim oranıyla indirimli fiyatı, iki fiyat arasındaki indirim yüzdesini ve ardışık indirimlerin toplam etkisini hesaplayın.'),
  t('kar-marji-hesaplama', 'ticaret', 'TrendingUp', 'Kâr Marjı Hesaplama', 'Kâr Marjı', 'Kâr marjı, kâr oranı ve satış fiyatı.', 'Kâr marjı hesaplama: maliyet ve satış fiyatından kâr marjını ve maliyet üzerine kâr oranını, hedef marjdan satış fiyatını KDV dahil veya hariç hesaplayın.'),
  t('zam-hesaplama', 'ticaret', 'ArrowUpRight', 'Zam Hesaplama (Maaş ve Fiyat Zammı)', 'Zam Hesaplama', 'Zamlı tutar ve zam oranı.', 'Zam hesaplama: maaş veya fiyata yüzde zam uygulayın, eski ve yeni tutardan zam oranını bulun ya da zamlı tutardan zam öncesi tutarı hesaplayın.'),
  t('basabas-noktasi-hesaplama', 'ticaret', 'Activity', 'Başabaş Noktası Hesaplama', 'Başabaş Noktası', 'Kâra geçmek için satış adedi ve ciro.', 'Başabaş noktası hesaplama: sabit giderler, birim satış fiyatı ve birim değişken maliyetle kâra geçmek için gereken satış adedini ve ciroyu hesaplayın.'),
  t('roi-hesaplama', 'ticaret', 'Rocket', 'ROI (Yatırım Getirisi) Hesaplama', 'ROI Hesaplama', 'Yatırım getirisi ve yıllık getiri.', 'ROI hesaplama: yatırım tutarı ve dönüşüyle yatırım getirisi yüzdesini, kazancı ve yatırım süresine göre yıllıklandırılmış (bileşik) getiriyi hesaplayın.'),
  t('pesin-mi-taksit-mi-hesaplama', 'ticaret', 'SplitSquareVertical', 'Peşin mi Taksit mi? Hesaplama', 'Peşin mi Taksit mi?', 'Taksitin bugünkü değeri ve zımni faiz.', 'Peşin mi taksit mi hesaplama: peşin fiyat ile taksitli toplamı paranızın getirisine göre karşılaştırın; vade farkının zımni aylık faizini görün.'),
  t('fatura-hesaplama', 'ticaret', 'ScrollText', 'Fatura Hesaplama (KDV ve İskonto)', 'Fatura Hesaplama', 'Satırlı fatura, iskonto ve KDV dağılımı.', 'Fatura hesaplama: ürün satırlarının adet, birim fiyat, iskonto ve KDV oranıyla ara toplam, matrah, oranlara göre KDV ve genel toplamı hesaplayın.'),
  t('ic-dis-iskonto', 'ticaret', 'Scissors', 'İç ve Dış İskonto', 'İç ve Dış İskonto', 'Basit ve bileşik iskonto hesaplaması.', 'Basit ve bileşik iskonto hesaplaması. Senet ve bonoların iç iskonto (peşin değer) ve dış iskonto tutarını hesaplayın.'),
  t('ortalama-vade', 'ticaret', 'BarChart', 'Ortalama Vade', 'Ortalama Vade', 'Ağırlıklı ortalama vade hesaplaması.', 'Çek ve senet ödemelerinin ağırlıklı ortalama vadesini hesaplayın. Birden fazla ödeme tarihi için ortalama vade analizi.'),

  // ── Tarih, yakıt, günlük ──
  t('gun-hesaplama', 'gunluk', 'CalendarRange', 'Gün Hesaplama (İki Tarih Arası)', 'Gün Hesaplama', 'İki tarih arası gün, hafta, ay.', 'Gün hesaplama: iki tarih arasında kaç gün, hafta, ay ve yıl olduğunu, hafta içi gün sayısını bitiş günü dahil veya hariç hesaplayın.'),
  t('yas-hesaplama', 'gunluk', 'Cake', 'Yaş Hesaplama', 'Yaş Hesaplama', 'Yıl, ay, gün olarak tam yaş.', 'Yaş hesaplama: doğum tarihinize göre tam yaşınızı yıl, ay ve gün olarak; yaşadığınız toplam gün, hafta ve bir sonraki doğum gününüze kalan süreyi hesaplayın.'),
  t('tarih-hesaplama', 'gunluk', 'CalendarPlus', 'Tarih Hesaplama (Tarihe Gün Ekleme)', 'Tarih Hesaplama', 'Tarihe gün, ay, iş günü ekleyin.', 'Tarih hesaplama: bir tarihe gün, hafta, ay, yıl veya iş günü ekleyin ya da çıkarın; vade ve son gün tarihini haftanın günüyle birlikte bulun.'),
  t('is-gunu-hesaplama', 'gunluk', 'CalendarCheck', `İş Günü Hesaplama ${Y}`, 'İş Günü Hesaplama', 'Resmî tatiller hariç iş günü sayısı.', `İş günü hesaplama ${Y}: iki tarih arasındaki iş günlerini hafta sonları ve resmî tatiller (arife yarım gün) düşülerek hesaplayın; aralıktaki tatilleri görün.`),
  t('yakit-maliyeti-hesaplama', 'gunluk', 'Fuel', 'Yakıt Maliyeti (Yol Masrafı) Hesaplama', 'Yol Masrafı', 'Yolculuğun yakıt maliyeti ve kişi başı.', 'Yol masrafı hesaplama: mesafe, aracın 100 km yakıt tüketimi ve yakıt fiyatıyla yolculuğun yakıt maliyetini, gidiş-dönüş ve kişi başı tutarı hesaplayın.'),
  t('yakit-tuketimi-hesaplama', 'gunluk', 'Gauge', '100 km Yakıt Tüketimi Hesaplama', 'Yakıt Tüketimi', 'Aracınız 100 km\'de kaç litre yakıyor?', 'Yakıt tüketimi hesaplama: aldığınız yakıt ve gittiğiniz mesafeyle aracınızın 100 km\'de kaç litre yaktığını, litre başına kilometreyi ve km maliyetini hesaplayın.'),
  t('elektrikli-arac-sarj-maliyeti', 'gunluk', 'BatteryCharging', 'Elektrikli Araç Şarj Maliyeti Hesaplama', 'EV Şarj Maliyeti', 'Şarj ücreti, menzil ve 100 km maliyeti.', 'Elektrikli araç şarj maliyeti hesaplama: batarya kapasitesi, şarj yüzdesi ve kWh fiyatıyla şarj ücretini, eklenen menzili ve 100 km maliyetini hesaplayın.'),
  t('elektrik-tuketimi-hesaplama', 'gunluk', 'Plug', 'Elektrik Tüketimi Hesaplama (Watt → TL)', 'Elektrik Tüketimi', 'Cihazın kWh tüketimi ve faturaya etkisi.', 'Elektrik tüketimi hesaplama: cihazın watt gücü ve kullanım süresiyle günlük, aylık kWh tüketimini ve elektrik birim fiyatına göre maliyetini hesaplayın.'),
  t('iban-dogrulama', 'gunluk', 'ShieldCheck', 'IBAN Doğrulama', 'IBAN Doğrulama', 'IBAN numaranızın geçerliliğini kontrol edin.', 'IBAN numaranızın geçerliliğini kontrol edin. Türkiye IBAN yapısı (TR ile başlayan 26 karakter) doğrulama aracı.'),
];

export const TOOL_BY_SLUG: Record<string, ToolEntry> = Object.fromEntries(TOOL_CATALOG.map((e) => [e.slug, e]));

export function toolsInGroup(group: ToolGroupId): ToolEntry[] {
  return TOOL_CATALOG.filter((e) => e.group === group);
}

/** Aynı gruptan (yoksa yakın gruplardan) ilgili araçlar */
export function relatedTools(slug: string, limit = 6): ToolEntry[] {
  const me = TOOL_BY_SLUG[slug];
  if (!me) return [];
  const same = TOOL_CATALOG.filter((e) => e.group === me.group && e.slug !== slug);
  const i = TOOL_CATALOG.findIndex((e) => e.slug === slug);
  // Sıradaki komşulardan başla ki her sayfa farklı araçlara link versin
  const rotated = [...same.filter((e) => TOOL_CATALOG.indexOf(e) > i), ...same.filter((e) => TOOL_CATALOG.indexOf(e) < i)];
  return rotated.slice(0, limit);
}
