// Yüzde, ticaret, tarih, yakıt ve enerji araçları.

import type { ToolSpec } from '../types';
import { tl, pctv, num, int } from '../format';
import { b, count, dateField, money, n, percent, s } from './_shared';
import {
  basabas, fatura, indirim, indirimOrani, karMarji, marjdanSatis, markuptanSatis, pesinMiTaksit, roi, yuzde, type YuzdeModu,
} from '@/lib/calculators/ticaret';
import { gunFarki, isGunuSay, tarihEkle, yas, type Birim } from '@/lib/calculators/tarih';
import { elektrikTuketimi, sarjMaliyeti, yakitMaliyeti, yakitTuketimi } from '@/lib/calculators/enerji';
import { TR_WEEKDAYS, addDays, addMonths, fmtDateTr, fmtYmd, weekday } from '@/lib/calculators/core';

const YUZDE_ETIKET: Record<YuzdeModu, [string, string, string]> = {
  yuzdesi: ['Sayı', 'Yüzde', 'A sayısının %B’si'],
  oran: ['Parça (A)', 'Bütün (B)', 'A, B’nin yüzde kaçı?'],
  degisim: ['Eski değer', 'Yeni değer', 'Yüzde artış / azalış'],
  ekle: ['Sayı', 'Eklenecek yüzde', 'Sayıya yüzde ekle'],
  cikar: ['Sayı', 'Düşülecek yüzde', 'Sayıdan yüzde düş'],
};

