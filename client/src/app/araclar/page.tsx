import { API_URL } from '@/lib/constants';
import { safeJsonLd } from '@/lib/json-ld';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumb } from '@/components/shared/Breadcrumb';
import { SectionIntro } from '@/components/shared/SectionIntro';
import {
  Calculator, PiggyBank, ArrowLeftRight, Coins, CreditCard, BarChart3,
  Home, Car, Building2, FileText, Clock, AlertTriangle, Plus, DollarSign,
  RefreshCw, Percent, Wallet, Truck, Briefcase, Building,
  TrendingUp, Target, Receipt, Globe, ChartLine, Landmark, History,
  Search, Scissors, GitBranch, HousePlus, LineChart, Scale, Banknote,
  ShieldCheck, BarChart, Award, BookOpen, Zap, Vault, CircleDollarSign,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Finansal Hesaplama Araçları | Kredi, Maaş, Faiz, Enflasyon',
  description: 'Kredi taksiti, maaş (brüt-net), vadeli mevduat, faiz, reel getiri, enflasyon ve yatırım hesaplamaları için 40’tan fazla ücretsiz araç.',
  keywords: ['kredi hesaplama', 'faiz hesaplama', 'döviz hesaplama', 'altın hesaplama', 'vadeli mevduat', 'maaş hesaplama', 'brütten nete'],
  alternates: { canonical: 'https://finanscozum.net/araclar' },
};

const KREDI_TOOLS = [
  { slug: 'ihtiyac-kredisi', title: 'İhtiyaç Kredisi', desc: 'İhtiyaç kredisi taksit ve faiz hesaplaması.', icon: Calculator },
  { slug: 'konut-kredisi', title: 'Konut Kredisi', desc: 'Konut kredisi taksit ve maliyet hesaplaması.', icon: Home },
  { slug: 'tasit-kredisi', title: 'Taşıt Kredisi', desc: 'Taşıt kredisi taksit hesaplaması.', icon: Car },
  { slug: 'is-yeri-kredisi', title: 'İş Yeri Kredisi', desc: 'İş yeri kredisi taksit hesaplaması.', icon: Building2 },
  { slug: 'ticari-kredi', title: 'Ticari Kredi', desc: 'Ticari kredi taksit hesaplaması.', icon: Building },
  { slug: 'ticari-ihtiyac-kredisi', title: 'Ticari İhtiyaç Kredisi', desc: 'Ticari ihtiyaç kredisi hesaplaması.', icon: Briefcase },
  { slug: 'ticari-arac-kredisi', title: 'Ticari Araç Kredisi', desc: 'Ticari araç kredisi hesaplaması.', icon: Truck },
  { slug: 'kredi-hesaplama', title: 'Kredi Hesaplama', desc: 'Genel kredi hesaplama aracı.', icon: Calculator },
  { slug: 'ne-kadar-kredi-alabilirim', title: 'Ne Kadar Kredi Alabilirim?', desc: 'Gelirinize göre maksimum kredi tutarı.', icon: Wallet },
  { slug: 'kredi-dosya-masrafi', title: 'Kredi Dosya Masrafı', desc: 'Dosya masrafı tutarını hesaplayın.', icon: FileText },
  { slug: 'kredi-erken-kapatma', title: 'Kredi Erken Kapatma', desc: 'Erken kapatma tutarı ve ceza hesaplaması.', icon: Clock },
  { slug: 'kredi-gecikme-faizi', title: 'Kredi Gecikme Faizi', desc: 'Gecikme faizi tutarını hesaplayın.', icon: AlertTriangle },
  { slug: 'kredi-yapilandirma', title: 'Kredi Yapılandırma', desc: 'Kredi yeniden yapılandırma karşılaştırması.', icon: RefreshCw },
  { slug: 'kredi-yillik-maliyet-orani', title: 'Yıllık Maliyet Oranı', desc: 'Efektif yıllık maliyet oranı hesaplaması.', icon: Percent },
  { slug: 'kredi-karti-asgari-odeme', title: 'Asgari Ödeme', desc: 'Kredi kartı asgari ödeme tutarı.', icon: CreditCard },
  { slug: 'kredi-karti-ek-taksit', title: 'Ek Taksit', desc: 'Kredi kartı borcunu taksitlendirme.', icon: Plus },
  { slug: 'kredi-karti-gecikme-faizi', title: 'Kart Gecikme Faizi', desc: 'Kredi kartı gecikme faizi hesaplaması.', icon: AlertTriangle },
  { slug: 'kredi-karti-islem-taksitlendirme', title: 'İşlem Taksitlendirme', desc: 'Tek işlemi taksitlendirme hesaplaması.', icon: DollarSign },
  { slug: 'kredi-karti-taksitli-nakit-avans', title: 'Nakit Avans', desc: 'Taksitli nakit avans maliyet hesaplaması.', icon: Banknote },
];

