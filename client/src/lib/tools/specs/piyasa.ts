// Altın, döviz, menkul kıymet, nakit akışı, iskonto ve IBAN araçları.

import type { ToolSpec } from '../types';
import { tl, pct, num } from '../format';
import { count, dateField, money, n, percent, s } from './_shared';
import { DOVIZ_SECENEKLERI, GECMIS_DOVIZ_SECENEKLERI, loadAltin, loadDoviz, loadGecmisAltin, loadGecmisKur, type FiyatTablosu, type TarihliFiyat } from './_data';
import {
  ALTIN_TURLERI, basitGetiri, cagr, eurobond, hasIcerik, ibanDogrula, icVerimOrani, iskonto, netBugunkuDeger, ortalamaVade,
  sermayeIslemi, vadeliFiyat, type AltinTuru, type IskontoTuru, type SermayeIslem,
} from '@/lib/calculators/piyasa';
import { addDays, addYears, fmtDateTr } from '@/lib/calculators/core';
import { DIBS_STOPAJ, REPO_STOPAJ } from '@/lib/calculators/params';

const fiyatBirimi = (x: number) => (x >= 100 ? tl(x) : `${num(x, 4)} ₺`);

// ── Altın ──
// Serbest piyasa (kuyumcu) canlı fiyat adları
const CANLI_ALTIN: Record<string, { ad: string; api: string; birim: string }> = {
  gram24: { ad: 'Gram altın (24 ayar)', api: 'Gram Altın', birim: 'gram' },
  gram22: { ad: '22 ayar bilezik (gram)', api: '22 Ayar Bilezik', birim: 'gram' },
  gram18: { ad: '18 ayar (gram)', api: '18 Ayar Bilezik', birim: 'gram' },
  gram14: { ad: '14 ayar (gram)', api: '14 Ayar Bilezik', birim: 'gram' },
  ceyrek: { ad: 'Çeyrek altın', api: 'Çeyrek Altın', birim: 'adet' },
  yarim: { ad: 'Yarım altın', api: 'Yarım Altın', birim: 'adet' },
  tam: { ad: 'Tam altın', api: 'Tam Altın', birim: 'adet' },
  cumhuriyet: { ad: 'Cumhuriyet altını', api: 'Cumhuriyet Altını', birim: 'adet' },
  ata: { ad: 'Ata altın', api: 'Ata Altın', birim: 'adet' },
  resat: { ad: 'Reşat altın', api: 'Reşat Altın', birim: 'adet' },
  gremse: { ad: 'Gremse altın', api: 'Gremse Altın', birim: 'adet' },
  besli: { ad: 'Beşli altın', api: 'Beşli Altın', birim: 'adet' },
};