export const specs: Record<string, ToolSpec> = {
  'yuzde-hesaplama': {
    slug: 'yuzde-hesaplama',
    intro: 'Bir sayının yüzdesini, iki sayı arasındaki yüzde oranını veya yüzde değişimi tek araçta hesaplayın.',
    fields: [
      { type: 'select', key: 'mod', label: 'Ne hesaplamak istiyorsunuz?', default: 'yuzdesi', wide: true, options: (Object.keys(YUZDE_ETIKET) as YuzdeModu[]).map((k) => ({ value: k, label: YUZDE_ETIKET[k][2] })) },
      { type: 'number', key: 'a', label: 'A', default: 250, min: -1e15 },
      { type: 'number', key: 'b', label: 'B', default: 20, min: -1e15 },
    ],
    compute(v) {
      const mod = s(v, 'mod') as YuzdeModu;
      const a = n(v, 'a');
      const bb = n(v, 'b');
      const r = yuzde(mod, a, bb);
      if (!Number.isFinite(r)) return { error: 'Bölen sıfır olamaz.' };
      const [la, lb] = YUZDE_ETIKET[mod];
      const cumle: Record<YuzdeModu, string> = {
        yuzdesi: `${num(a)} sayısının %${num(bb)}’si ${num(r, 4)}`,
        oran: `${num(a)}, ${num(bb)} sayısının %${num(r, 4)}’i`,
        degisim: `${num(a)} → ${num(bb)}: %${num(r, 4)} ${r >= 0 ? 'artış' : 'azalış'}`,
        ekle: `${num(a)} + %${num(bb)} = ${num(r, 4)}`,
        cikar: `${num(a)} − %${num(bb)} = ${num(r, 4)}`,
      };
      const isPct = mod === 'oran' || mod === 'degisim';
      return {
        headline: { label: YUZDE_ETIKET[mod][2], value: isPct ? pctv(r, 4) : num(r, 4), sub: cumle[mod], tone: mod === 'degisim' ? (r >= 0 ? 'up' : 'down') : 'primary' },
        rows: [
          { label: la, value: num(a, 4) },
          { label: lb, value: num(bb, 4) },
          { label: 'Sonuç', value: isPct ? pctv(r, 4) : num(r, 4), strong: true },
          ...(mod === 'ekle' || mod === 'cikar' ? [{ label: 'Fark', value: num(Math.abs(r - a), 4) }] : []),
        ],
      };
    },
    info: {
      how: [
        'Bir sayının yüzdesi: sayı × yüzde / 100. Bir sayının diğerinin yüzde kaçı olduğu: parça / bütün × 100. Yüzde değişim: (yeni − eski) / eski × 100.',
        'Yüzde ekleme sayıyı (1 + oran), yüzde düşme (1 − oran) ile çarpar. %20 artıp ardından %20 azalan bir değer başlangıca dönmez: 100 → 120 → 96.',
      ],
      formula: ['A’nın %B’si = A × B / 100', 'A, B’nin yüzde kaçı = A / B × 100', 'Değişim = (yeni − eski) / eski × 100'],
      faqs: [
        { q: 'Yüzde artış nasıl hesaplanır?', a: 'Yeni değerden eskiyi çıkarıp eskiye bölün ve 100 ile çarpın. 200’den 250’ye artış: (250 − 200) / 200 × 100 = %25.' },
        { q: 'Yüzde ile yüzde puan farkı nedir?', a: 'Faiz %40’tan %50’ye çıkarsa artış 10 yüzde puandır; yüzde olarak ise %25’tir.' },
      ],
    },
  },

  'indirim-hesaplama': {
    slug: 'indirim-hesaplama',
    intro: 'Etiket fiyatına indirim uygulayın, iki fiyattan indirim oranını bulun veya art arda uygulanan indirimlerin toplam etkisini görün.',
    fields: [
      { type: 'select', key: 'mod', label: 'Hesap', default: 'fiyat', segmented: true, options: [{ value: 'fiyat', label: 'İndirimli fiyat' }, { value: 'oran', label: 'İndirim oranı' }] },
      money('fiyat', 'Etiket fiyatı', 2500),
      percent('o1', 'İndirim', 30, { max: 100, showIf: (v) => v.mod === 'fiyat' }),
      percent('o2', 'Ek indirim (ardışık)', 0, { max: 100, optional: true, showIf: (v) => v.mod === 'fiyat', help: 'Sepette ek indirim gibi; ilk indirimden sonraki fiyata uygulanır.' }),
      money('yeni', 'İndirimli fiyat', 1999, { showIf: (v) => v.mod === 'oran' }),
    ],
    compute(v) {
      if (s(v, 'mod') === 'oran') {
        const o = indirimOrani(n(v, 'fiyat'), n(v, 'yeni'));
        if (!Number.isFinite(o)) return { error: 'Etiket fiyatı sıfır olamaz.' };
        return {
          headline: { label: 'İndirim oranı', value: pctv(o), sub: `Tasarruf ${tl(n(v, 'fiyat') - n(v, 'yeni'))}`, tone: o >= 0 ? 'up' : 'down' },
          rows: [{ label: 'Etiket fiyatı', value: tl(n(v, 'fiyat')) }, { label: 'İndirimli fiyat', value: tl(n(v, 'yeni')) }, { label: 'İndirim oranı', value: pctv(o), strong: true }],
        };
      }
      const oranlar = [n(v, 'o1'), n(v, 'o2') || 0].filter((x) => x > 0);
      const r = indirim(n(v, 'fiyat'), oranlar);
      return {
        headline: { label: 'İndirimli fiyat', value: tl(r.indirimli), sub: `Tasarruf ${tl(r.tasarruf)} · toplam indirim ${pctv(r.toplamOran)}`, tone: 'up' },
        rows: [
          { label: 'Etiket fiyatı', value: tl(n(v, 'fiyat')) },
          { label: 'Tasarruf', value: tl(r.tasarruf) },
          { label: 'İndirimli fiyat', value: tl(r.indirimli), strong: true },
          ...(oranlar.length > 1 ? [{ label: 'Toplam etkin indirim', value: pctv(r.toplamOran), hint: 'Ardışık indirimler toplanmaz, çarpılır' }] : []),
        ],
      };
    },
    info: {
      how: [
        'İndirimli fiyat = etiket fiyatı × (1 − indirim / 100). Art arda uygulanan indirimler toplanmaz: %30 + %20 ek indirim toplam %50 değil, 1 − 0,70 × 0,80 = %44’tür.',
      ],
      formula: ['İndirimli fiyat = fiyat × (1 − o₁)(1 − o₂)', 'İndirim oranı = (eski − yeni) / eski × 100'],
      faqs: [{ q: '%50 + %20 indirim kaç yapar?', a: 'Toplam %60’tır: 1 − 0,50 × 0,80 = 0,60.' }],
    },
  },

  'kar-marji-hesaplama': {
    slug: 'kar-marji-hesaplama',
    intro: 'Maliyet ve satış fiyatından kâr marjını ve kâr oranını bulun ya da hedef marjınıza göre satış fiyatını hesaplayın.',
    fields: [
      { type: 'select', key: 'mod', label: 'Hesap', default: 'marj', options: [
        { value: 'marj', label: 'Maliyet ve satıştan kâr marjı' }, { value: 'hedefMarj', label: 'Hedef kâr marjından satış fiyatı' }, { value: 'hedefMarkup', label: 'Maliyet üzerine kâr oranından satış fiyatı' },
      ], wide: true },
      money('maliyet', 'Birim maliyet (KDV hariç)', 80),
      money('satis', 'Satış fiyatı (KDV hariç)', 100, { showIf: (v) => v.mod === 'marj' }),
      percent('oran', 'Hedef oran', 25, { max: 99.99, showIf: (v) => v.mod !== 'marj' }),
      { type: 'select', key: 'kdv', label: 'KDV (satış fiyatına eklenecek)', default: '20', segmented: true, options: [{ value: '0', label: 'Yok' }, { value: '1', label: '%1' }, { value: '10', label: '%10' }, { value: '20', label: '%20' }] },
    ],
    compute(v) {
      const m = n(v, 'maliyet');
      const satis = s(v, 'mod') === 'marj' ? n(v, 'satis') : s(v, 'mod') === 'hedefMarj' ? marjdanSatis(m, n(v, 'oran')) : markuptanSatis(m, n(v, 'oran'));
      if (!Number.isFinite(satis)) return { error: 'Kâr marjı %100’den küçük olmalı.' };
      const r = karMarji(m, satis);
      const kdv = Number(s(v, 'kdv')) / 100;
      return {
        headline: s(v, 'mod') === 'marj'
          ? { label: 'Kâr marjı', value: pctv(r.marj), sub: `Maliyet üzerine kâr oranı ${pctv(r.markup)} · birim kâr ${tl(r.kar)}`, tone: r.kar >= 0 ? 'up' : 'down' }
          : { label: 'Satış fiyatı (KDV hariç)', value: tl(satis), sub: `KDV dahil ${tl(satis * (1 + kdv))}`, tone: 'primary' },
        rows: [
          { label: 'Maliyet', value: tl(m) },
          { label: 'Satış fiyatı (KDV hariç)', value: tl(satis) },
          { label: 'Birim kâr', value: tl(r.kar), tone: r.kar >= 0 ? 'up' : 'down' },
          { label: 'Kâr marjı (kâr / satış)', value: pctv(r.marj), strong: true },
          { label: 'Kâr oranı / markup (kâr / maliyet)', value: pctv(r.markup), strong: true },
          ...(kdv ? [{ label: `Satış fiyatı KDV dahil (%${s(v, 'kdv')})`, value: tl(satis * (1 + kdv)) }] : []),
        ],
      };
    },
    info: {
      how: [
        'Kâr marjı kârın satış fiyatına, kâr oranı (markup) ise maliyete oranıdır. 80 TL’ye alınıp 100 TL’ye satılan üründe kâr marjı %20, maliyet üzerine kâr oranı %25’tir.',
        'Hedef marjdan fiyat bulmak için maliyet (1 − marj)’a bölünür; maliyete %25 eklemek %25 marj sağlamaz.',
      ],
      formula: ['Kâr marjı = (satış − maliyet) / satış', 'Markup = (satış − maliyet) / maliyet', 'Satış (hedef marj) = maliyet / (1 − marj)'],
      faqs: [
        { q: 'Kâr marjı ile kâr oranı arasındaki fark nedir?', a: 'Marj satış fiyatını, kâr oranı maliyeti baz alır. Aynı kâr için kâr oranı her zaman marjdan yüksektir.' },
        { q: 'KDV kâr marjına dahil edilir mi?', a: 'Hayır. KDV devlete ödenen bir vergidir; marj ve kâr oranı KDV hariç tutarlarla hesaplanmalıdır.' },
      ],
    },
  },

  'zam-hesaplama': {
    slug: 'zam-hesaplama',
    intro: 'Maaş veya fiyata yüzde zam uygulayın, iki tutar arasındaki zam oranını bulun ya da zamlı tutardan zam öncesini hesaplayın.',
    fields: [
      { type: 'select', key: 'mod', label: 'Hesap', default: 'uygula', options: [
        { value: 'uygula', label: 'Tutara zam uygula' }, { value: 'oran', label: 'Eski ve yeni tutardan zam oranı' }, { value: 'geri', label: 'Zamlı tutardan zam öncesi' },
      ], wide: true },
      money('eski', 'Mevcut / eski tutar', 40000, { showIf: (v) => v.mod !== 'geri' }),
      money('yeni', 'Yeni / zamlı tutar', 50000, { showIf: (v) => v.mod !== 'uygula' }),
      percent('oran', 'Zam oranı', 25, { showIf: (v) => v.mod !== 'oran' }),
    ],
    compute(v) {
      const mod = s(v, 'mod');
      if (mod === 'uygula') {
        const yeni = n(v, 'eski') * (1 + n(v, 'oran') / 100);
        return { headline: { label: 'Zamlı tutar', value: tl(yeni), sub: `Artış ${tl(yeni - n(v, 'eski'))}`, tone: 'up' }, rows: [{ label: 'Eski tutar', value: tl(n(v, 'eski')) }, { label: 'Zam', value: `%${num(n(v, 'oran'))}` }, { label: 'Artış', value: tl(yeni - n(v, 'eski')) }, { label: 'Yeni tutar', value: tl(yeni), strong: true }] };
      }
      if (mod === 'oran') {
        if (!(n(v, 'eski') > 0)) return { error: 'Eski tutar sıfırdan büyük olmalı.' };
        const o = (n(v, 'yeni') / n(v, 'eski') - 1) * 100;
        return { headline: { label: 'Zam oranı', value: pctv(o), sub: `Fark ${tl(n(v, 'yeni') - n(v, 'eski'))}`, tone: o >= 0 ? 'up' : 'down' }, rows: [{ label: 'Eski tutar', value: tl(n(v, 'eski')) }, { label: 'Yeni tutar', value: tl(n(v, 'yeni')) }, { label: 'Zam oranı', value: pctv(o), strong: true }] };
      }
      const eski = n(v, 'yeni') / (1 + n(v, 'oran') / 100);
      return { headline: { label: 'Zam öncesi tutar', value: tl(eski), sub: `Zam tutarı ${tl(n(v, 'yeni') - eski)}`, tone: 'primary' }, rows: [{ label: 'Zamlı tutar', value: tl(n(v, 'yeni')) }, { label: 'Zam oranı', value: `%${num(n(v, 'oran'))}` }, { label: 'Zam öncesi', value: tl(eski), strong: true }] };
    },
    info: {
      how: [
        'Zamlı tutar = eski × (1 + zam / 100). Zam oranı = (yeni / eski − 1) × 100. Zamlı tutardan eskiye dönmek için zamlı tutar (1 + zam)’a bölünür; zam oranı kadar indirim yapmak eski tutarı vermez.',
      ],
      formula: ['Yeni = eski × (1 + oran)', 'Oran = yeni / eski − 1', 'Eski = yeni / (1 + oran)'],
      faqs: [{ q: '%25 zamlı fiyattan %25 indirim eski fiyatı verir mi?', a: 'Hayır. 100 TL %25 zamla 125 TL olur; 125 TL’ye %25 indirim 93,75 TL eder. Eski fiyat için 125 / 1,25 = 100 hesaplanmalıdır.' }],
    },
  },

  'basabas-noktasi-hesaplama': {
    slug: 'basabas-noktasi-hesaplama',
    intro: 'Aylık sabit giderlerinizi, birim satış fiyatınızı ve birim değişken maliyetinizi girin; kâra geçmek için kaç adet satmanız gerektiğini görün.',
    fields: [
      money('sabit', 'Sabit giderler (dönemlik)', 150000, { help: 'Kira, maaş, abonelik gibi satıştan bağımsız giderler.' }),
      money('fiyat', 'Birim satış fiyatı (KDV hariç)', 250),
      money('degisken', 'Birim değişken maliyet', 150, { help: 'Hammadde, komisyon, kargo gibi her satışta oluşan maliyet.' }),
      money('hedef', 'Hedef kâr', 0, { optional: true }),
    ],
    compute(v) {
      const r = basabas(n(v, 'sabit'), n(v, 'fiyat'), n(v, 'degisken'), n(v, 'hedef') || 0);
      if (!r) return { error: 'Satış fiyatı birim değişken maliyetten yüksek olmalı.' };
      return {
        headline: { label: n(v, 'hedef') > 0 ? 'Hedef kâr için satış adedi' : 'Başabaş satış adedi', value: `${int(r.adetYuvarli)} adet`, sub: `Ciro ${tl(r.ciro)}`, tone: 'primary' },
        rows: [
          { label: 'Birim katkı payı (fiyat − değişken maliyet)', value: tl(r.birimKatki) },
          { label: 'Katkı payı oranı', value: pctv(r.katkiOrani) },
          { label: 'Gereken satış', value: `${num(r.adet, 2)} adet`, strong: true },
          { label: 'Gereken ciro', value: tl(r.ciro), strong: true },
        ],
      };
    },
    info: {
      how: ['Başabaş noktası, toplam gelirin toplam gidere eşit olduğu satış miktarıdır. Her satış, fiyat ile değişken maliyet arasındaki farkı (katkı payı) sabit giderleri karşılamaya ayırır.'],
      formula: ['Başabaş adedi = (sabit gider + hedef kâr) / (fiyat − birim değişken maliyet)', 'Başabaş cirosu = adet × fiyat'],
      faqs: [{ q: 'Başabaş noktası nasıl düşürülür?', a: 'Sabit giderleri azaltarak, fiyatı artırarak veya birim değişken maliyeti düşürerek (katkı payını büyüterek).' }],
    },
  },

  'roi-hesaplama': {
    slug: 'roi-hesaplama',
    intro: 'Yatırdığınız tutarı ve geri dönen toplam tutarı girin; yatırım getirisi ve süreye göre yıllık bileşik getiri hesaplansın.',
    fields: [
      money('yatirim', 'Yatırım tutarı', 100000),
      money('donus', 'Dönen toplam tutar', 150000),
      count('yil', 'Süre', 2, 'yıl', { optional: true, help: 'Yıllıklandırılmış getiri için.' }),
    ],
    compute(v) {
      if (!(n(v, 'yatirim') > 0)) return { error: 'Yatırım tutarı sıfırdan büyük olmalı.' };
      const r = roi(n(v, 'yatirim'), n(v, 'donus'), n(v, 'yil') || 0);
      return {
        headline: { label: 'ROI', value: pctv(r.roi), sub: r.yillik != null ? `Yıllık bileşik getiri ${pctv(r.yillik)}` : `Kazanç ${tl(r.kazanc)}`, tone: r.kazanc >= 0 ? 'up' : 'down' },
        rows: [
          { label: 'Net kazanç', value: tl(r.kazanc), tone: r.kazanc >= 0 ? 'up' : 'down' },
          { label: 'ROI', value: pctv(r.roi), strong: true },
          ...(r.yillik != null ? [{ label: 'Yıllıklandırılmış (CAGR)', value: pctv(r.yillik), strong: true }] : []),
        ],
      };
    },
    info: {
      how: ['ROI (return on investment), net kazancın yatırım tutarına oranıdır. Farklı sürelerdeki yatırımları kıyaslamak için yıllıklandırılmış (bileşik) getiri kullanılır.'],
      formula: ['ROI = (dönüş − yatırım) / yatırım × 100', 'Yıllık = (dönüş / yatırım)^(1 / yıl) − 1'],
      faqs: [{ q: 'ROI enflasyonu dikkate alır mı?', a: 'Hayır, nominaldir. Reel getiriyi görmek için Reel Getiri aracını kullanın.' }],
    },
  },

  'pesin-mi-taksit-mi-hesaplama': {
    slug: 'pesin-mi-taksit-mi-hesaplama',
    intro: 'Peşin fiyatı, taksit tutarını ve sayısını girin; paranızı değerlendirebileceğiniz getiriye göre hangisinin avantajlı olduğunu görün.',
    fields: [
      money('pesin', 'Peşin fiyat', 50000),
      money('taksit', 'Aylık taksit', 5000),
      count('n', 'Taksit sayısı', 12, 'ay', { integer: true, min: 1, max: 120 }),
      percent('getiri', 'Paranızın aylık getirisi', 3, { max: 50, help: 'Peşin ödemeyeceğiniz parayı değerlendirebileceğiniz aylık net getiri (ör. mevduat).' }),
      { type: 'toggle', key: 'ilk', label: 'İlk taksit bugün ödenecek', default: false },
    ],
    compute(v) {
      const r = pesinMiTaksit(n(v, 'pesin'), n(v, 'taksit'), n(v, 'n'), n(v, 'getiri') / 100, b(v, 'ilk'));
      const avantaj = r.avantaj === 'taksit' ? 'Taksitli alım avantajlı' : r.avantaj === 'pesin' ? 'Peşin alım avantajlı' : 'İki seçenek eşdeğer';
      return {
        headline: { label: avantaj, value: tl(Math.abs(r.fark)), sub: 'bugünkü değerle fark', tone: r.avantaj === 'pesin' ? 'down' : 'up' },
        rows: [
          { label: 'Taksitli toplam', value: tl(r.taksitToplam) },
          { label: 'Vade farkı', value: tl(r.vadeFarki) },
          { label: 'Taksitlerin bugünkü değeri', value: tl(r.bugunkuDeger), strong: true },
          { label: 'Peşin fiyat', value: tl(n(v, 'pesin')) },
          ...(r.zimniAylikFaiz != null ? [{ label: 'Vade farkının aylık faizi (zımni)', value: pctv(r.zimniAylikFaiz * 100) }] : []),
        ],
        notes: ['Taksitlerin bugünkü değeri peşin fiyattan düşükse, parayı değerlendirip taksitle ödemek daha avantajlıdır.'],
      };
    },
    info: {
      how: [
        'Taksitle ödediğinizde peşin tutar cebinizde kalır ve getiri sağlar. Bu yüzden karşılaştırma, taksitlerin paranızın getirisiyle indirgenmiş bugünkü değeri ile peşin fiyat arasında yapılır.',
        'Zımni faiz, vade farkının aylık maliyetidir: peşin fiyat = taksitlerin bugünkü değeri eşitliğini sağlayan orandır. Paranızın getirisi bu orandan yüksekse taksit avantajlıdır.',
      ],
      formula: ['Bugünkü değer = taksit × (1 − (1 + r)⁻ⁿ) / r', 'Karar: bugünkü değer < peşin → taksit avantajlı'],
      faqs: [{ q: 'Vade farksız taksit her zaman avantajlı mı?', a: 'Paranızı sıfırdan yüksek bir getiriyle değerlendirebiliyorsanız evet; ancak peşin alımda indirim varsa önce indirimli peşin fiyatı karşılaştırmaya girin.' }],
    },
  },

  'fatura-hesaplama': {
    slug: 'fatura-hesaplama',
    intro: 'Fatura satırlarını adet, birim fiyat, iskonto ve KDV oranıyla girin; ara toplam, KDV dağılımı ve genel toplam hesaplansın.',
    fields: [
      { type: 'rows', key: 'satirlar', label: 'Fatura satırları', wide: true, columns: [{ key: 'adet', label: 'Adet' }, { key: 'fiyat', label: 'Birim fiyat', unit: '₺' }, { key: 'isk', label: 'İskonto', unit: '%' }, { key: 'kdv', label: 'KDV', unit: '%' }], default: [[2, 1500, 0, 20], [10, 85, 10, 20], [1, 400, 0, 10]], maxRows: 30, addLabel: 'Satır ekle' },
    ],
    compute(v) {
      const satirlar = (v.satirlar as number[][]).filter((r) => r[0] > 0).map(([adet, birimFiyat, iskonto, kdv]) => ({ adet, birimFiyat, iskonto: iskonto || 0, kdv: kdv || 0 }));
      if (!satirlar.length) return null;
      const r = fatura(satirlar);
      return {
        headline: { label: 'Genel toplam', value: tl(r.genelToplam), sub: `KDV ${tl(r.kdvToplam)}`, tone: 'primary' },
        rows: [
          { label: 'Ara toplam', value: tl(r.araToplam) },
          ...(r.iskonto ? [{ label: 'İskonto', value: `− ${tl(r.iskonto)}` }] : []),
          { label: 'KDV matrahı', value: tl(r.matrah) },
          ...r.kdvDagilim.map((d) => ({ label: `KDV %${d.oran} (matrah ${tl(d.matrah)})`, value: tl(d.kdv) })),
          { label: 'Toplam KDV', value: tl(r.kdvToplam) },
          { label: 'Genel toplam', value: tl(r.genelToplam), strong: true },
        ],
      };
    },
    info: {
      how: ['Her satırda tutar = adet × birim fiyat; iskonto bu tutardan düşülür ve kalan matraha satırın KDV oranı uygulanır. Faturada KDV, oranlara göre ayrı ayrı gösterilir.'],
      formula: ['Satır matrahı = adet × fiyat × (1 − iskonto)', 'KDV = satır matrahı × oran', 'Genel toplam = Σ matrah + Σ KDV'],
      faqs: [{ q: 'İskonto KDV’den önce mi uygulanır?', a: 'Evet. Faturada gösterilen iskonto matrahtan düşülür ve KDV indirimli tutar üzerinden hesaplanır.' }],
    },
  },

  // ── Tarih ──
  'gun-hesaplama': {
    slug: 'gun-hesaplama',
    intro: 'İki tarih seçin; aralarındaki gün, hafta, ay ve yıl farkını ve hafta içi gün sayısını görün.',
    fields: [
      dateField('a', 'Başlangıç tarihi', (t) => t.slice(0, 4) + '-01-01'),
      dateField('b', 'Bitiş tarihi', (t) => t),
      { type: 'toggle', key: 'dahil', label: 'Bitiş gününü de say', default: false },
    ],
    compute(v) {
      const r = gunFarki(s(v, 'a'), s(v, 'b'), b(v, 'dahil'));
      return {
        headline: { label: 'Gün farkı', value: `${int(r.gun)} gün`, sub: `${fmtYmd(r.ymd)} · ${int(r.hafta)} hafta ${r.artanGun} gün`, tone: 'primary' },
        rows: [
          { label: 'Toplam gün', value: int(r.gun), strong: true },
          { label: 'Yıl / ay / gün', value: fmtYmd(r.ymd) },
          { label: 'Hafta', value: `${int(r.hafta)} hafta ${r.artanGun} gün` },
          { label: 'Hafta içi gün (Pzt–Cum)', value: int(r.haftaIci) },
          { label: 'Saat', value: int(r.saat) },
          { label: 'Başlangıç', value: fmtDateTr(s(v, 'a') <= s(v, 'b') ? s(v, 'a') : s(v, 'b'), true) },
          { label: 'Bitiş', value: fmtDateTr(s(v, 'a') <= s(v, 'b') ? s(v, 'b') : s(v, 'a'), true) },
        ],
      };
    },
    info: {
      how: ['İki tarih arasındaki gün farkı, takvim günleri sayılarak bulunur. Varsayılan olarak başlangıç günü dahil, bitiş günü hariçtir (1 Ocak → 2 Ocak = 1 gün); bitiş gününü dahil ederseniz sonuç 1 artar.'],
      faqs: [
        { q: 'Faiz ve vade hesabında hangi gün sayısı kullanılır?', a: 'Genellikle başlangıç günü dahil, bitiş günü hariç sayılır. Yasal süre hesaplarında ise ilk gün sayılmaz, son gün sayılır; sonuç yine aynı gün sayısını verir.' },
        { q: 'Artık yıllar hesaba katılıyor mu?', a: 'Evet. Şubat’ın 29 çektiği yıllar dahil gerçek takvim kullanılır.' },
      ],
    },
  },

  'yas-hesaplama': {
    slug: 'yas-hesaplama',
    intro: 'Doğum tarihinizi girin; tam yaşınızı yıl, ay ve gün olarak, yaşadığınız toplam günü ve doğum gününüze kalan süreyi görün.',
    fields: [
      dateField('dogum', 'Doğum tarihi', '1990-05-10'),
      dateField('tarih', 'Hangi tarihe göre', (t) => t),
    ],
    compute(v) {
      const r = yas(s(v, 'dogum'), s(v, 'tarih'));
      if (!r) return { error: 'Doğum tarihi hesap tarihinden sonra olamaz.' };
      return {
        headline: { label: 'Yaşınız', value: `${r.ymd.years} yaş`, sub: fmtYmd(r.ymd), tone: 'primary' },
        rows: [
          { label: 'Tam yaş', value: fmtYmd(r.ymd), strong: true },
          { label: 'Toplam ay', value: int(r.toplamAy) },
          { label: 'Toplam hafta', value: int(r.toplamHafta) },
          { label: 'Toplam gün', value: int(r.toplamGun) },
          { label: 'Doğduğunuz gün', value: TR_WEEKDAYS[r.dogumGunu] },
          { label: 'Sonraki doğum günü', value: r.kalanGun === 0 ? 'Bugün! İyi ki doğdunuz 🎉' : `${fmtDateTr(r.sonrakiDogumGunu, true)} · ${r.kalanGun} gün kaldı (${r.yeniYas} yaş)` },
        ],
      };
    },
    info: {
      how: ['Yaş, doğum tarihinden itibaren tamamlanan yıl, ay ve gün sayısıdır. Gün eksiye düşerse bir ay geri alınır; 29 Şubat doğumlular artık olmayan yıllarda 28 Şubat’ta yaş günü kutlar.'],
      faqs: [{ q: 'Resmi işlemlerde yaş nasıl hesaplanır?', a: 'Doğum gününün geçip geçmediğine bakılarak tamamlanan yıl sayısı esas alınır; bu araç da aynı yöntemi kullanır.' }],
    },
  },

  'tarih-hesaplama': {
    slug: 'tarih-hesaplama',
    intro: 'Bir tarihe gün, hafta, ay, yıl veya iş günü ekleyin ya da çıkarın; sonuç tarihini haftanın günüyle birlikte görün.',
    fields: [
      dateField('tarih', 'Başlangıç tarihi', (t) => t),
      { type: 'select', key: 'yon', label: 'İşlem', default: '+', segmented: true, options: [{ value: '+', label: 'Ekle' }, { value: '-', label: 'Çıkar' }] },
      { type: 'number', key: 'miktar', label: 'Miktar', default: 90, min: 0, integer: true },
      { type: 'select', key: 'birim', label: 'Birim', default: 'gun', segmented: true, options: [
        { value: 'gun', label: 'Gün' }, { value: 'isgunu', label: 'İş günü' }, { value: 'hafta', label: 'Hafta' }, { value: 'ay', label: 'Ay' }, { value: 'yil', label: 'Yıl' },
      ] },
    ],
    compute(v) {
      const m = n(v, 'miktar') * (s(v, 'yon') === '-' ? -1 : 1);
      const r = tarihEkle(s(v, 'tarih'), m, s(v, 'birim') as Birim);
      const etiket: Record<string, string> = { gun: 'gün', isgunu: 'iş günü', hafta: 'hafta', ay: 'ay', yil: 'yıl' };
      return {
        headline: { label: 'Sonuç tarihi', value: fmtDateTr(r), sub: TR_WEEKDAYS[weekday(r)], tone: 'primary' },
        rows: [
          { label: 'Başlangıç', value: fmtDateTr(s(v, 'tarih'), true) },
          { label: 'İşlem', value: `${s(v, 'yon') === '-' ? '−' : '+'} ${int(n(v, 'miktar'))} ${etiket[s(v, 'birim')]}` },
          { label: 'Sonuç', value: fmtDateTr(r, true), strong: true },
        ],
        notes: s(v, 'birim') === 'isgunu' ? ['İş günü hesabında hafta sonları ve 2025–2027 resmî tatilleri atlanır.'] : s(v, 'birim') === 'ay' ? ['Ay eklemede hedef ayda aynı gün yoksa ayın son günü alınır (31 Ocak + 1 ay = 28/29 Şubat).'] : undefined,
      };
    },
    info: {
      how: ['Gün ve hafta eklemede takvim günleri sayılır. Ay ve yıl eklemede aynı gün numarasına gidilir; o gün yoksa ayın son günü alınır. İş günü eklemede hafta sonları ve resmî tatiller atlanır.'],
      faqs: [{ q: '90 gün sonrası hangi tarih?', a: 'Başlangıç tarihini girip 90 gün ekleyin; araç sonuç tarihini haftanın günüyle verir.' }],
    },
  },

  'is-gunu-hesaplama': {
    slug: 'is-gunu-hesaplama',
    intro: 'İki tarih arasındaki iş günü sayısını hafta sonları ve resmî tatiller düşülerek hesaplayın. Arife günleri yarım gün sayılır.',
    fields: [
      dateField('a', 'Başlangıç tarihi', (t) => t.slice(0, 8) + '01'),
      dateField('b', 'Bitiş tarihi', (t) => addDays(addMonths(t.slice(0, 8) + '01', 1), -1)),
      { type: 'toggle', key: 'cmt', label: 'Cumartesi çalışma günü', default: false },
      { type: 'toggle', key: 'tatil', label: 'Resmî tatilleri düş', default: true },
    ],
    compute(v) {
      const r = isGunuSay(s(v, 'a'), s(v, 'b'), b(v, 'cmt'), b(v, 'tatil'));
      return {
        headline: { label: 'İş günü', value: `${num(r.isGunu, 1)} gün`, sub: `${r.takvimGunu} takvim günü (iki tarih dahil)`, tone: 'primary' },
        rows: [
          { label: 'Takvim günü', value: int(r.takvimGunu) },
          { label: b(v, 'cmt') ? 'Pazar günleri' : 'Hafta sonu günleri', value: int(r.haftaSonu) },
          { label: 'Hafta içine denk gelen tatil', value: int(r.tatilGunu) },
          { label: 'Yarım gün (arife)', value: int(r.yarimGun) },
          { label: 'İş günü', value: num(r.isGunu, 1), strong: true },
        ],
        table: r.tatiller.length ? { caption: 'Aralıktaki resmî tatiller', columns: ['Tarih', 'Tatil'], rows: r.tatiller.map((t) => [fmtDateTr(t.date, true), t.half ? `${t.name} (yarım gün)` : t.name]) } : undefined,
        warnings: r.kapsamDisi ? ['Resmî tatil verisi 2025–2027 yılları için mevcut; aralığın dışında kalan tatiller düşülmedi.'] : undefined,
      };
    },
    info: {
      how: ['Başlangıç ve bitiş günü dahil tüm günler sayılır; Cumartesi–Pazar (seçime göre yalnızca Pazar) ve hafta içine denk gelen resmî tatiller çıkarılır. 28 Ekim ve bayram arifeleri 13.00’ten itibaren tatil olduğundan yarım gün kabul edilir.'],
      faqs: [
        { q: '2026’da kaç iş günü var?', a: 'Başlangıç 1 Ocak 2026, bitiş 31 Aralık 2026 seçerek hesaplayabilirsiniz; hafta sonları ve resmî tatiller otomatik düşülür.' },
        { q: 'Hafta sonuna denk gelen bayram iş gününü etkiler mi?', a: 'Hayır. Zaten çalışılmayan güne denk gelen tatil iş günü sayısını azaltmaz.' },
      ],
    },
  },

  // ── Yakıt ve enerji ──
  'yakit-maliyeti-hesaplama': {
    slug: 'yakit-maliyeti-hesaplama',
    intro: 'Gideceğiniz mesafeyi, aracınızın 100 km’deki yakıt tüketimini ve yakıt fiyatını girin; yol masrafını ve kişi başı payı görün.',
    fields: [
      count('km', 'Mesafe', 450, 'km'),
      count('tuketim', 'Ortalama tüketim', 6.5, 'L/100 km'),
      money('fiyat', 'Yakıt litre fiyatı', 50),
      { type: 'toggle', key: 'gd', label: 'Gidiş-dönüş', default: false },
      count('kisi', 'Kişi sayısı', 1, 'kişi', { integer: true, min: 1 }),
    ],
    compute(v) {
      const r = yakitMaliyeti(n(v, 'km'), n(v, 'tuketim'), n(v, 'fiyat'), n(v, 'kisi'), b(v, 'gd'));
      return {
        headline: { label: 'Yakıt maliyeti', value: tl(r.maliyet), sub: `${num(r.litre, 2)} litre · kişi başı ${tl(r.kisiBasi)}`, tone: 'primary' },
        rows: [
          { label: 'Toplam mesafe', value: `${num(r.mesafe)} km` },
          { label: 'Harcanacak yakıt', value: `${num(r.litre, 2)} L` },
          { label: 'Toplam maliyet', value: tl(r.maliyet), strong: true },
          { label: 'Kişi başı', value: tl(r.kisiBasi) },
          { label: 'Km başı maliyet', value: tl(r.kmBasi) },
        ],
        notes: ['Köprü, otoyol ücretleri ve trafik, klima gibi tüketimi artıran etkenler dahil değildir.'],
      };
    },
    info: {
      how: ['Harcanacak yakıt = mesafe × 100 km’deki tüketim / 100. Maliyet, bu miktarın litre fiyatıyla çarpımıdır.'],
      formula: ['Litre = km × tüketim / 100', 'Maliyet = litre × fiyat'],
      faqs: [{ q: 'Aracımın tüketimini nasıl öğrenirim?', a: 'Depoyu fulleyip km sayacını sıfırlayın; bir sonraki fullemede aldığınız litreyi gidilen kilometreye bölüp 100 ile çarpın veya Yakıt Tüketimi aracını kullanın.' }],
    },
  },

  'yakit-tuketimi-hesaplama': {
    slug: 'yakit-tuketimi-hesaplama',
    intro: 'Aldığınız yakıt miktarını ve bu yakıtla gittiğiniz mesafeyi girin; aracınızın 100 km’de kaç litre yaktığını görün.',
    fields: [
      count('litre', 'Harcanan yakıt', 40, 'litre'),
      count('km', 'Gidilen mesafe', 600, 'km'),
      money('fiyat', 'Litre fiyatı', null, { optional: true }),
    ],
    compute(v) {
      const r = yakitTuketimi(n(v, 'litre'), n(v, 'km'), n(v, 'fiyat') || null);
      if (!r) return { error: 'Yakıt ve mesafe sıfırdan büyük olmalı.' };
      return {
        headline: { label: '100 km’de tüketim', value: `${num(r.litre100, 2)} L`, sub: `1 litreyle ${num(r.kmLitre, 2)} km`, tone: 'primary' },
        rows: [
          { label: 'Litre / 100 km', value: num(r.litre100, 2), strong: true },
          { label: 'Km / litre', value: num(r.kmLitre, 2) },
          ...(r.tl100 != null ? [{ label: '100 km maliyeti', value: tl(r.tl100) }, { label: 'Km başı maliyet', value: tl(r.kmBasi!) }] : []),
        ],
      };
    },
    info: {
      how: ['En doğru ölçüm “depo fulleme” yöntemidir: depo fullenir, km sıfırlanır; sonraki fullemede alınan yakıt gidilen mesafeye bölünür.'],
      formula: ['L/100 km = litre / km × 100', 'km/L = km / litre'],
      faqs: [{ q: 'Yol bilgisayarındaki tüketim neden farklı?', a: 'Yol bilgisayarları tahmine dayalıdır ve genellikle gerçek tüketimden %5–10 düşük gösterir.' }],
    },
  },

  'elektrikli-arac-sarj-maliyeti': {
    slug: 'elektrikli-arac-sarj-maliyeti',
    intro: 'Batarya kapasitesini, şarj aralığını ve kWh fiyatını girin; şarj ücretini, eklenen menzili ve 100 km maliyetini görün.',
    fields: [
      count('kap', 'Batarya kapasitesi', 60, 'kWh'),
      percent('bas', 'Başlangıç şarjı', 20, { max: 100 }),
      percent('hedef', 'Hedef şarj', 80, { max: 100 }),
      money('fiyat', 'kWh fiyatı', 3.5, { help: 'Ev tarifesi veya şarj istasyonu fiyatı.' }),
      percent('verim', 'Şarj verimi', 90, { max: 100, min: 1, help: 'Evde AC şarjda kayıp genellikle %10–15.' }),
      count('tuketim', 'Araç tüketimi', 16, 'kWh/100 km', { optional: true }),
    ],
    compute(v) {
      const r = sarjMaliyeti(n(v, 'kap'), n(v, 'bas'), n(v, 'hedef'), n(v, 'fiyat'), n(v, 'verim') / 100, n(v, 'tuketim') || null);
      if (!r) return { error: 'Hedef şarj başlangıçtan büyük olmalı.' };
      return {
        headline: { label: 'Şarj maliyeti', value: tl(r.maliyet), sub: r.menzil != null ? `≈ ${int(r.menzil)} km menzil · 100 km ${tl(r.tl100!)}` : `${num(r.sebekedenCekilen, 1)} kWh`, tone: 'primary' },
        rows: [
          { label: 'Bataryaya giren enerji', value: `${num(r.batarya, 1)} kWh` },
          { label: 'Şebekeden çekilen', value: `${num(r.sebekedenCekilen, 1)} kWh` },
          { label: 'Şarj maliyeti', value: tl(r.maliyet), strong: true },
          ...(r.menzil != null ? [{ label: 'Eklenen menzil', value: `${int(r.menzil)} km` }, { label: '100 km maliyeti', value: tl(r.tl100!) }] : []),
        ],
      };
    },
    info: {
      how: ['Bataryaya giren enerji = kapasite × (hedef − başlangıç)%. Şarj kayıpları nedeniyle şebekeden çekilen enerji bunun verime bölünmesiyle bulunur ve kWh fiyatıyla çarpılır.'],
      formula: ['Enerji = kapasite × (hedef − başlangıç) / 100', 'Maliyet = enerji / verim × kWh fiyatı', '100 km maliyeti = tüketim / verim × kWh fiyatı'],
      faqs: [{ q: 'Neden %80’e kadar şarj ediliyor?', a: 'Hızlı şarjda %80’den sonra şarj hızı düşer ve batarya ömrü için günlük kullanımda %20–80 aralığı önerilir.' }],
    },
  },

  'elektrik-tuketimi-hesaplama': {
    slug: 'elektrik-tuketimi-hesaplama',
    intro: 'Cihazın gücünü (watt), günlük kullanım süresini ve elektrik birim fiyatını girin; tüketimi ve faturaya etkisini görün.',
    fields: [
      count('watt', 'Cihaz gücü', 2000, 'W'),
      count('saat', 'Günlük kullanım', 2, 'saat', { max: 24 }),
      count('gun', 'Kaç gün', 30, 'gün', { integer: true }),
      money('fiyat', 'Elektrik birim fiyatı (kWh)', 3.5, { help: 'Vergiler dahil tarife fiyatı; faturanızda yazar.' }),
      count('adet', 'Cihaz adedi', 1, 'adet', { integer: true, min: 1 }),
    ],
    compute(v) {
      const r = elektrikTuketimi(n(v, 'watt'), n(v, 'saat'), n(v, 'gun'), n(v, 'fiyat'), n(v, 'adet'));
      return {
        headline: { label: `${n(v, 'gun')} günlük maliyet`, value: tl(r.toplamMaliyet), sub: `${num(r.toplamKwh, 2)} kWh · günlük ${tl(r.gunlukMaliyet)}`, tone: 'primary' },
        rows: [
          { label: 'Günlük tüketim', value: `${num(r.gunlukKwh, 3)} kWh` },
          { label: 'Toplam tüketim', value: `${num(r.toplamKwh, 2)} kWh` },
          { label: 'Günlük maliyet', value: tl(r.gunlukMaliyet) },
          { label: 'Aylık (30 gün) maliyet', value: tl(r.aylikMaliyet) },
          { label: 'Toplam maliyet', value: tl(r.toplamMaliyet), strong: true },
        ],
        notes: ['Buzdolabı, klima gibi termostatlı cihazlar sürekli tam güçte çalışmaz; etiketteki yıllık kWh değeri daha gerçekçidir.'],
      };
    },
    info: {
      how: ['Tüketim (kWh) = güç (W) × süre (saat) / 1000. 2000 W’lık bir cihaz 1 saatte 2 kWh harcar. Maliyet, kWh tüketiminin birim fiyatla çarpımıdır.'],
      formula: ['kWh = watt × saat / 1000', 'Maliyet = kWh × birim fiyat'],
      faqs: [{ q: '1 kWh kaç TL?', a: 'Mesken tarifesinde fiyat EPDK’nın belirlediği tarifeye ve kademeye göre değişir; güncel birim fiyat (vergiler dahil) faturanızda yazar.' }],
    },
  },
};

