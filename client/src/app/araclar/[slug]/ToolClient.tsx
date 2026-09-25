'use client';

import { useEffect, useState } from 'react';
import { markToolHydrated } from './_tools/_shared/hydration';

import { AdBanner } from '@/components/ads/AdBanner';
import { ReportErrorButton } from '@/components/shared/ReportErrorButton';

// Kredi Araçları
import { IhtiyacKredisi } from './_tools/IhtiyacKredisi';
import { IsYeriKredisi } from './_tools/IsYeriKredisi';
import { KonutKredisi } from './_tools/KonutKredisi';
import { KrediHesaplama } from './_tools/KrediHesaplama';
import { KrediDosyaMasrafi } from './_tools/KrediDosyaMasrafi';
import { KrediErkenKapatma } from './_tools/KrediErkenKapatma';
import { KrediGecikmeFaizi } from './_tools/KrediGecikmeFaizi';
import { KrediKartiAsgariOdeme } from './_tools/KrediKartiAsgariOdeme';
import { KrediKartiEkTaksit } from './_tools/KrediKartiEkTaksit';
import { KrediKartiGecikmeFaizi } from './_tools/KrediKartiGecikmeFaizi';
import { KrediKartiIslemTaksitlendirme } from './_tools/KrediKartiIslemTaksitlendirme';
import { KrediKartiNakitAvans } from './_tools/KrediKartiNakitAvans';
import { KrediYapilandirma } from './_tools/KrediYapilandirma';
import { KrediYillikMaliyetOrani } from './_tools/KrediYillikMaliyetOrani';
import { NeKadarKrediAlabilirim } from './_tools/NeKadarKrediAlabilirim';
import { TasitKredisi } from './_tools/TasitKredisi';
import { TicariAracKredisi } from './_tools/TicariAracKredisi';
import { TicariIhtiyacKredisi } from './_tools/TicariIhtiyacKredisi';
import { TicariKredi } from './_tools/TicariKredi';

// Finans Araçları
import { AltinHesaplama } from './_tools/AltinHesaplama';
import { BilesikBuyume } from './_tools/BilesikBuyume';
import { BirikimHesaplama } from './_tools/BirikimHesaplama';
import { BonoHesaplama } from './_tools/BonoHesaplama';
import { DovizHesaplama } from './_tools/DovizHesaplama';
import { EnflasyonHesaplama } from './_tools/EnflasyonHesaplama';
import { EurobondHesaplama } from './_tools/EurobondHesaplama';
import { FaizHesaplama } from './_tools/FaizHesaplama';
import { GecmisAltinFiyatlari } from './_tools/GecmisAltinFiyatlari';
import { GecmisDovizKurlari } from './_tools/GecmisDovizKurlari';
import { IbanDogrulama } from './_tools/IbanDogrulama';
import { IcDisIskonto } from './_tools/IcDisIskonto';
import { IcVerimOrani } from './_tools/IcVerimOrani';
import { KiraArtisOrani } from './_tools/KiraArtisOrani';
import { NetBugunKuDeger } from './_tools/NetBugunKuDeger';
import { OrtalamaVade } from './_tools/OrtalamaVade';
import { ParasalDeger } from './_tools/ParasalDeger';
import { ReelGetiri } from './_tools/ReelGetiri';
import { RepoHesaplama } from './_tools/RepoHesaplama';
import { SermayeTemettu } from './_tools/SermayeTemettu';
import { TahvilHesaplama } from './_tools/TahvilHesaplama';
import { VadeliIslemFiyati } from './_tools/VadeliIslemFiyati';
import { VadeliMevduat } from './_tools/VadeliMevduat';
import { MaasHesaplama } from './_tools/MaasHesaplama';

interface Props {
  slug: string;
  title: string;
  /** Server-rendered H1 + citable snippet zaten sayfada — client H1'i gizle */
  hideTitle?: boolean;
}

