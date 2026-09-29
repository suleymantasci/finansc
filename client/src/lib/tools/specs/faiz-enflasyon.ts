// Faiz, mevduat, birikim ve TÜFE endeksine dayalı araçlar.

import type { ComputeContext, SelectField, ToolSpec, Values } from '../types';
import { tl, pct, num, int } from '../format';
import { count, money, n, percent, s } from './_shared';
import { loadTufe, type TufeVerisi } from './_data';
import { TR_MONTHS } from '@/lib/calculators/core';
import { endeksDegisim, onikiAylikOrtalamaDegisim } from '@/lib/calculators/piyasa';
import { gunlukFaiz } from '@/lib/calculators/faiz';
import { TMSF_LIMIT } from '@/lib/calculators/params';
import { GUNCEL_YIL } from '../catalog';

// ── Dönem seçimi (TÜFE) ──
const YILLAR = Array.from({ length: GUNCEL_YIL - 1980 + 1 }, (_, i) => String(GUNCEL_YIL - i));
const yilSec = (key: string, label: string, def: string): SelectField => ({ type: 'select', key, label, default: def, options: YILLAR.map((y) => ({ value: y, label: y })) });
const aySec = (key: string, label: string, def: string): SelectField => ({ type: 'select', key, label, default: def, options: TR_MONTHS.map((m, i) => ({ value: String(i + 1), label: m })) });
const donemAdi = (y: number, m: number) => `${TR_MONTHS[m - 1]} ${y}`;
const sonDonemAdi = (son: string) => donemAdi(Number(son.slice(0, 4)), Number(son.slice(5, 7)));

const TUFE_DATA = { key: () => 'tufe-endeks', load: (_v: Values, signal: AbortSignal) => loadTufe(signal), label: 'TCMB TÜFE (2003=100) endeksi' };
const TUFE_KAYNAK = { label: 'TCMB — TÜFE (2003=100) endeksi', url: 'https://evds2.tcmb.gov.tr/' };

type DonemSonucu =
  | { ok: true; r: { oran: number; bas: number; hedef: number }; adlar: [string, string]; son: string }
  | { ok: false; hata: string | null };

function donemDegisimi(v: Values, ctx: ComputeContext): DonemSonucu {
  const d = ctx.data as TufeVerisi | undefined;
  if (!d) return { ok: false, hata: ctx.dataStatus === 'error' ? 'TÜFE verisi şu an alınamıyor, lütfen biraz sonra tekrar deneyin.' : null };
  const by = Number(s(v, 'baseYear')), bm = Number(s(v, 'baseMonth')), hy = Number(s(v, 'targetYear')), hm = Number(s(v, 'targetMonth'));
  if (hy * 12 + hm < by * 12 + bm) return { ok: false, hata: 'Hedef dönem başlangıç döneminden önce olamaz.' };
  const r = endeksDegisim(d.seri, by, bm, hy, hm);
  if (!r) return { ok: false, hata: `Seçilen dönem için endeks yok. Veri ${sonDonemAdi(d.ilk)} – ${sonDonemAdi(d.son)} arasını kapsıyor.` };
  return { ok: true, r, adlar: [donemAdi(by, bm), donemAdi(hy, hm)], son: d.son };
}

const donemAlanlari = (defBas: [string, string], defHedef: [string, string], baslik: [string, string] = ['Başlangıç', 'Hedef']) => [
  aySec('baseMonth', `${baslik[0]} ayı`, defBas[1]), yilSec('baseYear', `${baslik[0]} yılı`, defBas[0]),
  aySec('targetMonth', `${baslik[1]} ayı`, defHedef[1]), yilSec('targetYear', `${baslik[1]} yılı`, defHedef[0]),
];