export const specs: Record<string, ToolSpec> = {
  'altin-hesaplama': {
    slug: 'altin-hesaplama',
    intro: 'Elinizdeki altının bugünkü değerini ya da bir tutarla kaç gram/adet altın alabileceğinizi serbest piyasa (kuyumcu) canlı fiyatlarıyla hesaplayın.',
    fields: [
      { type: 'select', key: 'direction', label: 'İşlem', default: 'toMoney', segmented: true, options: [{ value: 'toMoney', label: 'Altını bozdur (TL karşılığı)' }, { value: 'toGold', label: 'Altın al (kaç adet?)' }], wide: true },
      { type: 'select', key: 'goldType', label: 'Altın türü', default: 'ceyrek', options: Object.entries(CANLI_ALTIN).map(([k, x]) => ({ value: k, label: x.ad })) },
      { type: 'number', key: 'amount', label: 'Miktar / tutar', default: 5, min: 0, help: 'Bozdurmada gram veya adet; almada TL tutarı.' },
      money('fiyat', 'Birim fiyat (isteğe bağlı)', null, { optional: true, placeholderFrom: (d, v) => { const f = (d as FiyatTablosu)[CANLI_ALTIN[v.goldType as string]?.api]; return f ? `Canlı: ${num(v.direction === 'toMoney' ? f.alis : f.satis, 2)}` : undefined; }, help: 'Boş bırakırsanız canlı fiyat kullanılır.' }),
    ],
    data: { key: () => 'altin-canli', load: (_v, signal) => loadAltin(signal) },
    compute(v, ctx) {
      const t = CANLI_ALTIN[s(v, 'goldType')];
      const bozdur = s(v, 'direction') === 'toMoney';
      let birim = n(v, 'fiyat');
      let kaynak = 'Girdiğiniz fiyat';
      if (!Number.isFinite(birim)) {
        const f = (ctx.data as FiyatTablosu | undefined)?.[t.api];
        if (!f) return ctx.dataStatus === 'loading' ? null : { error: 'Canlı fiyat alınamadı; birim fiyatı elle girin.' };
        birim = bozdur ? f.alis : f.satis;
        kaynak = `Serbest piyasa ${bozdur ? 'alış' : 'satış'} fiyatı${f.zaman ? ` (${new Date(f.zaman).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })})` : ''}`;
      }
      if (bozdur) {
        const deger = n(v, 'amount') * birim;
        return { headline: { label: `${num(n(v, 'amount'), 3)} ${t.birim} ${t.ad.toLowerCase()}`, value: tl(deger), sub: `${kaynak}: ${tl(birim)}`, tone: 'up' }, rows: [{ label: 'Birim fiyat', value: tl(birim) }, { label: 'Miktar', value: `${num(n(v, 'amount'), 3)} ${t.birim}` }, { label: 'Toplam değer', value: tl(deger), strong: true }], notes: ['Bozdururken kuyumcunun alış fiyatı geçerlidir. Kuyumcular arasında fark olabilir.'] };
      }
      const adet = n(v, 'amount') / birim;
      return { headline: { label: `${tl(n(v, 'amount'))} ile alınabilecek`, value: `${num(adet, t.birim === 'gram' ? 3 : 2)} ${t.birim}`, sub: `${kaynak}: ${tl(birim)}`, tone: 'primary' }, rows: [{ label: 'Birim fiyat', value: tl(birim) }, { label: 'Tutar', value: tl(n(v, 'amount')) }, { label: t.ad, value: `${num(adet, 3)} ${t.birim}`, strong: true }], notes: ['Alırken kuyumcunun satış fiyatı geçerlidir; ziynet ve bilezikte işçilik fiyata dahildir.'] };
    },
    info: {
      how: ['Altını bozdurduğunuzda kuyumcunun alış fiyatı, aldığınızda satış fiyatı uygulanır; aradaki fark (makas) işlem maliyetinizdir. Araç, sitedeki serbest piyasa fiyatlarını kullanır.', 'Çeyrek, yarım ve tam altın Darphane standardında 22 ayardır; brüt ağırlıkları 1,754 g, 3,508 g ve 7,016 g’dır.'],
      faqs: [
        { q: 'Çeyrek altın kaç gram?', a: 'Çeyrek altın 22 ayar ve 1,754 gramdır; içinde yaklaşık 1,61 gram saf altın bulunur.' },
        { q: 'Neden gram fiyatı × ağırlık ile çeyrek fiyatı tutmuyor?', a: 'Ziynet altınlarda işçilik ve piyasa talebi fiyata yansır; bu yüzden çeyrek, içerdiği has altının değerinden biraz farklı işlem görür.' },
      ],
    },
  },

  'doviz-hesaplama': {
    slug: 'doviz-hesaplama',
    intro: 'Dolar, euro, sterlin ve diğer para birimleri arasında serbest piyasa canlı kurlarıyla çeviri yapın.',
    fields: [
      { type: 'number', key: 'amount', label: 'Miktar', default: 1000, min: 0 },
      { type: 'select', key: 'from', label: 'Kaynak para birimi', default: 'USD', options: DOVIZ_SECENEKLERI },
      { type: 'select', key: 'to', label: 'Hedef para birimi', default: 'TRY', options: DOVIZ_SECENEKLERI },
      { type: 'select', key: 'kur', label: 'Kur', default: 'orta', segmented: true, options: [{ value: 'orta', label: 'Ortalama' }, { value: 'banka', label: 'Alış / satış' }], help: '“Alış / satış”ta kaynak dövizi bozdurur, hedef dövizi satın alırsınız.' },
      money('fromRate', 'Kaynak kur (1 birim = ? TL)', null, { optional: true }),
      money('toRate', 'Hedef kur (1 birim = ? TL)', null, { optional: true }),
    ],
    data: { key: () => 'doviz-canli', load: (_v, signal) => loadDoviz(signal) },
    compute(v, ctx) {
      const d = ctx.data as FiyatTablosu | undefined;
      const kur = (kod: string, yon: 'alis' | 'satis', elle: number) => {
        if (Number.isFinite(elle)) return elle;
        const f = d?.[kod];
        if (!f) return NaN;
        return s(v, 'kur') === 'orta' ? (f.alis + f.satis) / 2 : f[yon];
      };
      const k1 = kur(s(v, 'from'), 'alis', n(v, 'fromRate'));
      const k2 = kur(s(v, 'to'), 'satis', n(v, 'toRate'));
      if (!Number.isFinite(k1) || !Number.isFinite(k2)) return ctx.dataStatus === 'loading' ? null : { error: 'Kur alınamadı; kurları elle girin.' };
      const sonuc = (n(v, 'amount') * k1) / k2;
      return {
        headline: { label: `${num(n(v, 'amount'), 2)} ${s(v, 'from')} =`, value: `${num(sonuc, 4)} ${s(v, 'to')}`, sub: `1 ${s(v, 'from')} = ${num(k1 / k2, 4)} ${s(v, 'to')}`, tone: 'primary' },
        rows: [
          { label: `${s(v, 'from')} kuru (TL)`, value: fiyatBirimi(k1) },
          { label: `${s(v, 'to')} kuru (TL)`, value: fiyatBirimi(k2) },
          { label: 'Çapraz kur', value: `1 ${s(v, 'from')} = ${num(k1 / k2, 6)} ${s(v, 'to')}` },
          { label: 'Sonuç', value: `${num(sonuc, 4)} ${s(v, 'to')}`, strong: true },
        ],
        notes: ['Kaynak: serbest piyasa kurları. Bankaların uyguladığı kurlar farklı olabilir.'],
      };
    },
    info: {
      how: ['İki döviz arasındaki çeviri, her iki kurun TL karşılığı üzerinden çapraz kurla yapılır: tutar × kaynak kur / hedef kur. Ortalama kur alış ve satışın ortasıdır; gerçek işlemde kaynak döviz alış, hedef döviz satış kurundan işlem görür.'],
      formula: ['Sonuç = tutar × kaynak kur / hedef kur'],
      faqs: [{ q: 'Alış ve satış kuru farkı nedir?', a: 'Alış, döviz bürosunun sizden dövizi aldığı; satış, size sattığı fiyattır. Satış kuru her zaman daha yüksektir.' }],
    },
  },

  'gecmis-altin-fiyatlari': {
    slug: 'gecmis-altin-fiyatlari',
    intro: 'Geçmiş bir tarihteki gram altın fiyatını bulun; o tarihte belirli miktar altının değerini veya bir tutarla kaç gram alınabileceğini hesaplayın.',
    fields: [
      dateField('tarih', 'Tarih', (t) => addYears(t, -1)),
      { type: 'select', key: 'goldType', label: 'Altın türü', default: 'gram24', options: (Object.keys(ALTIN_TURLERI) as AltinTuru[]).filter((k) => k !== 'ons').map((k) => ({ value: k, label: ALTIN_TURLERI[k].ad })) },
      { type: 'select', key: 'direction', label: 'İşlem', default: 'toMoney', segmented: true, options: [{ value: 'toMoney', label: 'Altının değeri' }, { value: 'toGold', label: 'Tutarla kaç adet?' }] },
      { type: 'number', key: 'amount', label: 'Miktar / tutar', default: 10, min: 0 },
      money('gramPrice', 'O tarihteki gram fiyatı (isteğe bağlı)', null, { optional: true, placeholderFrom: (d) => (d ? `Kapanış: ${num((d as TarihliFiyat).deger, 2)}` : undefined) }),
    ],
    data: { key: (v) => (v.tarih ? `gecmis-altin:${v.tarih}` : null), load: (v, signal) => loadGecmisAltin(v.tarih as string, signal) },
    compute(v, ctx) {
      const d = ctx.data as TarihliFiyat | undefined;
      const gram = Number.isFinite(n(v, 'gramPrice')) ? n(v, 'gramPrice') : d?.deger;
      if (gram == null) return ctx.dataStatus === 'loading' ? null : { error: 'Bu tarih için fiyat bulunamadı; gram fiyatını elle girin.' };
      const tur = s(v, 'goldType') as AltinTuru;
      const birimDeger = hasIcerik(tur, 1) * gram;
      const tarih = !Number.isFinite(n(v, 'gramPrice')) && d ? d.tarih : s(v, 'tarih');
      const notlar = [tur === 'gram24' ? '' : 'Ziynet ve ayarlı altınlarda değer, has altın içeriği × gram fiyatı olarak hesaplanır; kuyumcu fiyatı işçilik nedeniyle farklı olabilir.', d && !Number.isFinite(n(v, 'gramPrice')) && d.tarih !== s(v, 'tarih') ? `Seçilen gün işlem günü olmadığından ${fmtDateTr(d.tarih)} kapanışı kullanıldı.` : ''].filter(Boolean);
      if (s(v, 'direction') === 'toMoney') {
        const deger = n(v, 'amount') * birimDeger;
        return { headline: { label: `${fmtDateTr(tarih)} değeri`, value: tl(deger), sub: `Gram altın ${tl(gram)}`, tone: 'primary' }, rows: [{ label: 'Gram altın (24 ayar)', value: tl(gram) }, { label: `1 ${ALTIN_TURLERI[tur].ad.toLowerCase()} değeri`, value: tl(birimDeger) }, { label: 'Toplam değer', value: tl(deger), strong: true }], notes: notlar };
      }
      const adet = n(v, 'amount') / birimDeger;
      return { headline: { label: `${fmtDateTr(tarih)} tarihinde ${tl(n(v, 'amount'))} ile`, value: `${num(adet, 3)} ${tur.startsWith('gram') ? 'gram' : 'adet'}`, sub: `Gram altın ${tl(gram)}`, tone: 'primary' }, rows: [{ label: 'Gram altın (24 ayar)', value: tl(gram) }, { label: 'Alınabilecek miktar', value: num(adet, 3), strong: true }], notes: notlar };
    },
    info: {
      how: ['Seçilen tarihteki (tatil veya hafta sonuysa önceki son işlem günündeki) serbest piyasa gram altın kapanış fiyatı kullanılır. Diğer altın türlerinin değeri has altın içeriğinden hesaplanır.'],
      faqs: [{ q: 'Geçmiş altın fiyatları nereden geliyor?', a: 'Sitedeki serbest piyasa gram altın fiyat geçmişinden; aynı veri altın grafiklerinde de kullanılır.' }],
    },
  },

  'gecmis-doviz-kurlari': {
    slug: 'gecmis-doviz-kurlari',
    intro: 'Geçmiş bir tarihteki döviz kurunu (TCMB) bulun ve o kurla TL karşılığını hesaplayın.',
    fields: [
      { type: 'select', key: 'code', label: 'Para birimi', default: 'USD', options: GECMIS_DOVIZ_SECENEKLERI },
      dateField('tarih', 'Tarih', (t) => addYears(t, -1)),
      { type: 'number', key: 'amount', label: 'Döviz miktarı', default: 1000, min: 0 },
      money('rate', 'O tarihteki kur (isteğe bağlı)', null, { optional: true, placeholderFrom: (d) => (d ? `Kur: ${num((d as TarihliFiyat).deger, 4)}` : undefined) }),
    ],
    data: { key: (v) => (v.tarih && v.code ? `gecmis-kur:${v.code}:${v.tarih}` : null), load: (v, signal) => loadGecmisKur(v.code as string, v.tarih as string, signal) },
    compute(v, ctx) {
      const d = ctx.data as (TarihliFiyat & { kaynak: string }) | undefined;
      const kur = Number.isFinite(n(v, 'rate')) ? n(v, 'rate') : d?.deger;
      if (kur == null) return ctx.dataStatus === 'loading' ? null : { error: 'Bu tarih için kur bulunamadı; kuru elle girin.' };
      const tarih = !Number.isFinite(n(v, 'rate')) && d ? d.tarih : s(v, 'tarih');
      return {
        headline: { label: `${num(n(v, 'amount'), 2)} ${s(v, 'code')} (${fmtDateTr(tarih)})`, value: tl(n(v, 'amount') * kur), sub: `1 ${s(v, 'code')} = ${num(kur, 4)} ₺`, tone: 'primary' },
        rows: [{ label: 'Kur', value: `${num(kur, 4)} ₺` }, { label: 'Kaynak', value: Number.isFinite(n(v, 'rate')) ? 'Girdiğiniz kur' : d!.kaynak }, { label: 'TL karşılığı', value: tl(n(v, 'amount') * kur), strong: true }],
        notes: d && !Number.isFinite(n(v, 'rate')) && d.tarih !== s(v, 'tarih') ? [`Seçilen gün kur açıklanmadığından ${fmtDateTr(d.tarih)} kuru kullanıldı.`] : undefined,
      };
    },
    info: {
      how: ['Seçilen tarihte (tatil veya hafta sonuysa önceki son iş gününde) geçerli TCMB kuru kullanılır; TCMB verisi yoksa serbest piyasa kapanışı alınır.'],
      faqs: [{ q: 'Resmi işlemlerde hangi kur kullanılır?', a: 'Vergi ve muhasebe işlemlerinde genellikle TCMB döviz alış kuru esas alınır.' }],
    },
  },

  'sermaye-temettu': {
    slug: 'sermaye-temettu',
    intro: 'Temettü dağıtımı, bedelsiz veya bedelli sermaye artırımı ve sermaye azaltımı sonrası hisse adedinizi ve teorik fiyatı hesaplayın.',
    fields: [
      { type: 'select', key: 'type', label: 'İşlem', default: 'bedelsiz', options: [{ value: 'temettu', label: 'Nakit temettü' }, { value: 'bedelsiz', label: 'Bedelsiz sermaye artırımı' }, { value: 'bedelli', label: 'Bedelli sermaye artırımı' }, { value: 'azaltim', label: 'Sermaye azaltımı' }], wide: true },
      count('shares', 'Hisse adedi', 1000, 'lot', { integer: true }),
      money('price', 'İşlem öncesi hisse fiyatı', 50, { min: 0.01 }),
      percent('rate', 'Oran', 100, { max: 10000, help: 'Temettüde temettü verimi; artırım/azaltımda sermayeye oranı (ör. %100 bedelsiz = her hisseye 1 yeni hisse).' }),
    ],
    compute(v) {
      const tur = s(v, 'type') as SermayeIslem;
      const oran = n(v, 'rate') / 100;
      if (tur === 'azaltim' && oran >= 1) return { error: 'Azaltım oranı %100’den küçük olmalı.' };
      const r = sermayeIslemi(tur, n(v, 'shares'), n(v, 'price'), oran);
      return {
        headline: { label: 'Teorik fiyat', value: tl(r.yeniFiyat), sub: `${num(r.yeniAdet, 2)} hisse · portföy ${tl(r.toplamDeger)}`, tone: 'primary' },
        rows: [
          { label: 'Yeni hisse adedi', value: num(r.yeniAdet, 2) },
          { label: 'Teorik (düzeltilmiş) fiyat', value: tl(r.yeniFiyat), strong: true },
          { label: 'Portföy değeri', value: tl(r.toplamDeger) },
          ...(tur === 'temettu' ? [{ label: 'Brüt temettü', value: tl(r.nakit) }, { label: 'Net temettü (%15 stopaj)', value: tl(r.nakit * 0.85) }] : []),
          ...(tur === 'bedelli' ? [{ label: 'Rüçhan ödemesi (1 ₺ nominal)', value: tl(-r.nakit) }] : []),
        ],
        notes: ['Kesirli hak kuponları borsada satılabilir. Teorik fiyat, işlem günü açılış baz fiyatıdır; piyasa fiyatı farklı oluşabilir.'],
      };
    },
    info: {
      how: ['Bedelsiz artırımda hisse sayısı (1 + oran) katına çıkar, fiyat aynı oranda düşer; toplam değer değişmez. Bedelli artırımda yeni paylar 1 TL nominal bedelle alınır; teorik fiyat (fiyat + oran × 1) / (1 + oran) olur. Temettüde fiyat, hisse başı temettü kadar düzeltilir.'],
      formula: ['Bedelsiz: P′ = P / (1 + o)', 'Bedelli: P′ = (P + o × 1 ₺) / (1 + o)', 'Temettü: P′ = P − hisse başı temettü', 'Azaltım: P′ = P / (1 − o)'],
      faqs: [{ q: 'Bedelsiz sermaye artırımı değer yaratır mı?', a: 'Hayır, teorik olarak portföy değeri değişmez; yalnızca hisse sayısı artar ve fiyat bölünür.' }],
    },
  },

  'bono-hesaplama': {
    slug: 'bono-hesaplama',
    intro: 'Hazine bonosunun vadeye kadar getirisini ve stopaj sonrası net kazancınızı hesaplayın.',
    fields: [
      money('principal', 'Yatırım tutarı', 100000, { min: 1 }),
      percent('rate', 'Yıllık faiz oranı (basit)', 40, { max: 200 }),
      count('days', 'Vadeye kalan gün', 91, 'gün', { integer: true, min: 1, max: 366 }),
      { type: 'select', key: 'stopaj', label: 'Stopaj', default: String(DIBS_STOPAJ * 100), segmented: true, options: [{ value: '0', label: '%0 (2021 sonrası alım)' }, { value: '10', label: '%10' }, { value: '15', label: '%15' }] },
    ],
    compute(v) {
      const r = basitGetiri(n(v, 'principal'), n(v, 'rate') / 100, n(v, 'days'), Number(s(v, 'stopaj')) / 100);
      return { headline: { label: 'Net getiri', value: tl(r.net), sub: `Vade sonu ${tl(r.toplam)}`, tone: 'up' }, rows: [{ label: 'Brüt getiri', value: tl(r.brut) }, { label: 'Stopaj', value: tl(r.stopaj) }, { label: 'Net getiri', value: tl(r.net), strong: true }, { label: 'Vade sonu toplam', value: tl(r.toplam) }] };
    },
    info: {
      how: ['Getiri basit faiz ve 365 gün esasıyla hesaplanır. 22.12.2021 – 31.12.2026 arasında edinilen devlet tahvili ve hazine bonolarından gerçek kişilerin elde ettiği gelirlerde stopaj oranı %0’dır.'],
      formula: ['Getiri = anapara × oran × gün / 365'],
      faqs: [{ q: 'Hazine bonosu ile tahvil farkı nedir?', a: 'Vadesi 1 yıla kadar olan devlet borçlanma senedine bono, daha uzun olanlara tahvil denir.' }],
      sources: [{ label: 'Yöntem YMM — Stopaj oranlarının süresi uzatıldı (2026)', url: 'https://www.yontemymm.com.tr/mali-aciklamalar/2026-041-tl-mevduat-hesaplarinda-uygulanan-stopaj-oranlarinin-suresi-uzatildi' }],
    },
  },

  'tahvil-hesaplama': {
    slug: 'tahvil-hesaplama',
    intro: 'Devlet tahvilinin vadeye kadar faiz getirisini ve stopaj sonrası net kazancını hesaplayın.',
    fields: [
      money('amount', 'Yatırım tutarı', 100000, { min: 1 }),
      percent('rate', 'Yıllık faiz oranı', 38, { max: 200 }),
      count('days', 'Vade', 730, 'gün', { integer: true, min: 1, max: 36500 }),
      { type: 'select', key: 'stopaj', label: 'Stopaj', default: String(DIBS_STOPAJ * 100), segmented: true, options: [{ value: '0', label: '%0 (2021 sonrası alım)' }, { value: '10', label: '%10' }, { value: '15', label: '%15' }] },
    ],
    compute(v) {
      const r = basitGetiri(n(v, 'amount'), n(v, 'rate') / 100, n(v, 'days'), Number(s(v, 'stopaj')) / 100);
      return { headline: { label: 'Net getiri', value: tl(r.net), sub: `Vade sonu ${tl(r.toplam)}`, tone: 'up' }, rows: [{ label: 'Brüt getiri', value: tl(r.brut) }, { label: 'Stopaj', value: tl(r.stopaj) }, { label: 'Net getiri', value: tl(r.net), strong: true }, { label: 'Vade sonu toplam', value: tl(r.toplam) }], notes: ['Kupon ödemelerinin yeniden yatırılması hesaba katılmamıştır (basit faiz).'] };
    },
    info: {
      how: ['Getiri basit faiz ve 365 gün esasıyla hesaplanır. 22.12.2021 – 31.12.2026 arasında edinilen devlet tahvillerinde gerçek kişiler için stopaj %0’dır.'],
      formula: ['Getiri = anapara × oran × gün / 365'],
      faqs: [{ q: 'Tahvil vadesinden önce satılabilir mi?', a: 'Evet, Borsa İstanbul Borçlanma Araçları Piyasası’nda satılabilir; satış fiyatı piyasa faizine göre değişir.' }],
    },
  },

  'repo-hesaplama': {
    slug: 'repo-hesaplama',
    intro: 'Repo yatırımının brüt getirisini, %15 stopajı ve net kazancı hesaplayın.',
    fields: [
      money('amount', 'Anapara', 100000, { min: 1 }),
      percent('rate', 'Yıllık repo oranı', 38, { max: 200 }),
      count('days', 'Vade', 1, 'gün', { integer: true, min: 1, max: 366 }),
    ],
    compute(v) {
      const r = basitGetiri(n(v, 'amount'), n(v, 'rate') / 100, n(v, 'days'), REPO_STOPAJ);
      return { headline: { label: 'Net getiri', value: tl(r.net), sub: `Vade sonu ${tl(r.toplam)}`, tone: 'up' }, rows: [{ label: 'Brüt getiri', value: tl(r.brut) }, { label: 'Stopaj (%15)', value: tl(r.stopaj) }, { label: 'Net getiri', value: tl(r.net), strong: true }, { label: 'Vade sonu toplam', value: tl(r.toplam) }] };
    },
    info: {
      how: ['Repo, menkul kıymetin belirli bir vadede geri alınması taahhüdüyle yapılan kısa vadeli yatırımdır. Getiri basit faiz ve 365 gün esasıyla hesaplanır; gerçek kişilerin repo gelirinden %15 stopaj kesilir.'],
      formula: ['Getiri = anapara × oran × gün / 365', 'Net = getiri × (1 − %15)'],
      faqs: [{ q: 'Repo ile mevduat arasındaki fark nedir?', a: 'Repo genellikle gecelik veya çok kısa vadelidir ve teminatı devlet tahvili gibi menkul kıymetlerdir; mevduat ise TMSF güvencesindedir.' }],
      sources: [{ label: 'Gedik Yatırım — Repo gelirlerinin vergilendirilmesi', url: 'https://gedik.com/yazilar/vergilendirme/repo-gelirlerinin-vergilendirilmesi' }],
    },
  },

  'eurobond-hesaplama': {
    slug: 'eurobond-hesaplama',
    intro: 'Eurobondun alış maliyetini, kupon gelirlerini ve vadeye kadar getirisini (YTM) hesaplayın.',
    fields: [
      { type: 'select', key: 'currency', label: 'Para birimi', default: 'USD', segmented: true, options: [{ value: 'USD', label: 'USD ($)' }, { value: 'EUR', label: 'EUR (€)' }] },
      { type: 'select', key: 'couponPayment', label: 'Kupon ödemesi', default: 'semiannual', segmented: true, options: [{ value: 'semiannual', label: '6 ayda bir' }, { value: 'annual', label: 'Yıllık' }] },
      percent('couponRate', 'Kupon oranı (yıllık)', 6.5, { max: 50 }),
      percent('cleanPrice', 'Temiz fiyat', 97.5, { min: 1, max: 300, help: 'Nominalin yüzdesi olarak (ör. 97,5).' }),
      count('quantity', 'Adet (1.000 nominal)', 10, 'adet', { integer: true, min: 1 }),
      count('yearsToMaturity', 'Vadeye kalan süre', 5, 'yıl', { min: 0.5, max: 50 }),
    ],
    compute(v) {
      const cur = s(v, 'currency') === 'USD' ? '$' : '€';
      const f = (x: number) => `${num(x, 2, 2)} ${cur}`;
      const r = eurobond(n(v, 'cleanPrice'), n(v, 'couponRate'), n(v, 'yearsToMaturity'), n(v, 'quantity'), s(v, 'couponPayment') === 'annual' ? 1 : 2);
      if (!r) return { error: 'Geçerli fiyat ve vade girin.' };
      return {
        headline: { label: 'Vadeye kadar getiri (YTM)', value: pct(r.ytm), sub: `Cari getiri ${pct(r.cariGetiri)}`, tone: 'up' },
        rows: [
          { label: 'Alış maliyeti', value: f(r.maliyet) },
          { label: 'Dönem kuponu', value: f(r.donemKupon) },
          { label: 'Yıllık kupon geliri', value: f(r.yillikKupon) },
          { label: 'Toplam kupon geliri', value: f(r.toplamKupon) },
          { label: 'Vade sonu anapara', value: f(r.vadeDegeri) },
          { label: 'YTM (kesin)', value: pct(r.ytm), strong: true },
          { label: 'YTM (yaklaşık formül)', value: pct(r.ytmYaklasik) },
        ],
        notes: ['Birikmiş (işlemiş) faiz ve aracı kurum komisyonu dahil değildir; tam kupon dönemleri varsayılmıştır.'],
      };
    },
    info: {
      how: ['Vadeye kadar getiri, tahvilin bugünkü fiyatını gelecekteki kupon ve anapara ödemelerinin bugünkü değerine eşitleyen orandır. Araç bu denklemi sayısal olarak çözer (kesin YTM); piyasada kullanılan yaklaşık formülü de karşılaştırma için gösterir.'],
      formula: ['Fiyat = Σ C / (1 + y/k)ᵗ + 1000 / (1 + y/k)ⁿ', 'Yaklaşık YTM = (C + (1000 − F) / N) / ((1000 + F) / 2)'],
      faqs: [{ q: 'Temiz fiyat ile kirli fiyat farkı nedir?', a: 'Kirli fiyat, temiz fiyata son kupon tarihinden bu yana işlemiş faizin eklenmiş halidir; alımda kirli fiyat ödenir.' }],
    },
  },

  'bilesik-buyume': {
    slug: 'bilesik-buyume',
    intro: 'Başlangıç ve bitiş değerinden yıllık (veya aylık) bileşik büyüme oranını (CAGR) hesaplayın.',
    fields: [
      { type: 'select', key: 'periodType', label: 'Dönem', default: 'year', segmented: true, options: [{ value: 'year', label: 'Yıl' }, { value: 'month', label: 'Ay' }] },
      money('startValue', 'Başlangıç değeri', 100000, { min: 0.01 }),
      money('endValue', 'Bitiş değeri', 180000, { min: 0.01 }),
      count('periods', 'Dönem sayısı', 5, 'dönem', { min: 0.01 }),
    ],
    compute(v) {
      const g = cagr(n(v, 'startValue'), n(v, 'endValue'), n(v, 'periods'));
      const birim = s(v, 'periodType') === 'year' ? 'yıllık' : 'aylık';
      return { headline: { label: `Bileşik ${birim} büyüme`, value: pct(g), sub: `Toplam büyüme ${pct(n(v, 'endValue') / n(v, 'startValue') - 1)}`, tone: g >= 0 ? 'up' : 'down' }, rows: [{ label: 'CAGR', value: pct(g), strong: true }, { label: 'Toplam büyüme', value: pct(n(v, 'endValue') / n(v, 'startValue') - 1) }, ...(s(v, 'periodType') === 'month' ? [{ label: 'Yıllık karşılığı', value: pct((1 + g) ** 12 - 1) }] : [])] };
    },
    info: {
      how: ['CAGR, bir değerin dönem başından sonuna her dönem sabit oranda büyüseydi hangi oranla büyüyeceğini gösterir; dalgalanmaları düzleştirir.'],
      formula: ['CAGR = (bitiş / başlangıç)^(1 / dönem) − 1'],
      faqs: [{ q: 'Ortalama getiri ile CAGR neden farklı?', a: 'Aritmetik ortalama dalgalanmayı dikkate almaz; %50 kazanıp %50 kaybeden yatırımın ortalaması %0, CAGR’ı ise −%13,4’tür.' }],
    },
  },

  'net-bugunku-deger': {
    slug: 'net-bugunku-deger',
    intro: 'Başlangıç yatırımını ve dönemlik nakit akışlarını girin; iskonto oranına göre net bugünkü değeri (NBD/NPV) hesaplayın.',
    fields: [
      percent('discountRate', 'Dönemlik iskonto oranı', 25, { max: 1000 }),
      money('initialCost', 'Başlangıç yatırımı', 100000, { optional: true }),
      { type: 'rows', key: 'cf', label: 'Nakit akışları (dönem sonu)', columns: [{ key: 'cf', label: 'Tutar', unit: '₺' }], default: [[40000], [50000], [60000]], maxRows: 50, addLabel: 'Dönem ekle' },
    ],
    legacyQuery: (sp) => {
      const cf = sp.get('cf');
      const out: Record<string, number | number[][]> = {};
      // Eski biçim virgülle ayrılır (cf=100,200); yeni biçimde satırlar ~ ile ayrılır
      if (cf?.includes(',')) {
        out.cf = cf.split(',').map((x) => [Number(x) || 0]);
        // Eski araçta başlangıç yatırımı alanı yoktu
        if (sp.get('initialCost') == null) out.initialCost = 0;
      }
      return out;
    },
    compute(v) {
      const akis = (v.cf as number[][]).map((r) => r[0]);
      const oran = n(v, 'discountRate') / 100;
      const npv = netBugunkuDeger(oran, akis, n(v, 'initialCost') || 0);
      return {
        headline: { label: 'Net bugünkü değer', value: tl(npv), sub: npv >= 0 ? 'Yatırım iskonto oranının üzerinde getiri sağlıyor' : 'Yatırım iskonto oranını karşılamıyor', tone: npv >= 0 ? 'up' : 'down' },
        table: { columns: ['Dönem', 'Nakit akışı', 'Bugünkü değer'], rows: akis.map((c, i) => [String(i + 1), tl(c), tl(c / (1 + oran) ** (i + 1))]) },
        rows: [{ label: 'Başlangıç yatırımı', value: tl(n(v, 'initialCost') || 0) }, { label: 'Akışların bugünkü değeri', value: tl(npv + (n(v, 'initialCost') || 0)) }, { label: 'NBD', value: tl(npv), strong: true }],
      };
    },
    info: {
      how: ['Her dönemin nakit akışı (1 + iskonto oranı)^dönem ile indirgenip toplanır; başlangıç yatırımı düşülür. NBD pozitifse yatırım, iskonto oranı kadar getiri beklentisini karşılar.'],
      formula: ['NBD = Σ CFₜ / (1 + r)ᵗ − başlangıç yatırımı'],
      faqs: [{ q: 'İskonto oranı nasıl seçilir?', a: 'Genellikle sermaye maliyeti veya alternatif yatırımın getirisi kullanılır.' }],
    },
  },

  'ic-verim-orani': {
    slug: 'ic-verim-orani',
    intro: 'Başlangıç yatırımını ve dönemlik nakit girişlerini girin; net bugünkü değeri sıfırlayan iç verim oranını (İVO/IRR) bulun.',
    fields: [
      money('initialCost', 'Başlangıç yatırımı', 100000, { min: 0.01 }),
      { type: 'rows', key: 'cf', label: 'Nakit akışları (dönem sonu)', columns: [{ key: 'cf', label: 'Tutar', unit: '₺' }], default: [[40000], [50000], [60000]], maxRows: 50, addLabel: 'Dönem ekle' },
    ],
    legacyQuery: (sp) => {
      const cf = sp.get('cf');
      const out: Record<string, number[][]> = {};
      if (cf?.includes(',')) out.cf = cf.split(',').map((x) => [Number(x) || 0]);
      return out;
    },
    compute(v) {
      const akis = (v.cf as number[][]).map((r) => r[0]);
      const irr = icVerimOrani(n(v, 'initialCost'), akis);
      if (irr == null) return { error: 'Bu nakit akışları için iç verim oranı bulunamadı (akışlar yatırımı hiç karşılamıyor olabilir).' };
      return {
        headline: { label: 'İç verim oranı (dönemlik)', value: pct(irr), sub: `Toplam giriş ${tl(akis.reduce((a, c) => a + c, 0))}`, tone: irr >= 0 ? 'up' : 'down' },
        rows: [{ label: 'İVO', value: pct(irr), strong: true }, { label: 'Kontrol: bu oranla NBD', value: tl(netBugunkuDeger(irr, akis, n(v, 'initialCost'))) }],
      };
    },
    info: {
      how: ['İç verim oranı, nakit akışlarının bugünkü değerini başlangıç yatırımına eşitleyen iskonto oranıdır. İVO, sermaye maliyetinden yüksekse yatırım kârlıdır.'],
      formula: ['Σ CFₜ / (1 + İVO)ᵗ = başlangıç yatırımı'],
      faqs: [{ q: 'Aylık akışlarda yıllık İVO nasıl bulunur?', a: 'Aylık İVO’yu (1 + İVO)¹² − 1 ile yıllığa çevirin.' }],
    },
  },

  'vadeli-islem-fiyati': {
    slug: 'vadeli-islem-fiyati',
    intro: 'Taşıma maliyeti modeliyle bir vadeli işlem sözleşmesinin teorik fiyatını hesaplayın.',
    fields: [
      money('spotPrice', 'Spot fiyat', 10000, { min: 0.01 }),
      percent('riskFreeRate', 'Risksiz faiz (yıllık)', 40, { max: 500 }),
      percent('dividendYield', 'Temettü verimi (yıllık)', 0, { optional: true, max: 100 }),
      count('days', 'Vadeye kalan gün', 60, 'gün', { integer: true, min: 1, max: 3650 }),
    ],
    compute(v) {
      const f = vadeliFiyat(n(v, 'spotPrice'), n(v, 'riskFreeRate') / 100, (n(v, 'dividendYield') || 0) / 100, n(v, 'days'));
      return { headline: { label: 'Teorik vadeli fiyat', value: tl(f), sub: `Baz (vadeli − spot) ${tl(f - n(v, 'spotPrice'))}`, tone: 'primary' }, rows: [{ label: 'Spot fiyat', value: tl(n(v, 'spotPrice')) }, { label: 'Taşıma maliyeti', value: tl(f - n(v, 'spotPrice')) }, { label: 'Teorik fiyat', value: tl(f), strong: true }] };
    },
    info: {
      how: ['Vadeli fiyat, spot fiyata vadeye kadarki finansman maliyetinin eklenmesi ve dayanak varlığın sağladığı getirinin (temettü) düşülmesiyle bulunur. VİOP’ta basit faizli taşıma maliyeti modeli yaygındır.'],
      formula: ['F = S × (1 + (r − d) × gün / 365)'],
      faqs: [{ q: 'Piyasa fiyatı teorik fiyattan neden farklı?', a: 'Beklentiler, likidite ve arz-talep nedeniyle vadeli fiyat teorik değerden sapabilir; büyük sapmalar arbitraj fırsatı yaratır.' }],
    },
  },

  // ── Ticaret ──
  'ic-dis-iskonto': {
    slug: 'ic-dis-iskonto',
    intro: 'Senet ve bonolarda vadeden önce tahsilde yapılacak iskontoyu (dış, iç veya bileşik) hesaplayın.',
    fields: [
      { type: 'select', key: 'type', label: 'Yöntem', default: 'outer', options: [{ value: 'outer', label: 'Dış iskonto (nominal → peşin)' }, { value: 'inner', label: 'İç iskonto (peşin → nominal)' }, { value: 'compound', label: 'Bileşik iskonto (peşin → nominal)' }], wide: true },
      money('value', 'Tutar', 100000, { min: 0.01, help: 'Dış iskontoda senedin nominal (vade) değeri; iç/bileşikte peşin değer.' }),
      percent('rate', 'Yıllık iskonto oranı', 45, { max: 500 }),
      count('days', 'Vadeye kalan gün', 90, 'gün', { integer: true, min: 1, max: 3600 }),
    ],
    compute(v) {
      const tur: IskontoTuru = s(v, 'type') === 'outer' ? 'dis' : s(v, 'type') === 'inner' ? 'ic' : 'bilesik';
      const r = iskonto(tur, n(v, 'value'), n(v, 'rate') / 100, n(v, 'days'));
      if (!r) return { error: 'Oran ve süre çok yüksek; iç iskonto tanımsız.' };
      return tur === 'dis'
        ? { headline: { label: 'Peşin değer', value: tl(r.diger), sub: `İskonto ${tl(r.iskonto)}`, tone: 'primary' }, rows: [{ label: 'Nominal değer', value: tl(n(v, 'value')) }, { label: 'İskonto tutarı', value: tl(r.iskonto) }, { label: 'Peşin değer', value: tl(r.diger), strong: true }] }
        : { headline: { label: 'Nominal (vade) değer', value: tl(r.diger), sub: `İskonto ${tl(r.iskonto)}`, tone: 'primary' }, rows: [{ label: 'Peşin değer', value: tl(n(v, 'value')) }, { label: 'İskonto tutarı', value: tl(r.iskonto) }, { label: 'Nominal değer', value: tl(r.diger), strong: true }] };
    },
    info: {
      how: ['Ticari hesaplarda yıl 360 gün kabul edilir. Dış iskontoda iskonto nominal değer üzerinden hesaplanır (bankaların senet kırdırma uygulaması). İç iskontoda peşin değer üzerinden hesaplanır ve alacaklı için daha adildir.'],
      formula: ['Dış iskonto = N × r × g / 360', 'İç iskonto: N = P × 360 / (360 − r × g)', 'Bileşik: N = P × (1 + r)^(g/360)'],
      faqs: [{ q: 'Senet kırdırmada hangi yöntem kullanılır?', a: 'Bankalar genellikle dış iskonto uygular; bu yöntem iç iskontoya göre daha yüksek kesinti demektir.' }],
    },
  },

  'ortalama-vade': {
    slug: 'ortalama-vade',
    intro: 'Birden fazla çek veya senedin tutarlarına göre ağırlıklı ortalama vadesini hesaplayın.',
    fields: [
      { type: 'rows', key: 'kalem', label: 'Çek / senetler', columns: [{ key: 'tutar', label: 'Tutar', unit: '₺' }, { key: 'gun', label: 'Vade', unit: 'gün' }], default: [[50000, 30], [80000, 60], [120000, 90]], maxRows: 50, addLabel: 'Kalem ekle' },
      dateField('bas', 'Başlangıç tarihi (isteğe bağlı)', (t) => t, { optional: true, help: 'Ortalama vade tarihini görmek için.' }),
    ],
    legacyQuery: (sp) => {
      const d = sp.get('d');
      const a = sp.get('a');
      const out: Record<string, number[][]> = {};
      if (!d || !a) return out;
      const dd = d.split(',').map(Number);
      out.kalem = a.split(',').map((x, i) => [Number(x) || 0, dd[i] || 0]);
      return out;
    },
    compute(v) {
      const r = ortalamaVade((v.kalem as number[][]).map(([tutar, gun]) => ({ tutar, gun })));
      if (!r) return null;
      const tarih = v.bas ? addDays(s(v, 'bas'), Math.round(r.gun)) : null;
      return {
        headline: { label: 'Ortalama vade', value: `${num(r.gun, 1)} gün`, sub: tarih ? `Ortalama vade tarihi ${fmtDateTr(tarih)}` : `Toplam ${tl(r.toplam)}`, tone: 'primary' },
        rows: [{ label: 'Toplam tutar', value: tl(r.toplam) }, { label: 'Ağırlıklı ortalama vade', value: `${num(r.gun, 2)} gün`, strong: true }, ...(tarih ? [{ label: 'Ortalama vade tarihi', value: fmtDateTr(tarih, true) }] : [])],
      };
    },
    info: {
      how: ['Her kalemin vadesi tutarıyla ağırlıklandırılır; büyük tutarlı çeklerin vadesi ortalamayı daha çok etkiler.'],
      formula: ['Ortalama vade = Σ(tutar × gün) / Σ tutar'],
      faqs: [{ q: 'Ortalama vade ne işe yarar?', a: 'Birden fazla çek/senedi tek vadeye indirgeyerek iskonto, faiz ve pazarlık hesaplarını kolaylaştırır.' }],
    },
  },

  'iban-dogrulama': {
    slug: 'iban-dogrulama',
    intro: 'IBAN numarasının geçerli olup olmadığını MOD-97 kontrolüyle doğrulayın ve Türk IBAN’larında bankayı görün.',
    fields: [{ type: 'text', key: 'iban', label: 'IBAN', default: 'TR33 0006 1005 1978 6457 8413 26', placeholder: 'TR00 0000 0000 0000 0000 0000 00', uppercase: true }],
    compute(v) {
      const r = ibanDogrula(s(v, 'iban'));
      return {
        headline: r.gecerli ? { label: 'IBAN geçerli', value: '✓ Geçerli', sub: r.banka ?? r.bicimli, tone: 'up' } : { label: 'IBAN geçersiz', value: '✕ Geçersiz', sub: r.hata, tone: 'down' },
        rows: [
          { label: 'Biçimli', value: r.bicimli },
          { label: 'Ülke', value: r.ulke || '—' },
          ...(r.ulke === 'TR' ? [{ label: 'Banka kodu', value: r.bankaKodu ?? '—' }, { label: 'Banka', value: r.banka ?? 'Listede yok' }] : []),
          { label: 'Uzunluk', value: `${r.bicimli.replace(/ /g, '').length} karakter` },
        ],
        notes: ['Doğrulama yalnızca IBAN’ın biçimini ve kontrol hanelerini kontrol eder; hesabın açık olduğunu veya kime ait olduğunu göstermez. IBAN bilgisi tarayıcınızdan dışarı gönderilmez.'],
      };
    },
    info: {
      how: ['IBAN’ın ilk dört karakteri sona alınır, harfler sayıya çevrilir (A=10 … Z=35) ve elde edilen sayının 97’ye bölümünden kalan 1 ise IBAN geçerlidir (ISO 13616). Türk IBAN’ı 26 karakterdir: TR + 2 kontrol hanesi + 5 haneli banka kodu + 1 rezerv hane + 16 haneli hesap numarası.', 'Banka adı, TCMB Ödeme Sistemleri Katılımcıları listesindeki (2026) kodlardan bulunur.'],
      faqs: [{ q: 'Geçerli IBAN hesabın var olduğunu gösterir mi?', a: 'Hayır. Yalnızca yazım hatası olup olmadığını gösterir; hesabın varlığını ve sahibini banka doğrular.' }],
      sources: [{ label: 'TCMB — Ödeme Sistemleri Katılımcıları (2026)', url: 'https://www.tcmb.gov.tr/wps/wcm/connect/9fa62a85-5b6d-46c5-9b01-eb461d43723d/TCMB+%C3%96deme+Sistemleri+Kat%C4%B1l%C4%B1mc%C4%B1lar%C4%B1+(2025).pdf?MOD=AJPERES' }],
    },
  },
};