const FINANS_TOOLS = [
  { slug: 'altin-hesaplama', title: 'Altın Hesaplama', desc: 'Altın türleri arasında çeviri ve değer hesaplaması.', icon: Coins },
  { slug: 'doviz-hesaplama', title: 'Döviz Hesaplama', desc: 'Döviz kuru ile çeviri hesaplaması.', icon: ArrowLeftRight },
  { slug: 'faiz-hesaplama', title: 'Faiz Hesaplama', desc: 'Basit ve bileşik faiz hesaplaması.', icon: Percent },
  { slug: 'vadeli-mevduat', title: 'Vadeli Mevduat', desc: 'Vadeli mevduat getiri ve stopaj hesaplaması.', icon: Vault },
  { slug: 'bono-hesaplama', title: 'Bono Hesaplama', desc: 'Hazine bonosu getiri hesaplaması.', icon: Receipt },
  { slug: 'tahvil-hesaplama', title: 'Tahvil Hesaplama', desc: 'Devlet tahvili getiri hesaplaması.', icon: Landmark },
  { slug: 'repo-hesaplama', title: 'Repo Hesaplama', desc: 'Repo yatırım getirisi hesaplaması.', icon: BookOpen },
  { slug: 'eurobond-hesaplama', title: 'Eurobond Hesaplama', desc: 'Eurobond vadeye kadar getiri hesaplaması.', icon: Globe },
  { slug: 'birikim-hesaplama', title: 'Birikim Hesaplama', desc: 'Düzenli tasarruf ile birikim hesaplaması.', icon: PiggyBank },
  { slug: 'enflasyon-hesaplama', title: 'Enflasyon Hesaplama', desc: 'Paranızın değer değişimini hesaplayın.', icon: TrendingUp },
  { slug: 'bilesik-buyume', title: 'Bileşik Büyüme (CAGR)', desc: 'Yıllık bileşik büyüme oranı hesaplaması.', icon: BarChart3 },
  { slug: 'reel-getiri', title: 'Reel Getiri', desc: 'Enflasyondan arındırılmış getiri hesaplaması.', icon: ChartLine },
  { slug: 'kira-artis-orani', title: 'Kira Artış Oranı', desc: 'Kira artış tutarını hesaplayın.', icon: HousePlus },
  { slug: 'parasal-deger', title: 'Parasal Değer', desc: 'Enflasyona göre parasal değer güncelleme.', icon: Scale },
  { slug: 'net-bugunku-deger', title: 'Net Bugünkü Değer (NPV)', desc: 'Nakit akışlarının bugünkü değerini hesaplayın.', icon: LineChart },
  { slug: 'ic-verim-orani', title: 'İç Verim Oranı (IRR)', desc: 'Yatırımın iç verim oranını hesaplayın.', icon: Target },
  { slug: 'ic-dis-iskonto', title: 'İç ve Dış İskonto', desc: 'Basit ve bileşik iskonto hesaplaması.', icon: Scissors },
  { slug: 'ortalama-vade', title: 'Ortalama Vade', desc: 'Ağırlıklı ortalama vade hesaplaması.', icon: BarChart },
  { slug: 'vadeli-islem-fiyati', title: 'Vadeli İşlem Fiyatı', desc: 'Vadeli işlem teorik fiyat hesaplaması.', icon: Zap },
  { slug: 'sermaye-temettu', title: 'Sermaye ve Temettü', desc: 'Temettü ve sermaye artırımı hesaplaması.', icon: Award },
  { slug: 'gecmis-altin-fiyatlari', title: 'Geçmiş Altın Fiyatları', desc: 'Geçmiş tarihli altın fiyatları ile hesaplama.', icon: History },
  { slug: 'gecmis-doviz-kurlari', title: 'Geçmiş Döviz Kurları', desc: 'Geçmiş tarihli döviz kurları ile hesaplama.', icon: History },
  { slug: 'iban-dogrulama', title: 'IBAN Doğrulama', desc: 'IBAN numaranızın geçerliliğini kontrol edin.', icon: ShieldCheck },
];

const MAAS_TOOLS = [
  { slug: 'maas-hesaplama', title: 'Maaş Hesaplama', desc: 'Brütten nete ve netten brüte maaş hesaplama. SGK, gelir vergisi, damga vergisi dahil.', icon: CircleDollarSign },
];

