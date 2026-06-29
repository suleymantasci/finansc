import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SITE_NAME, SITE_URL } from '@/lib/constants';
import { ToolClient } from './ToolClient';

// Title + description: page-prefix only (Pit 28 — root template ekliyor, çift brand yok).
// Description 130-160 char hedefinde (Pit 28b).
const TOOL_META: Record<string, { title: string; desc: string }> = {
  // Kredi
  'ihtiyac-kredisi': { title: 'İhtiyaç Kredisi Hesaplama', desc: 'İhtiyaç kredisi taksit, faiz ve toplam geri ödeme tutarını anında hesaplayın. Aylık taksit tutarı, toplam maliyet ve efektif yıllık faiz oranını görün.' },
  'is-yeri-kredisi': { title: 'İş Yeri Kredisi Hesaplama', desc: 'İş yeri kredisi aylık taksit, toplam geri ödeme ve efektif maliyet hesaplaması. Esnaf ve KOBİler için kredi karşılaştırması.' },
  'konut-kredisi': { title: 'Konut Kredisi Hesaplama', desc: 'Konut kredisi aylık taksit, toplam geri ödeme ve yıllık maliyet oranı hesaplaması. Farklı vade ve faiz oranlarını karşılaştırın.' },
  'kredi-hesaplama': { title: 'Kredi Hesaplama', desc: 'Genel kredi hesaplama aracı ile aylık taksit, toplam geri ödeme ve faiz maliyetini kolayca hesaplayın.' },
  'kredi-dosya-masrafi': { title: 'Kredi Dosya Masrafı', desc: 'Kredi dosya masrafı tutarını yasal sınırlar dahilinde hesaplayın. Bankaların tahsil edebileceği masraf üst limiti.' },
  'kredi-erken-kapatma': { title: 'Kredi Erken Kapatma', desc: 'Kredi erken kapatma tutarı ve ceza hesaplaması. Ödenen anapara, kalan faiz ve erken ödeme ücretini görün.' },
  'kredi-gecikme-faizi': { title: 'Kredi Gecikme Faizi', desc: 'Kredi gecikme faizi tutarını hesaplayın. Gecikme anapara ve gün sayısına göre uygulanan faiz miktarını öğrenin.' },
  'kredi-karti-asgari-odeme': { title: 'Kredi Kartı Asgari Ödeme', desc: 'Kredi kartı asgari ödeme tutarını ve dönem borcunu hesaplayın. Asgari ödeme yapmanın toplam maliyete etkisini görün.' },
  'kredi-karti-ek-taksit': { title: 'Kredi Kartı Ek Taksit', desc: 'Kredi kartı borcunu taksitlendirme hesaplaması. Ek taksit ile toplam geri ödeme ve faiz maliyetini karşılaştırın.' },
  'kredi-karti-gecikme-faizi': { title: 'Kredi Kartı Gecikme Faizi', desc: 'Kredi kartı gecikme faizi hesaplaması. Asgari ödeme yapılmadığında uygulanan akdi ve temerrüt faiz oranlarını görün.' },
  'kredi-karti-islem-taksitlendirme': { title: 'Kredi Kartı İşlem Taksitlendirme', desc: 'Tek bir kredi kartı işlemini taksitlendirme hesaplaması. Taksit sayısına göre aylık ödeme ve toplam maliyet.' },
  'kredi-karti-taksitli-nakit-avans': { title: 'Kredi Kartı Nakit Avans', desc: 'Taksitli nakit avans maliyet hesaplaması. Nakit avans çekiminde uygulanan faiz, komisyon ve toplam geri ödeme tutarı.' },
  'kredi-yapilandirma': { title: 'Kredi Yapılandırma', desc: 'Mevcut krediyi yeniden yapılandırma karşılaştırması. Eski ve yeni kredi koşullarına göre aylık taksit ve toplam maliyet farkı.' },
  'kredi-yillik-maliyet-orani': { title: 'Kredi Yıllık Maliyet Oranı', desc: 'Kredinin efektif yıllık maliyet oranını (YMO) hesaplayın. Faiz, vergi ve masraflar dahil gerçek maliyet yüzdesi.' },
  'ne-kadar-kredi-alabilirim': { title: 'Ne Kadar Kredi Alabilirim?', desc: 'Gelirinize göre alabileceğiniz maksimum kredi tutarını hesaplayın. BDDK oran limitleri ve aylık taksit oranı bazında.' },
  'tasit-kredisi': { title: 'Taşıt Kredisi Hesaplama', desc: 'Taşıt kredisi aylık taksit, toplam geri ödeme ve yıllık maliyet hesaplaması. 0 ve 2. el araç için kredi karşılaştırması.' },
  'ticari-arac-kredisi': { title: 'Ticari Araç Kredisi', desc: 'Ticari araç kredisi taksit ve toplam maliyet hesaplaması. Firmalar için ticari araç finansmanı karşılaştırması.' },
  'ticari-ihtiyac-kredisi': { title: 'Ticari İhtiyaç Kredisi', desc: 'Ticari ihtiyaç kredisi aylık taksit ve toplam geri ödeme hesaplaması. Esnaf ve KOBİler için kısa vadeli finansman.' },
  'ticari-kredi': { title: 'Ticari Kredi Hesaplama', desc: 'Ticari kredi taksit, faiz ve toplam maliyet hesaplaması. İşletme kredisi için vade ve tutar karşılaştırması.' },
  // Finans
  'altin-hesaplama': { title: 'Altın Hesaplama', desc: 'Altın türleri arasında çeviri ve değer hesaplaması. Gram, çeyrek, yarım, tam altın ve bilezik arasında anlık dönüşüm.' },
  'bilesik-buyume': { title: 'Bileşik Büyüme Oranı (CAGR)', desc: 'Yıllık bileşik büyüme oranını (CAGR) hesaplayın. Yatırımınızın veya gelirinizin yıllar içindeki ortalama büyümesini ölçün.' },
  'birikim-hesaplama': { title: 'Birikim Hesaplama', desc: 'Düzenli tasarruf ile birikim hedefine ulaşma hesaplaması. Aylık birikim tutarı, vade ve hedef ilişkisini planlayın.' },
  'bono-hesaplama': { title: 'Bono Hesaplama', desc: 'Hazine bonosu basit ve bileşik getiri hesaplaması. Vade, faiz oranı ve anapara ile net getiri tutarını öğrenin.' },
  'doviz-hesaplama': { title: 'Döviz Hesaplama', desc: 'Döviz kuru ile çeviri hesaplaması. Dolar, euro, sterlin ve diğer para birimleri arasında anlık kur dönüşümü.' },
  'enflasyon-hesaplama': { title: 'Enflasyon Hesaplama', desc: 'Enflasyona göre paranızın değer değişimini hesaplayın. TÜFE oranı ile geçmiş ve gelecek dönem alım gücü karşılaştırması.' },
  'eurobond-hesaplama': { title: 'Eurobond Hesaplama', desc: 'Eurobond vadeye kadar getiri (YTM) hesaplaması. Kupon oranı, vade ve ihraç fiyatına göre yıllık getiri oranı.' },
  'faiz-hesaplama': { title: 'Faiz Hesaplama', desc: 'Basit ve bileşik faiz hesaplaması. Anapara, faiz oranı ve vade bilgileriyle kazancınızı anında görün.' },
  'gecmis-altin-fiyatlari': { title: 'Geçmiş Altın Fiyatları', desc: 'Geçmiş tarihli altın fiyatları ile hesaplama. Herhangi bir tarihteki gram, çeyrek, ons altın fiyatını sorgulayın.' },
  'gecmis-doviz-kurlari': { title: 'Geçmiş Döviz Kurları', desc: 'Geçmiş tarihli döviz kurları ile hesaplama. Dolar, euro ve diğer para birimlerinin geçmiş değerlerini görün.' },
  'iban-dogrulama': { title: 'IBAN Doğrulama', desc: 'IBAN numaranızın geçerliliğini kontrol edin. Türkiye IBAN yapısı (TR ile başlayan 26 karakter) doğrulama aracı.' },
  'ic-dis-iskonto': { title: 'İç ve Dış İskonto', desc: 'Basit ve bileşik iskonto hesaplaması. Senet ve bonoların iç iskonto (peşin değer) ve dış iskonto tutarını hesaplayın.' },
  'ic-verim-orani': { title: 'İç Verim Oranı (IRR)', desc: 'Yatırımın iç verim oranını (IRR) hesaplayın. Farklı dönem nakit akışları için projenin gerçek getiri oranı.' },
  'kira-artis-orani': { title: 'Kira Artış Oranı', desc: 'Kira artış tutarını TÜFE (12 aylık ortalama) oranına göre hesaplayın. Yıllık ve aylık yeni kira tutarı hesaplaması.' },
  'net-bugunku-deger': { title: 'Net Bugünkü Değer (NPV)', desc: 'Nakit akışlarının bugünkü değerini (NPV) hesaplayın. Yatırım projelerinin karlılığını indirgenmiş nakit akışı ile değerlendirin.' },
  'ortalama-vade': { title: 'Ortalama Vade', desc: 'Çek ve senet ödemelerinin ağırlıklı ortalama vadesini hesaplayın. Birden fazla ödeme tarihi için ortalama vade analizi.' },
  'parasal-deger': { title: 'Parasal Değer', desc: 'Enflasyona göre parasal değer güncelleme hesaplaması. TLnin yıllar içindeki satın alma gücü değişimini görün.' },
  'reel-getiri': { title: 'Reel Getiri', desc: 'Enflasyondan arındırılmış reel getiriyi hesaplayın. Nominal faiz oranı ve enflasyon farkı ile gerçek kazanç oranı.' },
  'repo-hesaplama': { title: 'Repo Hesaplama', desc: 'Repo yatırım getirisi hesaplaması. Anapara, repo oranı ve vade bilgileriyle net kazanç tutarını öğrenin.' },
  'sermaye-temettu': { title: 'Sermaye ve Temettü', desc: 'Temettü, bedelsiz ve bedelli sermaye artırımı hesaplaması. Hisse başına düşen pay ve toplam getiri tutarı.' },
  'tahvil-hesaplama': { title: 'Tahvil Hesaplama', desc: 'Devlet tahvili kupon ve vadeye kadar getiri (YTM) hesaplaması. Kupon oranı ve piyasa fiyatına göre yıllık getiri.' },
  'vadeli-islem-fiyati': { title: 'Vadeli İşlem Fiyatı', desc: 'Vadeli işlem teorik fiyat hesaplaması. Dayanak varlık spot fiyatı, vade ve faiz oranına göre vadeli işlem teorik fiyatı.' },
  'vadeli-mevduat': { title: 'Vadeli Mevduat', desc: 'Vadeli mevduat getiri ve stopaj hesaplaması. Anapara, faiz oranı ve vade ile net kazanç tutarını görün.' },
  'maas-hesaplama': { title: 'Maaş Hesaplama | Brütten Nete ve Netten Brüte', desc: 'Brütten nete ve netten brüte maaş hesaplama aracı. SGK primi, gelir vergisi dilimleri, damga vergisi, asgari ücret istisnası ve işveren maliyeti dahil. Sonuç PDF indirilebilir.' },
};

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const meta = TOOL_META[slug];
  if (!meta) return { title: 'Araç Bulunamadı', robots: { index: false, follow: false } };
  // Description'ı 155 char sınırına kırp (Pit 28b)
  const description = meta.desc.length > 155 ? meta.desc.slice(0, 153).trimEnd() + '…' : meta.desc;
  return {
    title: meta.title,
    description,
    keywords: [meta.title.toLowerCase(), 'hesaplama aracı', 'finans', slug],
    alternates: { canonical: `https://finanscozum.net/araclar/${slug}` },
    openGraph: {
      title: meta.title,
      description,
      url: `https://finanscozum.net/araclar/${slug}`,
      siteName: 'FinansCozum',
      locale: 'tr_TR',
      type: 'website',
    },
  };
}