export const specs: Record<string, ToolSpec> = {
  'faiz-hesaplama': {
    slug: 'faiz-hesaplama',
    intro: 'Basit veya bileşik faizle anaparanızın dönem sonundaki değerini ve faiz getirisini hesaplayın.',
    fields: [
      { type: 'select', key: 'type', label: 'Faiz türü', default: 'compound', segmented: true, options: [{ value: 'simple', label: 'Basit faiz' }, { value: 'compound', label: 'Bileşik faiz' }], wide: true },
      money('principal', 'Anapara', 100000, { min: 1 }),
      percent('rate', 'Dönem faiz oranı', 3, { max: 1000, help: 'Bir dönemin (ör. aylık) faiz oranı.' }),
      count('periods', 'Dönem sayısı', 12, 'dönem', { integer: true, min: 1, max: 1200 }),
    ],
    compute(v) {
      const P = n(v, 'principal'), r = n(v, 'rate') / 100, k = n(v, 'periods');
      const bilesik = s(v, 'type') === 'compound';
      const toplam = bilesik ? P * (1 + r) ** k : P * (1 + r * k);
      const satirlar: string[][] = [];
      for (let i = 1; i <= Math.min(k, 120); i++) {
        const d = bilesik ? P * (1 + r) ** i : P * (1 + r * i);
        satirlar.push([String(i), tl(d - P), tl(d)]);
      }
      return {
        headline: { label: 'Dönem sonu tutar', value: tl(toplam), sub: `Faiz getirisi ${tl(toplam - P)}`, tone: 'up' },
        rows: [{ label: 'Anapara', value: tl(P) }, { label: 'Faiz getirisi', value: tl(toplam - P), strong: true }, { label: 'Toplam', value: tl(toplam), strong: true }, { label: 'Toplam getiri oranı', value: pct(toplam / P - 1) }],
        table: { caption: 'Dönemlere göre birikim', columns: ['Dönem', 'Birikmiş faiz', 'Toplam'], rows: satirlar, collapseAfter: 12 },
      };
    },
    info: {
      how: ['Basit faizde her dönem yalnızca anapara faiz kazanır. Bileşik faizde kazanılan faiz anaparaya eklenir ve sonraki dönemlerde o da faiz kazanır; bu yüzden getiri katlanarak büyür.'],
      formula: ['Basit: Toplam = P × (1 + r × n)', 'Bileşik: Toplam = P × (1 + r)ⁿ'],
      faqs: [{ q: 'Basit ve bileşik faiz farkı nedir?', a: 'Aynı oran ve sürede bileşik faiz her zaman daha yüksek getiri sağlar; fark süre uzadıkça büyür.' }],
    },
  },

  'vadeli-mevduat': {
    slug: 'vadeli-mevduat',
    intro: 'Vadeli mevduatın brüt faizini, stopajını ve net getirisini vadeye göre hesaplayın.',
    fields: [
      money('amount', 'Anapara', 500000, { min: 1 }),
      percent('rate', 'Yıllık faiz oranı (brüt)', 42, { max: 200 }),
      count('days', 'Vade', 32, 'gün', { integer: true, min: 1, max: 3650 }),
      { type: 'select', key: 'stopaj', label: 'Stopaj', default: 'oto', options: [
        { value: 'oto', label: 'Vadeye göre (otomatik)' }, { value: '17.5', label: '%17,5' }, { value: '15', label: '%15' }, { value: '10', label: '%10' }, { value: '0', label: '%0' },
      ] },
    ],
    compute(v) {
      const gun = n(v, 'days');
      const oto = gun <= 182 ? 17.5 : gun <= 365 ? 15 : 10;
      const oran = s(v, 'stopaj') === 'oto' ? oto : Number(s(v, 'stopaj'));
      const r = gunlukFaiz(n(v, 'amount'), n(v, 'rate') / 100, gun, oran / 100);
      return {
        headline: { label: 'Net faiz getirisi', value: tl(r.net), sub: `Vade sonu ${tl(r.toplam)}`, tone: 'up' },
        rows: [
          { label: 'Brüt faiz', value: tl(r.brut) },
          { label: `Stopaj (%${String(oran).replace('.', ',')})`, value: `− ${tl(r.stopaj)}`, tone: 'down' },
          { label: 'Net faiz', value: tl(r.net), strong: true },
          { label: 'Günlük net', value: tl(r.gunlukNet) },
          { label: 'Vade sonu toplam', value: tl(r.toplam), strong: true },
          { label: 'Net yıllık getiri (basit)', value: pct((r.net / n(v, 'amount')) * (365 / gun)) },
        ],
        warnings: n(v, 'amount') > TMSF_LIMIT ? [`Mevduat sigortası kişi başı ve banka başına ${int(TMSF_LIMIT)} TL’ye kadar; aşan kısım güvence dışındadır.`] : undefined,
      };
    },
    info: {
      how: ['Mevduat faizi basit faiz ve 365 gün esasıyla hesaplanır: anapara × yıllık oran × gün / 365. TL mevduatta 31.12.2026’ya kadar vadesiz ve 6 aya kadar vadelerde %17,5, 1 yıla kadar %15, 1 yıldan uzun vadelerde %10 stopaj kesilir.'],
      formula: ['Brüt faiz = anapara × oran × gün / 365', 'Net faiz = brüt × (1 − stopaj)'],
      faqs: [
        { q: 'Vadeli mevduat güvencede mi?', a: `TMSF kapsamında her bankada kişi başı ${int(TMSF_LIMIT)} TL’ye kadar mevduat sigortalıdır (2026).` },
        { q: 'Vade bozulursa ne olur?', a: 'Banka genellikle faiz ödemez veya vadesiz mevduat faizi uygular; sözleşme koşullarına bakın.' },
      ],
      sources: [{ label: 'TMSF — Mevduat sigortası', url: 'https://www.tmsf.org.tr/tr/Tmsf/Finansman/mevduat.sss.guncel' }],
    },
  },

  'birikim-hesaplama': {
    slug: 'birikim-hesaplama',
    intro: 'Mevcut birikiminize her ay düzenli ekleme yaptığınızda, getiriyle birlikte kaç liraya ulaşacağınızı görün.',
    fields: [
      money('currentSavings', 'Mevcut birikim', 50000, { optional: true }),
      money('monthlyDeposit', 'Aylık birikim', 10000),
      count('months', 'Süre', 36, 'ay', { integer: true, min: 1, max: 1200 }),
      percent('yearlyReturn', 'Yıllık getiri', 30, { max: 500, help: 'Aylık oran = yıllık / 12 (bankaların basit aylık karşılığı).' }),
    ],
    compute(v) {
      const r = n(v, 'yearlyReturn') / 100 / 12;
      const ay = n(v, 'months');
      let t = n(v, 'currentSavings') || 0;
      const satir: string[][] = [];
      for (let i = 1; i <= ay; i++) {
        t = (t + n(v, 'monthlyDeposit')) * (1 + r);
        if (i % 12 === 0 || i === ay) satir.push([`${i}. ay`, tl((n(v, 'currentSavings') || 0) + n(v, 'monthlyDeposit') * i), tl(t)]);
      }
      const yatan = (n(v, 'currentSavings') || 0) + n(v, 'monthlyDeposit') * ay;
      return {
        headline: { label: 'Toplam birikim', value: tl(t), sub: `Getiri ${tl(t - yatan)}`, tone: 'up' },
        rows: [{ label: 'Yatırdığınız toplam', value: tl(yatan) }, { label: 'Getiri', value: tl(t - yatan) }, { label: 'Toplam birikim', value: tl(t), strong: true }],
        table: { caption: 'Yıllara göre birikim', columns: ['Süre', 'Yatırılan', 'Birikim'], rows: satir, collapseAfter: 10 },
        notes: ['Aylık ekleme ay başında yapılır ve o ay getiri kazanır. Vergi ve enflasyon dikkate alınmamıştır.'],
      };
    },
    info: {
      how: ['Her ay başında aylık tutar birikime eklenir ve toplam, aylık getiri oranıyla büyür. Bu bileşik birikim, uzun vadede yatırdığınız tutarın kat kat üzerine çıkabilir.'],
      formula: ['Birikim(ay) = (önceki birikim + aylık ekleme) × (1 + yıllık getiri / 12)'],
      faqs: [{ q: 'Reel getiri kullanmalı mıyım?', a: 'Sonucu bugünkü alım gücüyle görmek istiyorsanız getiri yerine enflasyon üstü (reel) getiri girin.' }],
    },
  },

  'enflasyon-hesaplama': {
    slug: 'enflasyon-hesaplama',
    intro: 'İki dönem arasındaki TÜFE enflasyonunu ve bir tutarın (mal sepetinin) enflasyonla güncellenmiş değerini hesaplayın.',
    fields: [money('amount', 'Tutar', 10000, { min: 0.01 }), ...donemAlanlari(['2025', '1'], ['2026', '1'])],
    data: TUFE_DATA,
    compute(v, ctx) {
      const d = donemDegisimi(v, ctx);
      if (!d.ok) return d.hata ? { error: d.hata } : null;
      const yeni = n(v, 'amount') * (1 + d.r.oran);
      return {
        headline: { label: `${d.adlar[0]} → ${d.adlar[1]} enflasyonu`, value: pct(d.r.oran), sub: `${tl(n(v, 'amount'))} → ${tl(yeni)}`, tone: 'down' },
        rows: [
          { label: `${d.adlar[0]} endeksi`, value: num(d.r.bas, 2) },
          { label: `${d.adlar[1]} endeksi`, value: num(d.r.hedef, 2) },
          { label: 'Dönem enflasyonu', value: pct(d.r.oran), strong: true },
          { label: 'Güncellenmiş tutar', value: tl(yeni), strong: true },
          { label: 'Artış', value: tl(yeni - n(v, 'amount')) },
        ],
        notes: [`Kaynak: TCMB TÜFE (2003=100). Son veri: ${sonDonemAdi(d.son)}.`],
      };
    },
    info: {
      how: ['İki dönem arasındaki enflasyon, TÜFE endeksinin hedef dönemdeki değerinin başlangıç dönemindeki değerine oranından bulunur. Bir tutarın güncel karşılığı bu oranla çarpılarak hesaplanır.'],
      formula: ['Enflasyon = hedef endeks / başlangıç endeksi − 1', 'Güncel tutar = tutar × hedef endeks / başlangıç endeksi'],
      faqs: [
        { q: 'TÜFE nedir?', a: 'Tüketici Fiyat Endeksi; hanelerin tükettiği mal ve hizmet sepetinin fiyat değişimini gösterir ve her ayın 3’ünde TÜİK tarafından açıklanır.' },
        { q: 'Aylık enflasyonlar neden toplanmaz?', a: 'Fiyat artışları birbirinin üzerine eklenir; doğru yöntem endeks oranı veya aylık oranların çarpılmasıdır.' },
      ],
      sources: [TUFE_KAYNAK],
    },
  },

  'parasal-deger': {
    slug: 'parasal-deger',
    intro: 'Geçmiş bir tarihteki paranın bugünkü (veya başka bir dönemdeki) karşılığını TÜFE ile güncelleyin.',
    fields: [money('amount', 'Para tutarı', 1000, { min: 0.01 }), ...donemAlanlari(['2015', '1'], ['2026', '1'], ['Paranın ait olduğu', 'Karşılığı istenen'])],
    data: TUFE_DATA,
    compute(v, ctx) {
      const d = donemDegisimi(v, ctx);
      if (!d.ok) return d.hata ? { error: d.hata } : null;
      const guncel = n(v, 'amount') * (1 + d.r.oran);
      return {
        headline: { label: `${d.adlar[0]} tarihindeki ${tl(n(v, 'amount'))}`, value: tl(guncel), sub: `${d.adlar[1]} fiyatlarıyla`, tone: 'primary' },
        rows: [
          { label: 'Güncellenmiş değer', value: tl(guncel), strong: true },
          { label: 'Değişim oranı', value: pct(d.r.oran) },
          { label: 'Alım gücü kaybı', value: pct(1 - 1 / (1 + d.r.oran)) },
          { label: `${d.adlar[0]} endeksi`, value: num(d.r.bas, 2) },
          { label: `${d.adlar[1]} endeksi`, value: num(d.r.hedef, 2) },
        ],
        notes: [`Kaynak: TCMB TÜFE (2003=100). Son veri: ${sonDonemAdi(d.son)}.`],
      };
    },
    info: {
      how: ['Parasal değer güncellemesi, bir tutarın satın alma gücünü korumak için hangi tutara karşılık geldiğini gösterir; TÜFE endeksleri oranlanarak yapılır. Alacak, tazminat ve kira farkı hesaplarında sık kullanılır.'],
      formula: ['Güncel değer = tutar × hedef endeks / başlangıç endeksi', 'Alım gücü kaybı = 1 − başlangıç / hedef endeks'],
      faqs: [{ q: 'Endeks 2003=100 ne demek?', a: '2003 yılı ortalama fiyat düzeyi 100 kabul edilir; endeks 4.000 ise fiyatlar 2003’e göre 40 katına çıkmıştır.' }],
      sources: [TUFE_KAYNAK],
    },
  },

  'reel-getiri': {
    slug: 'reel-getiri',
    intro: 'Yatırımınızın nominal getirisini aynı dönemin TÜFE enflasyonundan arındırarak gerçek (reel) getirinizi bulun.',
    fields: [money('investment', 'Yatırım tutarı', 100000, { min: 0.01 }), money('endValue', 'Dönem sonu değeri', 145000, { min: 0.01 }), ...donemAlanlari(['2025', '1'], ['2026', '1'], ['Yatırım', 'Çıkış'])],
    data: TUFE_DATA,
    compute(v, ctx) {
      const d = donemDegisimi(v, ctx);
      if (!d.ok) return d.hata ? { error: d.hata } : null;
      const nominal = n(v, 'endValue') / n(v, 'investment') - 1;
      const reel = (1 + nominal) / (1 + d.r.oran) - 1;
      return {
        headline: { label: 'Reel getiri', value: pct(reel), sub: reel >= 0 ? 'Enflasyonu yendiniz' : 'Enflasyonun altında kaldınız', tone: reel >= 0 ? 'up' : 'down' },
        rows: [
          { label: 'Nominal getiri', value: pct(nominal) },
          { label: 'Dönem enflasyonu', value: pct(d.r.oran) },
          { label: 'Reel getiri', value: pct(reel), strong: true, tone: reel >= 0 ? 'up' : 'down' },
          { label: 'Reel kazanç (başlangıç fiyatlarıyla)', value: tl(n(v, 'investment') * reel) },
          { label: 'Enflasyonu karşılamak için gereken değer', value: tl(n(v, 'investment') * (1 + d.r.oran)) },
        ],
        notes: [`Kaynak: TCMB TÜFE (2003=100). Son veri: ${sonDonemAdi(d.son)}.`],
      };
    },
    info: {
      how: ['Reel getiri Fisher denklemiyle hesaplanır: (1 + nominal getiri) / (1 + enflasyon) − 1. Nominal getiriden enflasyonu çıkarmak yalnızca düşük oranlarda yaklaşık sonuç verir.'],
      formula: ['Reel getiri = (1 + nominal) / (1 + enflasyon) − 1'],
      faqs: [{ q: 'Negatif reel getiri ne demek?', a: 'Paranız nominal olarak artsa bile alım gücünüz azalmıştır.' }],
      sources: [TUFE_KAYNAK],
    },
  },

  'kira-artis-orani': {
    slug: 'kira-artis-orani',
    intro: 'Kira artışının yasal üst sınırı TÜFE’nin 12 aylık ortalamalara göre değişimidir. Mevcut kiranızı girin; oran TÜFE’den otomatik hesaplansın veya kendiniz girin.',
    fields: [
      { type: 'select', key: 'propertyType', label: 'Kiralanan', default: 'konut', segmented: true, options: [{ value: 'konut', label: 'Konut' }, { value: 'isyeri', label: 'İş yeri' }] },
      money('currentRent', 'Mevcut aylık kira', 20000, { min: 1 }),
      { type: 'select', key: 'kaynak', label: 'Artış oranı', default: 'son', options: [
        { value: 'son', label: 'Son açıklanan TÜFE 12 aylık ortalama' }, { value: 'ay', label: 'Belirli bir ayın TÜFE oranı' }, { value: 'elle', label: 'Oranı kendim gireceğim' },
      ], wide: true },
      { ...aySec('ay', 'Ay', '6'), showIf: (v) => v.kaynak === 'ay', help: 'Kira artışında, kira döneminin yenilendiği aydan önceki ayın oranı kullanılır.' },
      { ...yilSec('yil', 'Yıl', String(GUNCEL_YIL - 1)), showIf: (v) => v.kaynak === 'ay' },
      percent('rate', 'Artış oranı', 32, { max: 1000, showIf: (v) => v.kaynak === 'elle' }),
    ],
    data: { ...TUFE_DATA, key: (v) => (v.kaynak === 'elle' ? null : 'tufe-endeks') },
    compute(v, ctx) {
      let oran: number;
      let aciklama: string;
      if (s(v, 'kaynak') === 'elle') {
        oran = n(v, 'rate') / 100;
        aciklama = 'Girdiğiniz oran';
      } else {
        const d = ctx.data as TufeVerisi | undefined;
        if (!d) return ctx.dataStatus === 'error' ? { error: 'TÜFE verisi alınamadı; oranı kendiniz girin.' } : null;
        const [y, m] = s(v, 'kaynak') === 'son' ? [Number(d.son.slice(0, 4)), Number(d.son.slice(5, 7))] : [Number(s(v, 'yil')), Number(s(v, 'ay'))];
        const o = onikiAylikOrtalamaDegisim(d.seri, y, m);
        if (o == null) return { error: `${donemAdi(y, m)} için 12 aylık ortalama hesaplanamıyor (son veri: ${sonDonemAdi(d.son)}).` };
        oran = o;
        aciklama = `${donemAdi(y, m)} TÜFE 12 aylık ortalamalara göre değişim`;
      }
      const artis = n(v, 'currentRent') * oran;
      return {
        headline: { label: 'Yeni aylık kira (azami)', value: tl(n(v, 'currentRent') + artis), sub: `${aciklama}: ${pct(oran)}`, tone: 'primary' },
        rows: [
          { label: 'Mevcut kira', value: tl(n(v, 'currentRent')) },
          { label: 'Artış oranı', value: pct(oran) },
          { label: 'Aylık artış', value: tl(artis) },
          { label: 'Yeni aylık kira', value: tl(n(v, 'currentRent') + artis), strong: true },
          { label: 'Yeni yıllık kira', value: tl((n(v, 'currentRent') + artis) * 12) },
        ],
        notes: ['Bu oran yasal üst sınırdır; taraflar daha düşük bir artışta anlaşabilir. 5 yılı dolduran kira ilişkilerinde kira bedeli hâkim tarafından yeniden belirlenebilir.'],
      };
    },
    info: {
      how: ['Türk Borçlar Kanunu md. 344’e göre konut ve çatılı iş yeri kiralarında yenilenen dönemdeki kira artışı, bir önceki kira yılındaki TÜFE’nin 12 aylık ortalamalara göre değişimini geçemez.', 'Bu oran TÜFE endeksinden hesaplanır: son 12 ayın endeks ortalaması, önceki 12 ayın ortalamasına bölünür. Hesabımız TÜİK’in açıkladığı oranlarla aynıdır (ör. Haziran 2024: %65,07; Haziran 2025: %43,23).'],
      formula: ['Oran = (son 12 ay endeks ortalaması / önceki 12 ay ortalaması) − 1', 'Yeni kira = mevcut kira × (1 + oran)'],
      faqs: [
        { q: 'Kira artışında hangi ayın oranı kullanılır?', a: 'Kira sözleşmesinin yenilendiği aydan bir önceki ayın TÜFE 12 aylık ortalama değişimi. Örneğin Temmuz’da yenilenen kira için Haziran oranı esas alınır.' },
        { q: 'İş yeri kiralarında da sınır var mı?', a: 'Evet, çatılı iş yeri kiralarında da TÜFE 12 aylık ortalama sınırı uygulanır.' },
      ],
      sources: [TUFE_KAYNAK, { label: '6098 sayılı Türk Borçlar Kanunu md. 344', url: 'https://www.mevzuat.gov.tr/mevzuat?MevzuatNo=6098&MevzuatTur=1&MevzuatTertip=5' }],
    },
  },
};
