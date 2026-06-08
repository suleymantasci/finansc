import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Calculator, PiggyBank, ArrowLeftRight, Coins, CreditCard, BarChart3,
  Home, Car, Building2, FileText, Clock, AlertTriangle, Plus, DollarSign,
  RefreshCw, Percent, Wallet, Truck, Briefcase, Building,
  TrendingUp, Target, Receipt, Globe, ChartLine, Landmark, History,
  Search, Scissors, GitBranch, HousePlus, LineChart, Scale, Banknote,
  ShieldCheck, BarChart, Award, BookOpen, Zap, Vault, CircleDollarSign,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Hesaplama Araçları',
  description: 'Kredi, vergi, mevduat, döviz ve daha birçok finansal hesaplama aracı.',
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
  let activeSlugs: Set<string> | null = null;
  try {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const res = await fetch(`${API_BASE}/api/tools?active=true`, { next: { revalidate: 60 } });
    if (res.ok) {
      const tools: { slug: string }[] = await res.json();
      activeSlugs = new Set(tools.map((t) => t.slug));
    }
  } catch { /* fallback: show all */ }

  const krediFiltered = activeSlugs ? KREDI_TOOLS.filter((t) => activeSlugs!.has(t.slug)) : KREDI_TOOLS;
  const finansFiltered = activeSlugs ? FINANS_TOOLS.filter((t) => activeSlugs!.has(t.slug)) : FINANS_TOOLS;
  const maasFiltered = activeSlugs ? MAAS_TOOLS.filter((t) => activeSlugs!.has(t.slug)) : MAAS_TOOLS;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8 pb-20 md:pb-8">
      <h1 className="text-2xl font-bold lg:text-3xl">Hesaplama Araçları</h1>
      <p className="mt-2 text-sm text-muted-foreground lg:text-base">
        Finansal kararlarınızı kolaylaştıran ücretsiz araçlar
      </p>

      {maasFiltered.length > 0 && (
        <>
          <h2 className="mt-8 text-lg font-semibold">Maaş & Bordro</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:gap-4">
            {maasFiltered.map((tool) => {
              const Icon = tool.icon;
              return (
                <Link
                  key={tool.slug}
                  href={`/araclar/${tool.slug}`}
                  className="group flex flex-col rounded-xl border border-border bg-card p-4 sm:p-5 transition-colors hover:border-primary/30 hover:bg-surface-hover"
                >
                  <div className="mb-2 sm:mb-3 flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  </div>
                  <h3 className="text-sm sm:text-base font-semibold">{tool.title}</h3>
                  <p className="mt-1 text-xs sm:text-sm text-muted-foreground line-clamp-2">{tool.desc}</p>
                </Link>
              );
            })}
          </div>
        </>
      )}

      {krediFiltered.length > 0 && (
        <>
          <h2 className="mt-10 text-lg font-semibold">Kredi Hesaplamaları</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:gap-4">
            {krediFiltered.map((tool) => {
              const Icon = tool.icon;
              return (
                <Link
                  key={tool.slug}
                  href={`/araclar/${tool.slug}`}
                  className="group flex flex-col rounded-xl border border-border bg-card p-4 sm:p-5 transition-colors hover:border-primary/30 hover:bg-surface-hover"
                >
                  <div className="mb-2 sm:mb-3 flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  </div>
                  <h3 className="text-sm sm:text-base font-semibold">{tool.title}</h3>
                  <p className="mt-1 text-xs sm:text-sm text-muted-foreground line-clamp-2">{tool.desc}</p>
                </Link>
              );
            })}
          </div>
        </>
      )}

      {finansFiltered.length > 0 && (
        <>
          <h2 className="mt-10 text-lg font-semibold">Finansal Hesaplamalar</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:gap-4">
            {finansFiltered.map((tool) => {
              const Icon = tool.icon;
              return (
                <Link
                  key={tool.slug}
                  href={`/araclar/${tool.slug}`}
                  className="group flex flex-col rounded-xl border border-border bg-card p-4 sm:p-5 transition-colors hover:border-primary/30 hover:bg-surface-hover"
                >
                  <div className="mb-2 sm:mb-3 flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  </div>
                  <h3 className="text-sm sm:text-base font-semibold">{tool.title}</h3>
                  <p className="mt-1 text-xs sm:text-sm text-muted-foreground line-clamp-2">{tool.desc}</p>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
