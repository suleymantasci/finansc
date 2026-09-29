// Hangi aracın tanımı hangi dosyada — istemci yalnızca ilgili grubu yükler.
// Sayfa derlemesinde specs/index.ts ile tutarlılığı doğrulanır (assertSpecRegistry).

export type SpecModule = 'maas' | 'emeklilik' | 'vergi' | 'kredi-faiz' | 'yatirim-emlak' | 'ticaret-gunluk';

export const SPEC_MODULE_SLUGS: Record<SpecModule, string[]> = {
  'maas': [
    'kidem-tazminati-hesaplama',
    'ihbar-tazminati-hesaplama',
    'issizlik-maasi-hesaplama',
    'rapor-parasi-hesaplama',
    'yillik-izin-hesaplama',
    'fazla-mesai-hesaplama',
    'saatlik-ucret-hesaplama',
    'asgari-ucret-hesaplama',
    'dogum-izni-hesaplama',
    'reel-maas-hesaplama',
  ],
  'emeklilik': [
    'emeklilik-hesaplama',
    'askerlik-borclanmasi-hesaplama',
    'dogum-borclanmasi-hesaplama',
    'yurtdisi-borclanmasi-hesaplama',
    'bes-hesaplama',
    'emekli-zammi-hesaplama',
    'finansal-ozgurluk-hesaplama',
  ],
  'vergi': [
    'kdv-hesaplama',
    'kdv-tevkifati-hesaplama',
    'gelir-vergisi-hesaplama',
    'damga-vergisi-hesaplama',
    'stopaj-hesaplama',
    'kira-stopaji-hesaplama',
    'kira-geliri-vergisi-hesaplama',
    'serbest-meslek-makbuzu-hesaplama',
    'gecikme-zammi-hesaplama',
    'yasal-faiz-hesaplama',
  ],
  'kredi-faiz': [
    'kredi-faiz-orani-hesaplama',
    'kredi-karsilastirma',
    'kredi-karti-borc-kapatma',
    'gunluk-faiz-hesaplama',
    'faiz-orani-donusturme',
  ],
  'yatirim-emlak': [
    'altin-ayar-hesaplama',
    'altin-kar-zarar-hesaplama',
    'doviz-kar-zarar-hesaplama',
    'ortalama-maliyet-hesaplama',
    'hisse-kar-zarar-hesaplama',
    'temettu-hesaplama',
    'pozisyon-buyuklugu-hesaplama',
    'fk-orani-hesaplama',
    'paranin-ikiye-katlanma-suresi',
    'tapu-harci-hesaplama',
    'emlak-vergisi-hesaplama',
    'emlakci-komisyonu-hesaplama',
    'ev-amortisman-hesaplama',
  ],
  'ticaret-gunluk': [
    'yuzde-hesaplama',
    'indirim-hesaplama',
    'kar-marji-hesaplama',
    'zam-hesaplama',
    'basabas-noktasi-hesaplama',
    'roi-hesaplama',
    'pesin-mi-taksit-mi-hesaplama',
    'fatura-hesaplama',
    'gun-hesaplama',
    'yas-hesaplama',
    'tarih-hesaplama',
    'is-gunu-hesaplama',
    'yakit-maliyeti-hesaplama',
    'yakit-tuketimi-hesaplama',
    'elektrikli-arac-sarj-maliyeti',
    'elektrik-tuketimi-hesaplama',
  ],
};

export const SPEC_MODULE_OF: Record<string, SpecModule> = Object.fromEntries(
  (Object.entries(SPEC_MODULE_SLUGS) as [SpecModule, string[]][]).flatMap(([m, slugs]) => slugs.map((s) => [s, m])),
);