export function generateStaticParams() {
  return Object.keys(TOOL_META).map((slug) => ({ slug }));
}

export default async function ToolSlugPage({ params }: Props) {
  const { slug } = await params;
  if (!TOOL_META[slug]) notFound();

  // Check if tool is active in the database
  try {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const res = await fetch(`${API_BASE}/api/tools/${slug}`, { next: { revalidate: 60 } });
    if (res.ok) {
      const tool = await res.json();
      if (!tool.isActive) notFound();
    }
  } catch { /* if API unreachable, allow access */ }

  const meta = TOOL_META[slug];
  const canonical = `${SITE_URL}/araclar/${slug}`;

  // Paylaşımlı sayfa düzeni: MaasHesaplama gibi geniş tablolu/analizli
  // araçlar tam genişlik (max-w-7xl), diğerleri kompakt (max-w-2xl).
  const isWide = slug === 'maas-hesaplama';

  // JSON-LD: WebPage + SoftwareApplication + BreadcrumbList + SpeakableSpecification
  // Bu sayfa Türkçe finansal hesaplama araçları — "calculator" tool semantiği.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        name: meta.title,
        description: meta.desc,
        url: canonical,
        applicationCategory: 'FinanceApplication',
        operatingSystem: 'Web',
        inLanguage: 'tr-TR',
        isAccessibleForFree: true,
        publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
        speakable: {
          '@type': 'SpeakableSpecification',
          cssSelector: ['#tool-summary', 'h1'],
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Araçlar', item: `${SITE_URL}/araclar` },
          { '@type': 'ListItem', position: 3, name: meta.title, item: canonical },
        ],
      },
    ],
  };

  // Citable snippet — AI engine'lerin doğrudan cevap olarak kullanacağı 1-2 cümle.
  // Tool'un ne yaptığını ve nasıl kullanıldığını düz dille anlatır.
  const summary = `${meta.title}, FinansÇözüm tarafından sunulan ücretsiz bir online hesaplama aracıdır. ${meta.desc} Sonuçlar anlık hesaplanır, kayıt veya üyelik gerektirmez.`;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Server-rendered H1 (Pit 11/11b — client island içinde olsaydı H1 boş kalırdı) */}
      <div className={`mx-auto ${isWide ? 'max-w-7xl' : 'max-w-2xl'} px-4 pt-6 lg:px-8`}>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">{meta.title}</h1>
      </div>

      {/* Citable snippet (server-rendered, GEO için — AI engine'ler buradan cevap üretir) */}
      <div className={`mx-auto ${isWide ? 'max-w-7xl' : 'max-w-2xl'} px-4 lg:px-8`}>
        <aside
          id="tool-summary"
          aria-label="Araç özeti"
          className="my-6 rounded-lg border-l-4 border-primary bg-primary/5 p-4 text-sm leading-relaxed text-foreground"
        >
          {summary}
        </aside>
      </div>

      <ToolClient slug={slug} title={meta.title} hideTitle />
    </>
  );
}
