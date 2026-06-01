import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ToolClient } from './ToolClient';

const TOOL_META: Record<string, { title: string; desc: string }> = {
  // Kredi
  'ihtiyac-kredisi': { title: 'İhtiyaç Kredisi Hesaplama', desc: 'İhtiyaç kredisi taksit, faiz ve toplam geri ödeme tutarını hesaplayın.' },
  'is-yeri-kredisi': { title: 'İş Yeri Kredisi Hesaplama', desc: 'İş yeri kredisi taksit ve toplam maliyet hesaplaması.' },
  'konut-kredisi': { title: 'Konut Kredisi Hesaplama', desc: 'Konut kredisi taksit, faiz ve toplam geri ödeme hesaplaması.' },
  'kredi-hesaplama': { title: 'Kredi Hesaplama', desc: 'Genel kredi hesaplama aracı ile taksit ve faiz hesaplayın.' },
  'kredi-dosya-masrafi': { title: 'Kredi Dosya Masrafı', desc: 'Kredi dosya masrafı tutarını hesaplayın.' },
  'kredi-erken-kapatma': { title: 'Kredi Erken Kapatma', desc: 'Kredi erken kapatma tutarı ve ceza hesaplaması.' },
  'kredi-gecikme-faizi': { title: 'Kredi Gecikme Faizi', desc: 'Kredi gecikme faizi tutarını hesaplayın.' },
  'kredi-karti-asgari-odeme': { title: 'Kredi Kartı Asgari Ödeme', desc: 'Kredi kartı asgari ödeme tutarını hesaplayın.' },
  'kredi-karti-ek-taksit': { title: 'Kredi Kartı Ek Taksit', desc: 'Kredi kartı borcunu taksitlendirme hesaplaması.' },
  'kredi-karti-gecikme-faizi': { title: 'Kredi Kartı Gecikme Faizi', desc: 'Kredi kartı gecikme faizi hesaplaması.' },
  'kredi-karti-islem-taksitlendirme': { title: 'Kredi Kartı İşlem Taksitlendirme', desc: 'Tek bir işlemi taksitlendirme hesaplaması.' },
  'kredi-karti-taksitli-nakit-avans': { title: 'Kredi Kartı Nakit Avans', desc: 'Taksitli nakit avans maliyet hesaplaması.' },
  'kredi-yapilandirma': { title: 'Kredi Yapılandırma', desc: 'Mevcut krediyi yeniden yapılandırma karşılaştırması.' },
  'kredi-yillik-maliyet-orani': { title: 'Kredi Yıllık Maliyet Oranı', desc: 'Kredinin efektif yıllık maliyet oranını hesaplayın.' },
  'ne-kadar-kredi-alabilirim': { title: 'Ne Kadar Kredi Alabilirim?', desc: 'Gelirinize göre alabileceğiniz maksimum kredi tutarı.' },
  'tasit-kredisi': { title: 'Taşıt Kredisi Hesaplama', desc: 'Taşıt kredisi taksit ve toplam maliyet hesaplaması.' },
  'ticari-arac-kredisi': { title: 'Ticari Araç Kredisi', desc: 'Ticari araç kredisi taksit hesaplaması.' },
  'ticari-ihtiyac-kredisi': { title: 'Ticari İhtiyaç Kredisi', desc: 'Ticari ihtiyaç kredisi taksit hesaplaması.' },
  'ticari-kredi': { title: 'Ticari Kredi Hesaplama', desc: 'Ticari kredi taksit ve maliyet hesaplaması.' },
  // Finans
  'altin-hesaplama': { title: 'Altın Hesaplama', desc: 'Altın türleri arasında çeviri ve değer hesaplaması.' },
  'bilesik-buyume': { title: 'Bileşik Büyüme Oranı (CAGR)', desc: 'Yıllık bileşik büyüme oranını hesaplayın.' },
  'birikim-hesaplama': { title: 'Birikim Hesaplama', desc: 'Düzenli tasarruf ile birikim hedefine ulaşma hesaplaması.' },
  'bono-hesaplama': { title: 'Bono Hesaplama', desc: 'Hazine bonosu getiri hesaplaması.' },
  'doviz-hesaplama': { title: 'Döviz Hesaplama', desc: 'Döviz kuru ile çeviri hesaplaması.' },
  'enflasyon-hesaplama': { title: 'Enflasyon Hesaplama', desc: 'Enflasyona göre paranızın değer değişimini hesaplayın.' },
  'eurobond-hesaplama': { title: 'Eurobond Hesaplama', desc: 'Eurobond vadeye kadar getiri (YTM) hesaplaması.' },
  'faiz-hesaplama': { title: 'Faiz Hesaplama', desc: 'Basit ve bileşik faiz hesaplaması.' },
  'gecmis-altin-fiyatlari': { title: 'Geçmiş Altın Fiyatları', desc: 'Geçmiş tarihli altın fiyatları ile hesaplama.' },
  'gecmis-doviz-kurlari': { title: 'Geçmiş Döviz Kurları', desc: 'Geçmiş tarihli döviz kurları ile hesaplama.' },
  'iban-dogrulama': { title: 'IBAN Doğrulama', desc: 'IBAN numaranızın geçerliliğini kontrol edin.' },
  'ic-dis-iskonto': { title: 'İç ve Dış İskonto', desc: 'Basit ve bileşik iskonto hesaplaması.' },
  'ic-verim-orani': { title: 'İç Verim Oranı (IRR)', desc: 'Yatırımın iç verim oranını hesaplayın.' },
  'kira-artis-orani': { title: 'Kira Artış Oranı', desc: 'Kira artış tutarını TÜFE oranına göre hesaplayın.' },
  'net-bugunku-deger': { title: 'Net Bugünkü Değer (NPV)', desc: 'Nakit akışlarının bugünkü değerini hesaplayın.' },
  'ortalama-vade': { title: 'Ortalama Vade', desc: 'Çek ve senet ödemelerinin ağırlıklı ortalama vadesini hesaplayın.' },
  'parasal-deger': { title: 'Parasal Değer', desc: 'Enflasyona göre parasal değer güncelleme hesaplaması.' },
  'reel-getiri': { title: 'Reel Getiri', desc: 'Enflasyondan arındırılmış gerçek getiriyi hesaplayın.' },
  'repo-hesaplama': { title: 'Repo Hesaplama', desc: 'Repo yatırım getirisi hesaplaması.' },
  'sermaye-temettu': { title: 'Sermaye ve Temettü', desc: 'Temettü, bedelsiz/bedelli sermaye artırımı hesaplaması.' },
  'tahvil-hesaplama': { title: 'Tahvil Hesaplama', desc: 'Devlet tahvili getiri hesaplaması.' },
  'vadeli-islem-fiyati': { title: 'Vadeli İşlem Fiyatı', desc: 'Vadeli işlem teorik fiyat hesaplaması.' },
  'vadeli-mevduat': { title: 'Vadeli Mevduat', desc: 'Vadeli mevduat getiri ve stopaj hesaplaması.' },
};

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const meta = TOOL_META[slug];
  if (!meta) return { title: 'Araç Bulunamadı' };
  return { title: meta.title, description: meta.desc };
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

  return <ToolClient slug={slug} title={TOOL_META[slug].title} />;
}