export default async function AraclarPage() {
  // ── SoftwareApplication schema ──
  // Google arama sonuçlarında "rich result" olarak görünebilmesi için
  // her araç için SoftwareApplication tipinde JSON-LD üretiyoruz.
  // ItemList + CollectionPage ile sayfa bağlamını da belirtiyoruz.
  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Hesaplama Araçları',
    description: 'Türkiye\'nin kapsamlı finansal hesaplama araçları koleksiyonu: kredi, vergi, mevduat, maaş, döviz, altın.',
    url: 'https://finanscozum.net/araclar',
    inLanguage: 'tr-TR',
    publisher: { '@id': 'https://finanscozum.net/#organization' },
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: [
        ...KREDI_TOOLS,
        ...FINANS_TOOLS,
        ...MAAS_TOOLS,
      ].map((tool, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'SoftwareApplication',
          name: tool.title,
          description: tool.desc,
          url: `https://finanscozum.net/araclar/${tool.slug}`,
          applicationCategory: 'FinanceApplication',
          operatingSystem: 'Web',
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'TRY',
          },
          inLanguage: 'tr-TR',
        },
      })),
    },
  };

  let activeSlugs: Set<string> | null = null;
  try {
    const API_BASE = API_URL;
    const res = await fetch(`${API_BASE}/api/tools?active=true`, { next: { revalidate: 60 } });
    if (res.ok) {
      const tools: { slug: string }[] = await res.json();
      activeSlugs = new Set(tools.map((t) => t.slug));
    }
  } catch { /* fallback: show all */ }

  const krediFiltered = activeSlugs ? KREDI_TOOLS.filter((t) => activeSlugs!.has(t.slug)) : KREDI_TOOLS;
  const finansFiltered = activeSlugs ? FINANS_TOOLS.filter((t) => activeSlugs!.has(t.slug)) : FINANS_TOOLS;
  const maasFiltered = activeSlugs ? MAAS_TOOLS.filter((t) => activeSlugs!.has(t.slug)) : MAAS_TOOLS;

  const groups = [
    { id: 'maas', title: 'Maaş ve bordro', tools: maasFiltered },
    { id: 'kredi', title: 'Kredi ve kredi kartı', tools: krediFiltered },
    { id: 'finans', title: 'Yatırım, faiz ve enflasyon', tools: finansFiltered },
  ].filter((g) => g.tools.length > 0);
  const total = groups.reduce((n, g) => n + g.tools.length, 0);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(itemListJsonLd) }} />
      <div className="mx-auto max-w-[1440px] px-4 py-6 pb-24 lg:px-8 md:pb-12">
        <Breadcrumb items={[{ label: 'Ana Sayfa', href: '/' }, { label: 'Hesaplama araçları' }]} />
        <SectionIntro
          as="page"
          eyebrow={`${total} ücretsiz araç`}
          title="Hesaplama araçları"
          description="Kredi, maaş, mevduat, faiz, enflasyon ve yatırım hesaplamaları. Üyelik gerekmez; aradığınız aracı bulmak için Ctrl+K ile arayabilirsiniz."
        />

        <nav aria-label="Araç kategorileri" className="mb-10 flex flex-wrap gap-2">
          {groups.map((g) => (
            <a key={g.id} href={`#${g.id}`} className="inline-flex h-9 items-center rounded-full border border-border px-4 text-[13px] text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground">
              {g.title}
              <span className="num ml-2 text-[11px] text-muted-foreground">{g.tools.length}</span>
            </a>
          ))}
        </nav>

        <div className="space-y-14">
          {groups.map((g) => (
            <section key={g.id} id={g.id} aria-labelledby={`${g.id}-t`} className="scroll-mt-32">
              <h2 id={`${g.id}-t`} className="font-display mb-5 text-3xl text-foreground">
                {g.title}
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {g.tools.map((tool) => {
                  const Icon = tool.icon;
                  return (
                    <Link key={tool.slug} href={`/araclar/${tool.slug}`} className="atlas-card atlas-card-link group flex items-start gap-4 p-4 sm:p-5">
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-border bg-elevated text-primary" aria-hidden="true">
                        <Icon className="h-[18px] w-[18px]" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[15px] font-medium text-foreground group-hover:text-primary">{tool.title}</span>
                        <span className="mt-0.5 block text-[13px] leading-snug text-muted-foreground">{tool.desc}</span>
                      </span>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </>
  );
}