const TOOL_MAP: Record<string, React.FC> = {
  // Kredi
  'ihtiyac-kredisi': IhtiyacKredisi,
  'is-yeri-kredisi': IsYeriKredisi,
  'konut-kredisi': KonutKredisi,
  'kredi-hesaplama': KrediHesaplama,
  'kredi-dosya-masrafi': KrediDosyaMasrafi,
  'kredi-erken-kapatma': KrediErkenKapatma,
  'kredi-gecikme-faizi': KrediGecikmeFaizi,
  'kredi-karti-asgari-odeme': KrediKartiAsgariOdeme,
  'kredi-karti-ek-taksit': KrediKartiEkTaksit,
  'kredi-karti-gecikme-faizi': KrediKartiGecikmeFaizi,
  'kredi-karti-islem-taksitlendirme': KrediKartiIslemTaksitlendirme,
  'kredi-karti-taksitli-nakit-avans': KrediKartiNakitAvans,
  'kredi-yapilandirma': KrediYapilandirma,
  'kredi-yillik-maliyet-orani': KrediYillikMaliyetOrani,
  'ne-kadar-kredi-alabilirim': NeKadarKrediAlabilirim,
  'tasit-kredisi': TasitKredisi,
  'ticari-arac-kredisi': TicariAracKredisi,
  'ticari-ihtiyac-kredisi': TicariIhtiyacKredisi,
  'ticari-kredi': TicariKredi,
  // Finans
  'altin-hesaplama': AltinHesaplama,
  'bilesik-buyume': BilesikBuyume,
  'birikim-hesaplama': BirikimHesaplama,
  'bono-hesaplama': BonoHesaplama,
  'doviz-hesaplama': DovizHesaplama,
  'enflasyon-hesaplama': EnflasyonHesaplama,
  'eurobond-hesaplama': EurobondHesaplama,
  'faiz-hesaplama': FaizHesaplama,
  'gecmis-altin-fiyatlari': GecmisAltinFiyatlari,
  'gecmis-doviz-kurlari': GecmisDovizKurlari,
  'iban-dogrulama': IbanDogrulama,
  'ic-dis-iskonto': IcDisIskonto,
  'ic-verim-orani': IcVerimOrani,
  'kira-artis-orani': KiraArtisOrani,
  'net-bugunku-deger': NetBugunKuDeger,
  'ortalama-vade': OrtalamaVade,
  'parasal-deger': ParasalDeger,
  'reel-getiri': ReelGetiri,
  'repo-hesaplama': RepoHesaplama,
  'sermaye-temettu': SermayeTemettu,
  'tahvil-hesaplama': TahvilHesaplama,
  'vadeli-islem-fiyati': VadeliIslemFiyati,
  'vadeli-mevduat': VadeliMevduat,
  'maas-hesaplama': MaasHesaplama,
};

export function ToolClient({ slug, title, hideTitle = false }: Props) {
  const ToolComponent = TOOL_MAP[slug];

  // Araçlar başlangıç değerlerini URL'den (?amount=…) render sırasında okuyor. Sayfa sunucuda
  // parametresiz üretildiği için hydration sunucudaki varsayılanları koruyor, URL'deki değerler
  // ve otomatik hesaplama görünmüyordu (paylaşılan linkler, ana sayfa kartları). URL'de parametre
  // varsa araç yüklendikten sonra bir kez yeniden kurulur; bu kurulum tamamen istemcide olduğu için
  // URL'yi doğru okur. Sunucu HTML'i (SEO) değişmez.
  // Sayfa içi geçişte (ana sayfa kartları) Next adres çubuğunu bu effect'ten SONRA güncelliyor;
  // kontrol bir sonraki görev döngüsüne ertelenir. (useSearchParams statik sayfada aracı sunucu
  // HTML'inden çıkarırdı; kullanılmıyor.)
  const [mountKey, setMountKey] = useState('ssr');
  useEffect(() => {
    const t = setTimeout(() => {
      markToolHydrated();
      if (window.location.search.length > 1) setMountKey(`url:${window.location.search}`);
    }, 0);
    return () => clearTimeout(t);
  }, []);

  // Geniş tablo içeren araçlar için container genişliğini artır
  const isWide = slug === 'maas-hesaplama';

  return (
    <div className={`mx-auto ${isWide ? 'max-w-[1440px]' : 'max-w-3xl'} px-4 py-6 lg:px-8 pb-24 md:pb-12`}>
      {/* page.tsx'te H1 üstünde breadcrumb var. Bu render'de tekrar etmiyoruz. */}
      {hideTitle ? (
        // Server-rendered H1 page.tsx'te (Pit 11b). Burada görsel başlık yok.
        <h2 className="sr-only">{title}</h2>
      ) : (
        <h1 className="font-display text-balance text-4xl text-foreground sm:text-5xl">{title}</h1>
      )}

      <AdBanner page={`araclar-${slug}`} position="top" />

      <div className="mt-6">
        {ToolComponent ? <ToolComponent key={mountKey} /> : <p className="text-muted-foreground">Bu araç henüz aktif değil.</p>}
      </div>

      <div className="mt-8 flex justify-end">
        <ReportErrorButton type="tool" slug={slug} pageTitle={title} />
      </div>
    </div>
  );
}
