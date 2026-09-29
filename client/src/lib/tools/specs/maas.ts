// Maaş ve çalışma hayatı araçları.

import type { ToolSpec } from '../types';
import { tl, pct } from '../format';
import { SRC, b, count, dateField, money, n, percent, s } from './_shared';
import {
  asgariUcret, dogumIzni, fazlaMesai, ihbarTazminati, issizlikMaasi, kidemTazminati, raporParasi,
  yillikIzin, AYLIK_CALISMA_SAATI, type RaporTuru,
} from '@/lib/calculators/calisma';
import { addDays, addYears, fmtDateTr, fmtYmd } from '@/lib/calculators/core';
import { ASGARI_UCRET_BRUT } from '@/lib/calculators/params';

export const specs: Record<string, ToolSpec> = {
  'kidem-tazminati-hesaplama': {
    slug: 'kidem-tazminati-hesaplama',
    intro: 'İşe giriş ve çıkış tarihinizi, son brüt maaşınızı ve düzenli yan haklarınızı girin; brüt ve net kıdem tazminatınız çıkış tarihindeki tavanla hesaplanır.',
    fields: [
      dateField('giris', 'İşe giriş tarihi', (t) => addYears(t, -5)),
      dateField('cikis', 'İşten çıkış tarihi', (t) => t),
      money('brut', 'Son brüt maaş', 45000),
      money('yan', 'Aylık yan haklar (brüt)', 0, { help: 'Yemek, yol, düzenli prim ve ikramiyenin aylık payı. Giydirilmiş ücrete eklenir.', optional: true }),
    ],
    compute(v) {
      if (s(v, 'cikis') < s(v, 'giris')) return { error: 'Çıkış tarihi giriş tarihinden önce olamaz.' };
      const r = kidemTazminati(s(v, 'giris'), s(v, 'cikis'), n(v, 'brut'), n(v, 'yan') || 0);
      if (!r.hakVar) {
        return {
          headline: { label: 'Kıdem tazminatı', value: tl(0), sub: `Çalışma süresi ${fmtYmd(r.sure)} — en az 1 yıl gerekir.` },
          warnings: ['Kıdem tazminatına hak kazanmak için aynı işverende en az 1 yıl çalışmış olmak gerekir.'],
        };
      }
      return {
        headline: { label: 'Net kıdem tazminatı', value: tl(r.net), sub: `Çalışma süresi: ${fmtYmd(r.sure)}`, tone: 'up' },
        rows: [
          { label: 'Giydirilmiş brüt ücret', value: tl(r.giydirilmisBrut) },
          { label: 'Kıdem tavanı (çıkış tarihinde)', value: tl(r.tavan) },
          { label: 'Hesaba esas ücret', value: tl(r.esasUcret), strong: true },
          { label: 'Brüt kıdem tazminatı', value: tl(r.brut) },
          { label: 'Damga vergisi (binde 7,59)', value: `− ${tl(r.damga)}`, tone: 'down' },
          { label: 'Net kıdem tazminatı', value: tl(r.net), strong: true },
        ],
        warnings: r.tavanUygulandi ? [`Ücretiniz kıdem tavanını aştığı için hesap tavan (${tl(r.tavan)}) üzerinden yapıldı.`] : undefined,
        notes: ['Kıdem tazminatı gelir vergisinden istisnadır; yalnızca damga vergisi kesilir.'],
      };
    },
    info: {
      how: [
        'Kıdem tazminatı, işçinin her tam çalışma yılı için 30 günlük giydirilmiş brüt ücreti tutarındadır. Bir yıldan artan aylar ücretin 1/12’si, artan günler ise 1/365’i oranında eklenir.',
        'Giydirilmiş ücrete çıplak brüt maaşın yanında yemek, yol, düzenli prim ve ikramiye gibi süreklilik gösteren ödemeler de dahil edilir. Hesaba esas ücret, işten çıkış tarihinde geçerli kıdem tazminatı tavanını aşamaz.',
        'Çalışma süresi işe giriş tarihinden çıkış tarihine kadar (çıkış günü dahil) hesaplanır. Kıdem tazminatı gelir vergisinden istisnadır; brüt tutardan yalnızca binde 7,59 damga vergisi kesilir.',
      ],
      formula: [
        'Esas ücret = min(brüt maaş + yan haklar, kıdem tavanı)',
        'Brüt tazminat = esas × tam yıl + esas / 12 × ay + esas / 365 × gün',
        'Net tazminat = brüt tazminat − brüt × 0,00759',
      ],
      faqs: [
        { q: '2026 kıdem tazminatı tavanı ne kadar?', a: '1 Ocak – 30 Haziran 2026 döneminde 64.948,77 TL, 1 Temmuz – 31 Aralık 2026 döneminde 73.729,87 TL’dir. Hesaplamada işten çıkış tarihindeki tavan kullanılır.' },
        { q: 'Kıdem tazminatı almak için kaç yıl çalışmak gerekir?', a: 'Aynı işverene bağlı olarak en az 1 yıl çalışmış olmak gerekir. Ayrıca işten ayrılışın kıdem tazminatı gerektiren bir sebeple (işveren feshi, haklı fesih, emeklilik, askerlik, evlilik vb.) olması şarttır.' },
        { q: 'Kıdem tazminatından vergi kesilir mi?', a: 'Gelir vergisi kesilmez. Sadece binde 7,59 oranında damga vergisi kesilir.' },
        { q: 'İstifa eden kıdem tazminatı alabilir mi?', a: 'Genel kural olarak hayır. Ancak emeklilik için yaş dışındaki şartları tamamlayanlar, kadınların evlilik tarihinden itibaren bir yıl içinde ayrılması, askerlik ve haklı nedenle fesih gibi durumlarda istifa edilse de kıdem tazminatı alınır.' },
      ],
      sources: [SRC.csgbKidem, SRC.kidem1475, SRC.damga],
    },
  },

  'ihbar-tazminati-hesaplama': {
    slug: 'ihbar-tazminati-hesaplama',
    intro: 'İhbar süresi, çalışma sürenize göre 2 ile 8 hafta arasında değişir. Brüt tazminattan gelir vergisi ve damga vergisi kesilir.',
    fields: [
      dateField('giris', 'İşe giriş tarihi', (t) => addYears(t, -2)),
      dateField('cikis', 'İşten çıkış tarihi', (t) => t),
      money('brut', 'Son brüt maaş', 45000),
      money('yan', 'Aylık yan haklar (brüt)', 0, { optional: true }),
      money('kum', 'Yıl içi kümülatif vergi matrahı', 0, { optional: true, help: 'Bordronuzdaki kümülatif gelir vergisi matrahı. Vergi dilimini belirler; bilmiyorsanız 0 bırakın.' }),
    ],
    compute(v) {
      if (s(v, 'cikis') < s(v, 'giris')) return { error: 'Çıkış tarihi giriş tarihinden önce olamaz.' };
      const r = ihbarTazminati(s(v, 'giris'), s(v, 'cikis'), n(v, 'brut'), n(v, 'yan') || 0, n(v, 'kum') || 0);
      return {
        headline: { label: 'Net ihbar tazminatı', value: tl(r.net), sub: `İhbar süresi ${r.hafta} hafta (${r.gun} gün) · çalışma süresi ${fmtYmd(r.sure)}`, tone: 'up' },
        rows: [
          { label: 'Günlük giydirilmiş brüt', value: tl(r.gunlukBrut) },
          { label: `Brüt ihbar tazminatı (${r.gun} gün)`, value: tl(r.brut), strong: true },
          { label: 'Gelir vergisi', value: `− ${tl(r.gelirVergisi)}`, tone: 'down' },
          { label: 'Damga vergisi', value: `− ${tl(r.damga)}`, tone: 'down' },
          { label: 'Net ihbar tazminatı', value: tl(r.net), strong: true },
        ],
        table: {
          caption: 'İhbar süreleri (4857 md. 17)',
          columns: ['Çalışma süresi', 'İhbar süresi'],
          rows: [['6 aydan az', '2 hafta'], ['6 ay – 1,5 yıl', '4 hafta'], ['1,5 – 3 yıl', '6 hafta'], ['3 yıldan fazla', '8 hafta']],
        },
        notes: ['İhbar tazminatından SGK primi kesilmez. Gelir vergisi, yıl içindeki kümülatif matrahınızın üzerine eklenerek ücret tarifesiyle hesaplanır.'],
      };
    },
    info: {
      how: [
        'İş sözleşmesini bildirim süresine uymadan fesheden taraf, ihbar süresine ait ücret tutarında ihbar tazminatı öder. Süre, çalışma süresine göre 2, 4, 6 veya 8 haftadır.',
        'Tazminat, giydirilmiş brüt ücretin günlük karşılığı (aylık / 30) ile ihbar süresindeki gün sayısının çarpımıdır. Kıdem tazminatının aksine tavan yoktur ve gelir vergisine tabidir.',
      ],
      formula: ['Brüt = (brüt maaş + yan haklar) / 30 × ihbar günü', 'Net = brüt − gelir vergisi − brüt × 0,00759'],
      faqs: [
        { q: 'İhbar tazminatı kimlere ödenir?', a: 'Belirsiz süreli iş sözleşmesi, bildirim süresi verilmeden ya da süreye ait ücret peşin ödenmeden feshedildiğinde karşı tarafa ödenir. İşçi de bildirim süresine uymadan ayrılırsa işverene ihbar tazminatı ödemekle yükümlü olabilir.' },
        { q: 'İhbar tazminatından hangi kesintiler yapılır?', a: 'Gelir vergisi ve binde 7,59 damga vergisi kesilir; SGK ve işsizlik sigortası primi kesilmez.' },
        { q: 'İhbar süresi sözleşmeyle uzatılabilir mi?', a: 'Evet. Kanundaki süreler asgaridir; iş sözleşmesi veya toplu sözleşmeyle artırılabilir, azaltılamaz.' },
      ],
      sources: [SRC.isKanunu, SRC.gibGv],
    },
  },

  'issizlik-maasi-hesaplama': {
    slug: 'issizlik-maasi-hesaplama',
    intro: 'Son 4 ayın brüt ortalamasını ve son 3 yıldaki prim gününüzü girin; aylık net işsizlik maaşınız ve ödeneğin kaç ay süreceği hesaplanır.',
    fields: [
      money('brut', 'Son 4 ayın brüt maaş ortalaması', 45000),
      count('prim', 'Son 3 yıldaki prim günü', 900, 'gün', { integer: true, help: 'İşten ayrılmadan önceki son 120 gün kesintisiz prim ödenmiş olmalı.' }),
    ],
    compute(v, { today }) {
      const r = issizlikMaasi(n(v, 'brut'), n(v, 'prim'), today);
      if (r.sureGun === 0) {
        return {
          headline: { label: 'Aylık net işsizlik maaşı', value: tl(r.aylikNet), sub: 'Prim günü yetersiz' },
          warnings: ['İşsizlik ödeneği için son 3 yılda en az 600 gün prim ödenmiş olması gerekir.'],
        };
      }
      return {
        headline: { label: 'Aylık net işsizlik maaşı', value: tl(r.aylikNet), sub: `${r.sureAy} ay boyunca · toplam ${tl(r.toplamNet)}`, tone: 'up' },
        rows: [
          { label: 'Aylık brüt ödenek (%40)', value: tl(r.aylikBrut) },
          { label: 'Üst sınır (brüt asgari ücretin %80’i)', value: tl(r.tavan) },
          { label: 'Damga vergisi', value: `− ${tl(r.damga)}`, tone: 'down' },
          { label: 'Aylık net ödenek', value: tl(r.aylikNet), strong: true },
          { label: 'Günlük net ödenek', value: tl(r.gunlukNet) },
          { label: 'Ödeme süresi', value: `${r.sureGun} gün (${r.sureAy} ay)` },
          { label: 'Toplam net ödenek', value: tl(r.toplamNet), strong: true },
        ],
        warnings: r.tavanUygulandi ? ['Hesaplanan tutar yasal üst sınırı aştığı için üst sınır uygulandı.'] : undefined,
        table: {
          caption: 'Prim gününe göre ödeme süresi',
          columns: ['Son 3 yılda prim günü', 'Ödeme süresi'],
          rows: [['600 gün', '180 gün (6 ay)'], ['900 gün', '240 gün (8 ay)'], ['1080 gün', '300 gün (10 ay)']],
        },
      };
    },
    info: {
      how: [
        'Günlük işsizlik ödeneği, son 4 aylık prime esas kazançlara göre hesaplanan günlük ortalama brüt kazancın %40’ıdır. Aylık tutar, brüt asgari ücretin %80’ini geçemez.',
        'Ödenekten yalnızca damga vergisi (binde 7,59) kesilir. Ödeme süresi son 3 yıldaki prim gününe göre 180, 240 veya 300 gündür.',
        'Hak kazanmak için işten kendi isteğiniz ve kusurunuz dışında ayrılmış olmanız, son 120 gün kesintisiz ve son 3 yılda en az 600 gün prim ödenmiş olması ve ayrılıştan sonraki 30 gün içinde İŞKUR’a başvurmanız gerekir.',
      ],
      formula: ['Aylık brüt = min(son 4 ay brüt ortalaması × %40, brüt asgari ücret × %80)', 'Aylık net = aylık brüt − aylık brüt × 0,00759'],
      faqs: [
        { q: '2026’da en yüksek işsizlik maaşı ne kadar?', a: 'Brüt asgari ücret 33.030 TL olduğundan üst sınır brüt 26.424 TL’dir; damga vergisi sonrası net 26.223,44 TL’dir.' },
        { q: 'Asgari ücretli ne kadar işsizlik maaşı alır?', a: '2026’da brüt 13.212 TL, net 13.111,72 TL alır.' },
        { q: 'İstifa eden işsizlik maaşı alabilir mi?', a: 'Hayır. İstifa veya kusurlu davranış (ahlak ve iyi niyet kurallarına aykırılık) nedeniyle işten çıkarılma durumunda ödenek verilmez. Haklı nedenle fesihte (ör. ücretin ödenmemesi) alınabilir.' },
      ],
      sources: [SRC.iskur, SRC.issizlik4447, SRC.asgari],
    },
  },

  'rapor-parasi-hesaplama': {
    slug: 'rapor-parasi-hesaplama',
    intro: 'Rapor türünü, son 3 aylık brüt kazancınızı ve rapor gün sayısını girin; SGK’nın ödeyeceği geçici iş göremezlik ödeneği hesaplanır.',
    fields: [
      { type: 'select', key: 'tur', label: 'Rapor türü', default: 'hastalik', segmented: true, options: [
        { value: 'hastalik', label: 'Hastalık' }, { value: 'is-kazasi', label: 'İş kazası / meslek hastalığı' }, { value: 'analik', label: 'Analık (doğum)' },
      ] },
      { type: 'select', key: 'tedavi', label: 'Tedavi şekli', default: 'ayakta', segmented: true, options: [
        { value: 'ayakta', label: 'Ayakta' }, { value: 'yatarak', label: 'Yatarak' },
      ], showIf: (v) => v.tur !== 'analik' },
      money('kazanc', 'Son 3 ayın toplam brüt kazancı', 135000, { help: 'Rapordan önceki 12 ayda prim ödenen son 3 ayın brüt toplamı.' }),
      count('gun', 'Bu 3 aydaki prim günü', 90, 'gün', { integer: true, min: 1 }),
      count('rapor', 'Rapor gün sayısı', 5, 'gün', { integer: true, min: 1 }),
    ],
    compute(v, { today }) {
      const tur = s(v, 'tur') as RaporTuru;
      const r = raporParasi(tur, s(v, 'tedavi') === 'yatarak', n(v, 'kazanc'), n(v, 'gun'), n(v, 'rapor'), today);
      return {
        headline: { label: 'Toplam rapor parası', value: tl(r.toplam), sub: `${r.odenecekGun} gün × ${tl(r.gunlukOdenek)}`, tone: 'up' },
        rows: [
          { label: 'Günlük kazanç', value: tl(r.gunlukKazanc) },
          { label: 'Ödenek oranı', value: r.oran === 0.5 ? '1/2 (yatarak)' : '2/3 (ayakta)' },
          { label: 'Günlük ödenek', value: tl(r.gunlukOdenek), strong: true },
          { label: 'Ödenecek gün', value: `${r.odenecekGun} gün` },
          { label: 'Toplam ödenek', value: tl(r.toplam), strong: true },
        ],
        warnings: [
          ...(tur === 'hastalik' && n(v, 'rapor') <= 2 ? ['Hastalık raporlarında ilk 2 gün için SGK ödeme yapmaz.'] : []),
          ...(r.tavanUygulandi ? ['Günlük kazanç SGK üst sınırına göre sınırlandı.'] : []),
        ],
        notes: tur === 'hastalik' ? ['Hastalık ödeneği için rapordan önceki 1 yılda en az 90 gün kısa vadeli sigorta primi bildirilmiş olmalıdır.'] : undefined,
      };
    },
    info: {
      how: [
        'Günlük kazanç, rapor tarihinden önceki 12 ay içinde prim ödenen son 3 ayın brüt kazanç toplamının bu aylardaki prim gün sayısına bölünmesiyle bulunur ve SGK günlük kazanç üst sınırını aşamaz.',
        'Ayakta tedavide günlük kazancın 2/3’ü, yatarak tedavide 1/2’si ödenir. Hastalık halinde ödenek raporun 3. gününden itibaren başlar; iş kazası, meslek hastalığı ve analık hallerinde ilk günden ödenir.',
      ],
      formula: ['Günlük kazanç = son 3 ay brüt toplamı / prim günü', 'Günlük ödenek = günlük kazanç × 2/3 (ayakta) veya × 1/2 (yatarak)', 'Toplam = günlük ödenek × ödenecek gün'],
      faqs: [
        { q: 'Rapor parası ne zaman yatar?', a: 'İşveren raporu e-Bildirge üzerinden onayladıktan sonra SGK ödemeyi genellikle birkaç gün içinde PTT veya banka hesabına yapar.' },
        { q: 'İlk 2 günlük rapor ücreti ödenir mi?', a: 'Hastalık raporlarında ilk 2 gün SGK tarafından ödenmez. Bazı işverenler toplu sözleşme veya iş sözleşmesiyle bu günleri öder.' },
        { q: 'Rapor parasından vergi kesilir mi?', a: 'Hayır. Geçici iş göremezlik ödeneğinden gelir vergisi veya damga vergisi kesilmez.' },
      ],
      sources: [SRC.kanun5510, SRC.sgkPek],
    },
  },

  'yillik-izin-hesaplama': {
    slug: 'yillik-izin-hesaplama',
    intro: 'İşe giriş tarihiniz ve yaşınıza göre İş Kanunu’ndaki yıllık ücretli izin hakkınızı hesaplayın.',
    fields: [
      dateField('giris', 'İşe giriş tarihi', (t) => addYears(t, -3)),
      dateField('tarih', 'Hesap tarihi', (t) => t),
      count('yas', 'Yaşınız', 30, 'yaş', { integer: true, min: 14, max: 99 }),
      { type: 'toggle', key: 'yeralti', label: 'Yer altı işinde çalışıyorum', default: false },
      money('brut', 'Brüt maaş (izin ücreti için)', null, { optional: true }),
    ],
    compute(v) {
      if (s(v, 'tarih') < s(v, 'giris')) return { error: 'Hesap tarihi işe giriş tarihinden önce olamaz.' };
      const r = yillikIzin(s(v, 'giris'), s(v, 'tarih'), n(v, 'yas'), b(v, 'yeralti'));
      const brut = n(v, 'brut');
      const rows = [
        { label: 'Kıdem', value: fmtYmd(r.sure) },
        { label: 'Yıllık izin hakkı', value: `${r.izinGun} iş günü`, strong: true },
        { label: 'Bir sonraki hak ediş', value: fmtDateTr(r.sonrakiHakEdis) },
      ];
      if (brut > 0 && r.izinGun > 0) rows.push({ label: 'İzin ücreti (brüt, günlük × gün)', value: tl((brut / 30) * r.izinGun), strong: false });
      return {
        headline: r.izinGun > 0
          ? { label: 'Yıllık izin hakkınız', value: `${r.izinGun} gün`, sub: `${r.kidemYil}. hizmet yılı`, tone: 'up' }
          : { label: 'Yıllık izin hakkınız', value: '0 gün', sub: `İlk izin hakkı ${fmtDateTr(r.sonrakiHakEdis)} tarihinde doğar` },
        rows,
        notes: [
          ...(r.yasIstisnasi ? ['18 yaş ve altı ile 50 yaş ve üstündeki çalışanlara en az 20 gün izin verilir.'] : []),
          'İzin süresine hafta tatili, ulusal bayram ve genel tatil günleri dahil edilmez.',
        ],
        table: {
          caption: 'Kanuni yıllık izin süreleri',
          columns: ['Hizmet süresi', 'İzin'],
          rows: [['1–5 yıl (5 dahil)', '14 gün'], ['5–15 yıl', '20 gün'], ['15 yıl ve üzeri', '26 gün']],
        },
      };
    },
    info: {
      how: [
        'İşyerinde deneme süresi dahil en az 1 yıl çalışan işçi yıllık ücretli izne hak kazanır. Süre, hizmet yılına göre 14, 20 veya 26 gündür.',
        '18 yaş ve altındaki ile 50 yaş ve üstündeki işçilere verilecek izin 20 günden az olamaz. Yer altı işlerinde çalışanların izinleri 4’er gün artırılır. Bu süreler asgaridir; sözleşmeyle artırılabilir.',
      ],
      faqs: [
        { q: 'Yıllık izin hafta sonunu kapsar mı?', a: 'Hayır. Yıllık izin süresine izin içindeki hafta tatili, ulusal bayram ve genel tatil günleri eklenmez; izin iş günü olarak kullanılır.' },
        { q: 'Kullanılmayan izin paraya çevrilir mi?', a: 'Çalışırken izin paraya çevrilemez. İş sözleşmesi sona erdiğinde kullanılmamış izinlerin ücreti son brüt ücret üzerinden ödenir.' },
        { q: 'Yıllık izin bölünebilir mi?', a: 'Taraflar anlaşırsa bölünebilir; ancak bir bölümü 10 günden az olamaz.' },
      ],
      sources: [SRC.isKanunu],
    },
  },

  'fazla-mesai-hesaplama': {
    slug: 'fazla-mesai-hesaplama',
    intro: 'Brüt maaşınızı ve fazla çalışma saatlerinizi girin; saatlik ücret 225 saat esasıyla bulunur, zamlı fazla mesai ücreti ve yaklaşık neti hesaplanır.',
    fields: [
      money('brut', 'Aylık brüt maaş', 45000),
      count('s50', 'Fazla çalışma (haftalık 45 saati aşan)', 10, 'saat', { help: 'Saat ücretinin %50 zamlısı ödenir.' }),
      count('s25', 'Fazla sürelerle çalışma', 0, 'saat', { optional: true, help: 'Haftalık çalışma süresi 45 saatin altında belirlenmişse, 45 saate kadar olan kısım. %25 zamlı.' }),
      count('tatil', 'Resmî tatilde çalışılan gün', 0, 'gün', { optional: true, help: 'Her gün için ayrıca 1 günlük ücret ödenir.' }),
      { type: 'select', key: 'gv', label: 'Gelir vergisi diliminiz', default: '0.15', options: [
        { value: '0.15', label: '%15' }, { value: '0.2', label: '%20' }, { value: '0.27', label: '%27' }, { value: '0.35', label: '%35' }, { value: '0.4', label: '%40' },
      ] },
    ],
    compute(v) {
      const r = fazlaMesai(n(v, 'brut'), n(v, 's50') || 0, n(v, 's25') || 0, n(v, 'tatil') || 0, Number(s(v, 'gv')));
      return {
        headline: { label: 'Fazla mesai ücreti (brüt)', value: tl(r.toplamBrut), sub: `Yaklaşık net: ${tl(r.toplamNet)}`, tone: 'up' },
        rows: [
          { label: `Saatlik brüt ücret (aylık / ${AYLIK_CALISMA_SAATI})`, value: tl(r.saatlikUcret) },
          { label: '%50 zamlı fazla çalışma', value: tl(r.fazlaCalisma) },
          { label: '%25 zamlı fazla sürelerle çalışma', value: tl(r.fazlaSurelerle) },
          { label: 'Resmî tatil çalışması', value: tl(r.tatil) },
          { label: 'Toplam brüt', value: tl(r.toplamBrut), strong: true },
          { label: 'SGK + işsizlik primi (%15)', value: `− ${tl(r.sgk + r.issizlik)}`, tone: 'down' },
          { label: `Gelir vergisi (%${Number(s(v, 'gv')) * 100})`, value: `− ${tl(r.gelirVergisi)}`, tone: 'down' },
          { label: 'Damga vergisi', value: `− ${tl(r.damga)}`, tone: 'down' },
          { label: 'Yaklaşık net', value: tl(r.toplamNet), strong: true },
        ],
        notes: ['Net tutar, fazla mesainin seçtiğiniz vergi dilimine girdiği varsayımıyla yaklaşıktır. Kesin tutar bordrodaki kümülatif matraha ve SGK tavanına bağlıdır.', 'Yıllık fazla çalışma süresi 270 saati aşamaz.'],
      };
    },
    info: {
      how: [
        'Haftalık 45 saati aşan çalışmalar fazla çalışmadır ve her saati için normal saat ücretinin %50 fazlası ödenir. Haftalık süre sözleşmeyle 45 saatin altında belirlenmişse, 45 saate kadar yapılan çalışmalar fazla sürelerle çalışmadır ve %25 zamlı ödenir.',
        'Aylık maaşla çalışanların saat ücreti, aylık brüt ücretin 225’e (haftalık 45 saat × 30/7) bölünmesiyle bulunur. Ulusal bayram ve genel tatil günlerinde çalışan işçiye, o gün için ayrıca bir günlük ücret ödenir.',
      ],
      formula: ['Saat ücreti = brüt maaş / 225', 'Fazla çalışma = saat × saat ücreti × 1,5', 'Fazla sürelerle çalışma = saat × saat ücreti × 1,25', 'Tatil çalışması = gün × brüt maaş / 30'],
      faqs: [
        { q: 'Fazla mesai yerine izin kullanılabilir mi?', a: 'Evet. İşçi isterse fazla çalışma ücreti yerine her saat için 1,5 saat, fazla sürelerle çalışmada 1 saat 15 dakika serbest zaman kullanabilir; bu süre 6 ay içinde verilmelidir.' },
        { q: 'Fazla mesai için işçinin onayı gerekir mi?', a: 'Evet. Fazla çalışma için işçinin yazılı onayı alınmalıdır; onay her yıl başında yenilenir.' },
        { q: 'Pazar günü çalışmanın ücreti nedir?', a: 'Hafta tatili gününde çalışma, haftalık 45 saati aştığı ölçüde fazla çalışma sayılır ve %50 zamlı ödenir.' },
      ],
      sources: [SRC.isKanunu],
    },
  },

  'saatlik-ucret-hesaplama': {
    slug: 'saatlik-ucret-hesaplama',
    intro: 'Aylık maaştan saatlik ve günlük ücreti ya da saatlik ücretten aylık maaşı bulun. Hesap, iş hukukundaki 225 saat ve 30 gün esasına göredir.',
    fields: [
      { type: 'select', key: 'yon', label: 'Hesaplama yönü', default: 'aylik', segmented: true, options: [
        { value: 'aylik', label: 'Aylıktan saatliğe' }, { value: 'saatlik', label: 'Saatlikten aylığa' },
      ] },
      money('aylik', 'Aylık ücret', 45000, { showIf: (v) => v.yon === 'aylik' }),
      money('saatlik', 'Saatlik ücret', 250, { showIf: (v) => v.yon === 'saatlik' }),
    ],
    compute(v) {
      const aylik = s(v, 'yon') === 'aylik' ? n(v, 'aylik') : n(v, 'saatlik') * AYLIK_CALISMA_SAATI;
      const saatlik = aylik / AYLIK_CALISMA_SAATI;
      return {
        headline: s(v, 'yon') === 'aylik'
          ? { label: 'Saatlik ücret', value: tl(saatlik), sub: `Günlük ${tl(aylik / 30)}` }
          : { label: 'Aylık ücret', value: tl(aylik), sub: `${AYLIK_CALISMA_SAATI} saat × ${tl(saatlik)}` },
        rows: [
          { label: 'Saatlik', value: tl(saatlik) },
          { label: 'Günlük (aylık / 30)', value: tl(aylik / 30) },
          { label: 'Haftalık (günlük × 7)', value: tl((aylik / 30) * 7) },
          { label: 'Aylık', value: tl(aylik), strong: true },
          { label: 'Yıllık (aylık × 12)', value: tl(aylik * 12) },
        ],
        notes: ['Brüt ücret girerseniz sonuçlar brüt, net ücret girerseniz net olur.'],
      };
    },
    info: {
      how: [
        'İş Kanunu’na göre haftalık çalışma süresi en fazla 45 saattir. Aylık ücretli çalışanlarda ay 30 gün kabul edildiğinden aylık çalışma süresi 45 × 30 / 7 = 225 saattir. Saat ücreti aylık ücretin 225’e, günlük ücret 30’a bölünmesiyle bulunur.',
      ],
      formula: ['Saatlik = aylık / 225', 'Günlük = aylık / 30', 'Aylık = saatlik × 225'],
      faqs: [
        { q: '2026 asgari ücretin saatlik tutarı ne kadar?', a: 'Brüt asgari ücret 33.030 TL’dir; saatlik brüt 146,80 TL, günlük brüt 1.101 TL’dir. Net asgari ücret üzerinden saatlik net yaklaşık 124,78 TL’dir.' },
        { q: 'Neden 225 saat kullanılıyor?', a: 'Haftalık 45 saatlik yasal çalışma süresinin 30 günlük aya oranlanmasıyla (45 × 30 / 7) bulunur ve fazla mesai hesabında da bu esas kullanılır.' },
      ],
      sources: [SRC.isKanunu],
    },
  },

  'asgari-ucret-hesaplama': {
    slug: 'asgari-ucret-hesaplama',
    intro: 'Seçtiğiniz yılın brüt ve net asgari ücretini, işçi kesintilerini ve işverene toplam maliyetini görün.',
    fields: [
      { type: 'select', key: 'yil', label: 'Yıl', default: '2026', segmented: true, options: ASGARI_UCRET_BRUT.map((a) => ({ value: a.from.slice(0, 4), label: a.from.slice(0, 4) })).reverse() },
      { type: 'select', key: 'tesvik', label: 'İşveren SGK teşviki', default: '0', options: [
        { value: '0', label: 'Teşvik yok' }, { value: '2', label: '2 puan (imalat dışı)' }, { value: '5', label: '5 puan (imalat)' },
      ] },
    ],
    compute(v) {
      const r = asgariUcret(`${s(v, 'yil')}-06-01`, Number(s(v, 'tesvik')));
      return {
        headline: { label: `${s(v, 'yil')} net asgari ücret`, value: tl(r.net), sub: `Brüt ${tl(r.brut)} · işverene maliyet ${tl(r.isverenMaliyeti)}`, tone: 'up' },
        sections: [
          { title: 'Çalışan', rows: [
            { label: 'Brüt asgari ücret', value: tl(r.brut) },
            { label: 'SGK primi (%14)', value: `− ${tl(r.sgkIsci)}`, tone: 'down' },
            { label: 'İşsizlik sigortası (%1)', value: `− ${tl(r.issizlikIsci)}`, tone: 'down' },
            { label: 'Gelir ve damga vergisi', value: 'İstisna (0 ₺)' },
            { label: 'Net asgari ücret', value: tl(r.net), strong: true },
          ] },
          { title: 'İşveren', rows: [
            { label: `SGK işveren payı (${pct(r.isverenOrani)})`, value: tl(r.sgkIsveren) },
            { label: 'İşsizlik işveren payı (%2)', value: tl(r.issizlikIsveren) },
            { label: 'İşverene toplam maliyet', value: tl(r.isverenMaliyeti), strong: true },
          ] },
          { title: 'Birim ücretler (brüt)', rows: [
            { label: 'Günlük', value: tl(r.gunlukBrut) },
            { label: 'Saatlik', value: tl(r.saatlikBrut) },
          ] },
        ],
      };
    },
    info: {
      how: [
        '2022’den bu yana asgari ücret, gelir vergisi ve damga vergisinden istisnadır. Bu nedenle net asgari ücret, brüt tutardan yalnızca %14 SGK işçi payı ve %1 işsizlik sigortası işçi payı düşülerek bulunur.',
        'İşveren, brüt ücrete ek olarak SGK işveren payı (2026’da %21,75) ve %2 işsizlik sigortası işveren payı öder. Şartları sağlayan işverenler imalatta 5, diğer sektörlerde 2 puan prim indiriminden yararlanır.',
      ],
      faqs: [
        { q: '2026 asgari ücret ne kadar?', a: '1 Ocak 2026’dan itibaren brüt 33.030 TL, net 28.075,50 TL’dir.' },
        { q: '2026 asgari ücretin işverene maliyeti nedir?', a: 'Teşviksiz 40.874,63 TL, 2 puan teşvikle 40.214,03 TL, 5 puan teşvikle 39.223,13 TL’dir.' },
        { q: 'Asgari ücretten vergi kesilir mi?', a: 'Hayır. Asgari ücret tutarı gelir vergisi ve damga vergisinden istisnadır. Asgari ücretin üzerinde maaş alanlarda da asgari ücrete isabet eden vergi kadar istisna uygulanır.' },
      ],
      sources: [SRC.asgari, SRC.sgkSirkuler, SRC.sgkPek],
    },
  },

  'dogum-izni-hesaplama': {
    slug: 'dogum-izni-hesaplama',
    intro: 'Tahmini doğum tarihinizi girin; 1 Mayıs 2026’da yürürlüğe giren düzenlemeye göre (doğumdan önce 8, sonra 16 hafta) izin tarihleriniz hesaplanır.',
    fields: [
      dateField('dogum', 'Tahmini doğum tarihi', (t) => addDays(t, 90)),
      { type: 'toggle', key: 'cogul', label: 'Çoğul gebelik (ikiz, üçüz…)', default: false },
      { type: 'select', key: 'once', label: 'Doğumdan kaç hafta önce izne çıkacaksınız?', default: 'max', options: [
        { value: 'max', label: 'Kanuni süre (8 hafta, çoğulda 10)' },
        ...[7, 6, 5, 4, 3, 2].map((w) => ({ value: String(w), label: `${w} hafta önce (doktor onayıyla)` })),
      ], help: 'Doğum öncesi çalışılan haftalar doğum sonrasına eklenir.' },
    ],
    compute(v) {
      const once = s(v, 'once') === 'max' ? undefined : Number(s(v, 'once'));
      const r = dogumIzni(s(v, 'dogum'), b(v, 'cogul'), once);
      return {
        headline: { label: 'Toplam doğum izni', value: `${r.toplamHafta} hafta`, sub: `${fmtDateTr(r.baslangic)} – ${fmtDateTr(r.bitis)}`, tone: 'primary' },
        rows: [
          { label: 'İzin başlangıcı', value: fmtDateTr(r.baslangic, true), strong: true },
          { label: 'Doğumdan önce', value: `${r.oncesiHafta} hafta` },
          { label: 'Doğumdan sonra', value: `${r.sonrasiHafta} hafta${r.devredilenHafta ? ` (${r.devredilenHafta} hafta devredilen dahil)` : ''}` },
          { label: 'Son izin günü', value: fmtDateTr(r.bitis, true), strong: true },
          { label: 'İşe dönüş', value: fmtDateTr(r.iseDonus, true) },
          { label: 'Toplam', value: `${r.toplamGun} gün` },
        ],
        warnings: r.yeniKural ? undefined : ['1 Mayıs 2026’dan önceki doğumlarda doğum sonrası izin 8 haftaydı; yürürlük tarihinde izni devam edenlerin süresi 8 hafta uzatıldı.'],
        notes: ['Doğum erken gerçekleşirse, doğumdan önce kullanılamayan süre doğum sonrası izne eklenir.', 'Analık izni süresince SGK’dan günlük kazancın 2/3’ü oranında analık ödeneği alınır.'],
      };
    },
    info: {
      how: [
        '7578 sayılı Kanunla (RG 1.5.2026) kadın işçilerin doğum sonrası ücretli izni 8 haftadan 16 haftaya çıkarıldı. Böylece doğumdan önce 8, sonra 16 hafta olmak üzere toplam 24 hafta analık izni kullanılır. Çoğul gebelikte doğum öncesine 2 hafta eklenir (toplam 26 hafta).',
        'Sağlık durumu uygunsa ve doktor onaylarsa kadın çalışan doğuma 2 hafta kalana kadar çalışabilir; çalıştığı süre doğum sonrası izne eklenir. Düzenleme 657 sayılı Kanun kapsamındaki kadın memurlar için de geçerlidir.',
      ],
      faqs: [
        { q: 'Doğum izni kaç hafta?', a: '1 Mayıs 2026’dan itibaren tekil gebelikte toplam 24 hafta (8 hafta önce + 16 hafta sonra), çoğul gebelikte 26 haftadır.' },
        { q: 'Babalık (eş doğum) izni kaç gün?', a: 'Eşi doğum yapan erkek çalışana verilen ücretli izin 5 günden 10 güne çıkarıldı.' },
      ],
      sources: [SRC.isKanunu, { label: 'Alomaliye — Doğum ve analık izninde 24 haftalık yeni dönem', url: 'https://www.alomaliye.com/2026/06/30/dogum-ve-analik-izninde-24-haftalik-yeni-donem/' }],
    },
  },

  'reel-maas-hesaplama': {
    slug: 'reel-maas-hesaplama',
    intro: 'Eski ve yeni maaşınızı, aynı dönemdeki enflasyonu girin; zammınızın enflasyonu karşılayıp karşılamadığını görün.',
    fields: [
      money('eski', 'Eski maaş', 40000),
      money('yeni', 'Yeni maaş', 50000),
      percent('enf', 'Dönem enflasyonu (TÜFE)', 30, { help: 'İki maaş arasındaki dönemin kümülatif enflasyonu.' }),
    ],
    compute(v) {
      const eski = n(v, 'eski');
      const yeni = n(v, 'yeni');
      const i = n(v, 'enf') / 100;
      if (!(eski > 0)) return { error: 'Eski maaş sıfırdan büyük olmalı.' };
      const nominal = yeni / eski - 1;
      const reel = (1 + nominal) / (1 + i) - 1;
      const gereken = eski * (1 + i);
      return {
        headline: { label: 'Reel değişim', value: pct(reel), sub: reel >= 0 ? 'Zammınız enflasyonun üzerinde' : 'Zammınız enflasyonun altında kaldı', tone: reel >= 0 ? 'up' : 'down' },
        rows: [
          { label: 'Nominal zam oranı', value: pct(nominal) },
          { label: 'Dönem enflasyonu', value: pct(i) },
          { label: 'Reel artış / kayıp', value: pct(reel), tone: reel >= 0 ? 'up' : 'down', strong: true },
          { label: 'Enflasyona göre olması gereken maaş', value: tl(gereken) },
          { label: 'Fark', value: tl(yeni - gereken), tone: yeni >= gereken ? 'up' : 'down' },
          { label: 'Yeni maaşın eski fiyatlarla değeri', value: tl(yeni / (1 + i)) },
        ],
      };
    },
    info: {
      how: [
        'Reel değişim, nominal artışın enflasyondan arındırılmış halidir. Basitçe “zam − enflasyon” yaklaşık sonuç verir; doğru hesap (1 + zam) / (1 + enflasyon) − 1 formülüyle yapılır.',
      ],
      formula: ['Nominal zam = yeni / eski − 1', 'Reel değişim = (1 + nominal zam) / (1 + enflasyon) − 1', 'Olması gereken maaş = eski × (1 + enflasyon)'],
      faqs: [
        { q: 'Enflasyon oranını nereden bulurum?', a: 'TÜİK’in açıkladığı TÜFE verilerinden. İki tarih arasındaki kümülatif enflasyonu sitemizdeki Enflasyon Hesaplama aracıyla bulabilirsiniz.' },
        { q: 'Neden zam oranından enflasyonu çıkarmak yetmez?', a: 'Yüksek oranlarda fark büyür. Örneğin %50 zam ve %40 enflasyonda reel artış %10 değil, 1,5 / 1,4 − 1 = %7,14’tür.' },
      ],
    },
  },
};
