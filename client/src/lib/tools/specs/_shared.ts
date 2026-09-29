// Araç tanımlarında ortak kullanılan alanlar, kaynaklar ve yardımcılar.

import type { DateField, NumberField, SelectField, Values } from '../types';
import { GV_YILLARI } from '@/lib/calculators/params';

export const n = (v: Values, k: string) => v[k] as number;
export const s = (v: Values, k: string) => v[k] as string;
export const b = (v: Values, k: string) => v[k] as boolean;

export const today = (t: string) => t;

export function dateField(key: string, label: string, def: DateField['default'], extra: Partial<DateField> = {}): DateField {
  return { type: 'date', key, label, default: def, ...extra };
}

export function money(key: string, label: string, def: number | null, extra: Partial<NumberField> = {}): NumberField {
  return { type: 'number', key, label, default: def, unit: '₺', min: 0, ...extra };
}

export function percent(key: string, label: string, def: number | null, extra: Partial<NumberField> = {}): NumberField {
  return { type: 'number', key, label, default: def, unit: '%', min: 0, ...extra };
}

export function count(key: string, label: string, def: number | null, unit: string, extra: Partial<NumberField> = {}): NumberField {
  return { type: 'number', key, label, default: def, unit, min: 0, ...extra };
}

export function yearSelect(key = 'yil', label = 'Yıl', def?: number): SelectField {
  const years = [...GV_YILLARI].reverse();
  return {
    type: 'select', key, label, default: String(def ?? years[0]),
    options: years.map((y) => ({ value: String(y), label: String(y) })),
  };
}

export const SRC = {
  gibGv: { label: 'GİB — Gelir Vergisi Tarifesi 2026 (PDF)', url: 'https://cdn.gib.gov.tr/api/gibportal-file/file/getFileResources?objectKey=arsiv/yardim-kaynaklar/yararli-bilgiler/gelir-vergisi-tarifeleri/gelir-vergisi-tarifesi-2026.pdf' },
  gibKira: { label: 'GİB — Kira Geliri Rehberi', url: 'https://www.gib.gov.tr/vergi-konulari/1_bireysel/9_kira_geliri/9' },
  csgbKidem: { label: 'ÇSGB — Kıdem Tazminatı Tavan Miktarı', url: 'https://www.csgb.gov.tr/%C4%B1statistikler/calisma-hayati-%C4%B1statistikleri/kidem-tazminati-tavan-miktari/' },
  sgkPek: { label: 'SGK — Prime Esas Kazanç Miktarları 2026', url: 'https://www.sgk.gov.tr/Content/Post/2e0c9e1a-2cfe-4456-af10-49d3de0c58ba/Prime-Esas-Kazanc-Miktarlari-2026-01-14-10-35-39' },
  iskur: { label: 'İŞKUR — İşsizlik ödeneği nasıl hesaplanır?', url: 'https://www.iskur.gov.tr/sikca-sorulan-sorular/issizlik-sigortasi/issizlik-odenegi-miktari-nasil-hesaplanmaktadir/' },
  isKanunu: { label: '4857 sayılı İş Kanunu', url: 'https://www.mevzuat.gov.tr/mevzuat?MevzuatNo=4857&MevzuatTur=1&MevzuatTertip=5' },
  kanun5510: { label: '5510 sayılı Sosyal Sigortalar ve GSS Kanunu', url: 'https://www.mevzuat.gov.tr/mevzuat?MevzuatNo=5510&MevzuatTur=1&MevzuatTertip=5' },
  kanun3095: { label: '3095 sayılı Kanuni Faiz ve Temerrüt Faizi Kanunu', url: 'https://www.mevzuat.gov.tr/mevzuat?MevzuatNo=3095&MevzuatTur=1&MevzuatTertip=5' },
  kanun6183: { label: '6183 sayılı Amme Alacakları Kanunu md. 51', url: 'https://www.mevzuat.gov.tr/mevzuat?MevzuatNo=6183&MevzuatTur=1&MevzuatTertip=3' },
  damga: { label: '488 sayılı Damga Vergisi Kanunu', url: 'https://www.mevzuat.gov.tr/mevzuat?MevzuatNo=488&MevzuatTur=1&MevzuatTertip=5' },
  harclar: { label: '492 sayılı Harçlar Kanunu', url: 'https://www.mevzuat.gov.tr/mevzuat?MevzuatNo=492&MevzuatTur=1&MevzuatTertip=5' },
  emlak: { label: '1319 sayılı Emlak Vergisi Kanunu', url: 'https://www.mevzuat.gov.tr/mevzuat?MevzuatNo=1319&MevzuatTur=1&MevzuatTertip=4' },
  tasinmaz: { label: 'Taşınmaz Ticareti Hakkında Yönetmelik', url: 'https://www.mevzuat.gov.tr/mevzuat?MevzuatNo=24645&MevzuatTur=7&MevzuatTertip=5' },
  kdv: { label: '3065 sayılı Katma Değer Vergisi Kanunu', url: 'https://www.mevzuat.gov.tr/mevzuat?MevzuatNo=3065&MevzuatTur=1&MevzuatTertip=5' },
  eyt: { label: 'SGK 2023/13 sayılı Genelge özeti (PwC)', url: 'https://www.pwc.com.tr/tr/hizmetlerimiz/insan-yonetimi-ve-organizasyon-danismanligi/sosyal-guvenlik-hizmetleri/bultenler/2023/eyt-duzenlenmesine-iliskin-sgk-genelgesi.html' },
  asgari: { label: 'Asgari Ücret Tespit Komisyonu Kararı (RG 26.12.2025)', url: 'https://www.resmigazete.gov.tr/eskiler/2025/12/20251226-6.pdf' },
  gv193: { label: '193 sayılı Gelir Vergisi Kanunu', url: 'https://www.mevzuat.gov.tr/mevzuat?MevzuatNo=193&MevzuatTur=1&MevzuatTertip=4' },
  kidem1475: { label: '1475 sayılı İş Kanunu md. 14 (kıdem)', url: 'https://www.mevzuat.gov.tr/mevzuat?MevzuatNo=1475&MevzuatTur=1&MevzuatTertip=5' },
  issizlik4447: { label: '4447 sayılı İşsizlik Sigortası Kanunu', url: 'https://www.mevzuat.gov.tr/mevzuat?MevzuatNo=4447&MevzuatTur=1&MevzuatTertip=5' },
  sgkSirkuler: { label: 'Deloitte (verginet) — 2026 SGK tavan-taban ve asgari ücret maliyeti', url: 'https://www.verginet.net/dtt/11/sgk-2026-1.aspx' },
  borclanma: { label: 'SGMD — 7566 sayılı Kanunla 5510’da yapılan değişiklikler', url: 'https://www.sgmd.org.tr/7566-sayili-kanunla-5510-sayili-kanunda-yapilan-duzenlemeler/449' },
  egm: { label: 'Emeklilik Gözetim Merkezi', url: 'https://www.egm.org.tr/' },
};
