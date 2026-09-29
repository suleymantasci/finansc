// Vergi, stopaj, gecikme zammı ve kanuni faiz araçları.

import type { ToolSpec } from '../types';
import { tl, pct, int, num } from '../format';
import { SRC, b, dateField, money, n, percent, s, yearSelect } from './_shared';
import {
  damgaVergisi, donemselFaiz, gecikmeZammi, gelirVergisi, gosterimBitis, kdvDahilden, kdvHaricten, kdvTevkifati,
  kiraGeliriVergisi, serbestMeslek, stopajBruttenNete, stopajNettenBrute, type DamgaTuru, type GelirTuru, type SmmGiris,
} from '@/lib/calculators/vergi';
import { addMonths, fmtDateTr } from '@/lib/calculators/core';
import { DAMGA_AZAMI_2026, KONUT_KIRA_ISTISNASI } from '@/lib/calculators/params';

const KDV_OPTS = [{ value: '20', label: '%20' }, { value: '10', label: '%10' }, { value: '1', label: '%1' }];

export const specs: Record<string, ToolSpec> = {
  'kdv-hesaplama': {
    slug: 'kdv-hesaplama',
    intro: 'Tutarı ve KDV oranını seçin; KDV dahil fiyattan hariç tutarı ya da hariç tutardan dahil fiyatı anında görün.',
    fields: [
      { type: 'select', key: 'yon', label: 'Girdiğiniz tutar', default: 'haric', segmented: true, options: [
        { value: 'haric', label: 'KDV hariç' }, { value: 'dahil', label: 'KDV dahil' },
      ] },
      money('tutar', 'Tutar', 1000),
      { type: 'select', key: 'oran', label: 'KDV oranı', default: '20', segmented: true, options: KDV_OPTS },
    ],
    compute(v) {
      const o = Number(s(v, 'oran')) / 100;
      const r = s(v, 'yon') === 'haric' ? kdvHaricten(n(v, 'tutar'), o) : kdvDahilden(n(v, 'tutar'), o);
      return {
        headline: s(v, 'yon') === 'haric'
          ? { label: 'KDV dahil tutar', value: tl(r.dahil), sub: `KDV: ${tl(r.kdv)}`, tone: 'primary' }
          : { label: 'KDV hariç tutar', value: tl(r.haric), sub: `KDV: ${tl(r.kdv)}`, tone: 'primary' },
        rows: [
          { label: 'KDV hariç tutar (matrah)', value: tl(r.haric) },
          { label: `KDV (%${s(v, 'oran')})`, value: tl(r.kdv) },
          { label: 'KDV dahil tutar', value: tl(r.dahil), strong: true },
        ],
      };
    },
    info: {
      how: [
        'Katma değer vergisi, mal ve hizmet bedeli (matrah) üzerinden hesaplanır. Genel oran %20’dir; bazı temel gıda, tekstil, konaklama gibi mal ve hizmetlerde %10, ekmek, un, bazı tarım ürünleri ve belirli konut teslimlerinde %1 uygulanır.',
        'KDV dahil bir fiyattan KDV’yi ayırmak için fiyat (1 + oran)’a bölünür. Örneğin %20 KDV dahil 1.200 TL’nin KDV hariç tutarı 1.200 / 1,20 = 1.000 TL’dir.',
      ],
      formula: ['KDV hariç → dahil: dahil = hariç × (1 + oran)', 'KDV dahil → hariç: hariç = dahil / (1 + oran)', 'KDV = dahil − hariç'],
      faqs: [
        { q: 'KDV dahil fiyattan KDV nasıl çıkarılır?', a: 'Fiyatı 1,20’ye (%20 için), 1,10’a (%10 için) veya 1,01’e (%1 için) bölün; kalan KDV hariç tutardır. KDV’yi fiyattan %20’sini düşerek bulmak yanlış sonuç verir.' },
        { q: '2026’da KDV oranları nedir?', a: 'Genel oran %20, indirimli oranlar %10 ve %1’dir.' },
      ],
      sources: [SRC.kdv],
    },
  },

  'kdv-tevkifati-hesaplama': {
    slug: 'kdv-tevkifati-hesaplama',
    intro: 'Tevkifatlı faturada alıcı, KDV’nin bir kısmını satıcı yerine vergi dairesine öder. Matrahı, KDV oranını ve tevkifat oranını girin.',
    fields: [
      money('matrah', 'KDV hariç tutar (matrah)', 10000),
      { type: 'select', key: 'oran', label: 'KDV oranı', default: '20', segmented: true, options: KDV_OPTS },
      { type: 'select', key: 'pay', label: 'Tevkifat oranı', default: '5', options: [2, 3, 4, 5, 7, 9, 10].map((p) => ({ value: String(p), label: `${p}/10` })) },
    ],
    compute(v) {
      const r = kdvTevkifati(n(v, 'matrah'), Number(s(v, 'oran')) / 100, Number(s(v, 'pay')));
      return {
        headline: { label: 'Alıcının satıcıya ödeyeceği', value: tl(r.aliciOdemesi), sub: `Tevkif edilen KDV: ${tl(r.tevkifEdilen)}`, tone: 'primary' },
        rows: [
          { label: 'Matrah', value: tl(r.matrah) },
          { label: `Hesaplanan KDV (%${s(v, 'oran')})`, value: tl(r.kdv) },
          { label: `Tevkif edilen KDV (${s(v, 'pay')}/10) — alıcı öder`, value: tl(r.tevkifEdilen) },
          { label: 'Satıcıya ödenen KDV', value: tl(r.saticiyaKdv) },
          { label: 'Fatura toplamı (KDV dahil)', value: tl(r.faturaToplami) },
          { label: 'Satıcıya ödenecek tutar', value: tl(r.aliciOdemesi), strong: true },
        ],
        notes: ['Tevkif edilen KDV, alıcı tarafından 2 No.lu KDV beyannamesiyle beyan edilip ödenir.'],
      };
    },
    info: {
      how: [
        'KDV tevkifatında vergi, alıcı ile satıcı arasında bölünür. Hesaplanan KDV’nin tevkifat oranı kadarını alıcı “sorumlu sıfatıyla” beyan edip öder; kalanını satıcıya öder ve satıcı kendi beyannamesinde gösterir.',
        'Tevkifat oranı işlem türüne göre KDV Genel Uygulama Tebliği’nde belirlenir (ör. yapım işleri, temizlik, güvenlik, işgücü temini, yemek servisi, fason tekstil hizmetleri). Faturanızdaki işleme ait oranı tebliğden kontrol edin.',
      ],
      formula: ['KDV = matrah × oran', 'Tevkif edilen = KDV × pay / 10', 'Satıcıya ödenecek = matrah + (KDV − tevkif edilen)'],
      faqs: [
        { q: 'Tevkifatlı faturada toplam tutar değişir mi?', a: 'Fatura toplamı (matrah + KDV) değişmez. Değişen, alıcının satıcıya ödediği tutardır; tevkif edilen KDV satıcı yerine vergi dairesine ödenir.' },
        { q: 'Tam tevkifat (10/10) ne demek?', a: 'KDV’nin tamamını alıcı öder; satıcıya yalnızca KDV hariç bedel ödenir.' },
      ],
      sources: [SRC.kdv],
    },
  },

  'gelir-vergisi-hesaplama': {
    slug: 'gelir-vergisi-hesaplama',
    intro: 'Yıllık vergi matrahınızı ve gelir türünü seçin; gelir vergisi, ortalama ve marjinal oran ile dilim dökümü hesaplanır.',
    fields: [
      money('matrah', 'Yıllık vergi matrahı', 750000),
      yearSelect(),
      { type: 'select', key: 'tur', label: 'Gelir türü', default: 'ucret', segmented: true, options: [
        { value: 'ucret', label: 'Ücret geliri' }, { value: 'ucretDisi', label: 'Ücret dışı (kira, serbest meslek, ticari)' },
      ] },
    ],
    compute(v) {
      const yil = Number(s(v, 'yil'));
      const r = gelirVergisi(n(v, 'matrah'), yil, s(v, 'tur') as GelirTuru);
      return {
        headline: { label: `${yil} gelir vergisi`, value: tl(r.vergi), sub: `Ortalama oran ${pct(r.ortalamaOran)} · marjinal ${pct(r.marjinalOran, 0)}`, tone: 'down' },
        rows: [
          { label: 'Matrah', value: tl(n(v, 'matrah')) },
          { label: 'Gelir vergisi', value: tl(r.vergi), strong: true },
          { label: 'Vergi sonrası', value: tl(r.net) },
          { label: 'Ortalama vergi oranı', value: pct(r.ortalamaOran) },
          { label: 'Marjinal (en üst) dilim', value: pct(r.marjinalOran, 0) },
        ],
        table: {
          caption: `${yil} tarifesi — ${s(v, 'tur') === 'ucret' ? 'ücret gelirleri' : 'ücret dışı gelirler'}`,
          columns: ['Dilim', 'Oran', 'Dilimdeki matrah', 'Vergi'],
          rows: r.dilimler.map((d) => [d.ust == null ? `${int(d.alt)} ₺ üzeri` : `${int(d.alt)} – ${int(d.ust)} ₺`, pct(d.oran, 0), tl(d.matrah), tl(d.vergi)]),
        },
      };
    },
    info: {
      how: [
        'Gelir vergisi artan oranlı tarifeyle hesaplanır: matrahın her dilime düşen kısmı o dilimin oranıyla vergilendirilir. 2026’da oranlar %15, %20, %27, %35 ve %40’tır.',
        'Ücret gelirleri ile diğer gelirlerin (kira, serbest meslek, ticari kazanç) tarifesi 3. dilimde ayrışır: 2026’da ücretlerde 3. dilim 1.500.000 TL’ye, diğer gelirlerde 1.000.000 TL’ye kadardır.',
      ],
      formula: ['Vergi = Σ (dilimdeki matrah × dilim oranı)', 'Ortalama oran = vergi / matrah'],
      faqs: [
        { q: '2026 gelir vergisi dilimleri nelerdir?', a: '190.000 TL’ye kadar %15; 400.000 TL’ye kadar %20; ücretlerde 1.500.000 TL’ye (diğer gelirlerde 1.000.000 TL’ye) kadar %27; 5.300.000 TL’ye kadar %35; üzeri %40.' },
        { q: 'Vergi dilimine girince bütün maaşa mı yüksek oran uygulanır?', a: 'Hayır. Yüksek oran yalnızca dilim sınırını aşan kısma uygulanır; önceki kısımlar kendi dilim oranlarıyla vergilenir.' },
        { q: 'Maaştaki gelir vergisi neden yıl içinde artıyor?', a: 'Ücretlerde vergi kümülatif matraha göre hesaplanır. Yıl içinde toplam matrah bir sonraki dilime geçtiğinde aynı brüt maaştan daha fazla vergi kesilir.' },
      ],
      sources: [SRC.gibGv, SRC.gv193],
    },
  },

  'damga-vergisi-hesaplama': {
    slug: 'damga-vergisi-hesaplama',
    intro: 'Belge türünü ve tutarı seçin; damga vergisi güncel oranlar ve azami tutar sınırıyla hesaplanır.',
    fields: [
      { type: 'select', key: 'tur', label: 'Belge türü', default: 'sozlesme', options: [
        { value: 'sozlesme', label: 'Belli parayı içeren sözleşme (binde 9,48)' },
        { value: 'kira', label: 'Kira sözleşmesi (binde 1,89)' },
        { value: 'ucret', label: 'Maaş, ücret (binde 7,59)' },
        { value: 'ozel', label: 'Diğer oran (binde)' },
      ] },
      money('tutar', 'Sözleşme / belge tutarı', 1000000, { showIf: (v) => v.tur !== 'kira' }),
      money('kira', 'Aylık kira bedeli', 25000, { showIf: (v) => v.tur === 'kira' }),
      { type: 'number', key: 'ay', label: 'Kira süresi', default: 12, unit: 'ay', min: 1, integer: true, showIf: (v) => v.tur === 'kira', help: 'Süresi belirsiz kira sözleşmelerinde 1 yıllık kira esas alınır.' },
      { type: 'number', key: 'binde', label: 'Oran', default: 9.48, unit: '‰', min: 0, showIf: (v) => v.tur === 'ozel' },
    ],
    compute(v) {
      const tur = s(v, 'tur') as DamgaTuru;
      const r = damgaVergisi(tur, tur === 'kira' ? n(v, 'kira') : n(v, 'tutar'), n(v, 'ay'), n(v, 'binde'));
      return {
        headline: { label: 'Damga vergisi', value: tl(r.vergi), sub: `Matrah ${tl(r.matrah)} × binde ${num(r.oran * 1000, 2)}`, tone: 'down' },
        rows: [
          { label: 'Matrah', value: tl(r.matrah) },
          { label: 'Oran', value: `binde ${num(r.oran * 1000, 2)}` },
          { label: 'Damga vergisi', value: tl(r.vergi), strong: true },
          ...(tur !== 'ucret' ? [{ label: 'Nüsha başına', value: 'Her nüsha ayrı vergilenir' }] : []),
        ],
        warnings: r.azamiUygulandi ? [`Bir kâğıt için azami damga vergisi (${tl(DAMGA_AZAMI_2026)}) uygulandı.`] : undefined,
        notes: tur === 'kira' ? ['Kira sözleşmesinde damga vergisi, sözleşme süresine ait toplam kira bedeli üzerinden hesaplanır.'] : undefined,
      };
    },
    info: {
      how: [
        'Damga vergisi, belli bir parayı içeren kâğıtlarda tutar üzerinden nispi oranla alınır. 2026’da sözleşme, taahhütname ve kefaletlerde binde 9,48, kira sözleşmelerinde binde 1,89, maaş ve ücret ödemelerinde binde 7,59 uygulanır.',
        'Nispi damga vergisi bir kâğıt için 2026’da 29.115.961,10 TL’yi aşamaz. Sözleşme birden fazla nüsha düzenlenirse her nüsha ayrı vergilendirilir.',
      ],
      formula: ['Damga vergisi = matrah × oran', 'Kira sözleşmesi matrahı = aylık kira × süre (ay)'],
      faqs: [
        { q: 'Kira sözleşmesinin damga vergisini kim öder?', a: 'Kanunen sözleşmeyi imzalayan taraflar müteselsilen sorumludur; uygulamada genellikle taraflar arasında paylaşılır veya kiracı öder.' },
        { q: 'Asgari ücretten damga vergisi kesilir mi?', a: 'Hayır. Asgari ücret tutarı damga vergisinden istisnadır; asgari ücretin üzerindeki ücretlerde istisna tutarı düşülerek kesinti yapılır.' },
      ],
      sources: [SRC.damga],
    },
  },

  'stopaj-hesaplama': {
    slug: 'stopaj-hesaplama',
    intro: 'Brüt tutardan net ödemeyi veya almak istediğiniz netten brütü, seçtiğiniz stopaj oranıyla hesaplayın.',
    fields: [
      { type: 'select', key: 'yon', label: 'Girdiğiniz tutar', default: 'brut', segmented: true, options: [
        { value: 'brut', label: 'Brüt' }, { value: 'net', label: 'Net' },
      ] },
      money('tutar', 'Tutar', 10000),
      { type: 'select', key: 'oran', label: 'Stopaj oranı', default: '20', options: [
        { value: '20', label: '%20 — kira, serbest meslek' },
        { value: '17.5', label: '%17,5 — TL mevduat (6 aya kadar)' },
        { value: '15', label: '%15 — temettü, TL mevduat (1 yıla kadar)' },
        { value: '10', label: '%10 — TL mevduat (1 yıldan uzun)' },
        { value: 'ozel', label: 'Diğer' },
      ] },
      percent('ozel', 'Stopaj oranı', 20, { max: 99, showIf: (v) => v.oran === 'ozel' }),
    ],
    compute(v) {
      const oran = (s(v, 'oran') === 'ozel' ? n(v, 'ozel') : Number(s(v, 'oran'))) / 100;
      if (oran >= 1) return { error: 'Oran %100’den küçük olmalı.' };
      const r = s(v, 'yon') === 'brut' ? stopajBruttenNete(n(v, 'tutar'), oran) : stopajNettenBrute(n(v, 'tutar'), oran);
      return {
        headline: s(v, 'yon') === 'brut'
          ? { label: 'Net tutar', value: tl(r.net), sub: `Stopaj ${tl(r.stopaj)}`, tone: 'up' }
          : { label: 'Brüt tutar', value: tl(r.brut), sub: `Stopaj ${tl(r.stopaj)}`, tone: 'primary' },
        rows: [
          { label: 'Brüt', value: tl(r.brut) },
          { label: `Stopaj (${pct(oran)})`, value: `− ${tl(r.stopaj)}`, tone: 'down' },
          { label: 'Net', value: tl(r.net), strong: true },
        ],
      };
    },
    info: {
      how: [
        'Stopaj (tevkifat), ödemeyi yapanın vergiyi kaynağında kesip vergi dairesine yatırmasıdır. Net tutar brütün (1 − oran) katıdır; netten brüte geçmek için net tutar (1 − oran)’a bölünür.',
      ],
      formula: ['Net = brüt × (1 − oran)', 'Brüt = net / (1 − oran)'],
      faqs: [
        { q: 'Netten brüte neden netin %20’si eklenmez?', a: 'Stopaj brüt üzerinden hesaplandığı için 8.000 TL net için brüt 8.000 × 1,20 = 9.600 değil, 8.000 / 0,80 = 10.000 TL’dir.' },
        { q: 'Mevduat stopaj oranları ne kadar?', a: 'TL mevduatta 31.12.2026’ya kadar vadesiz ve 6 aya kadar vadelerde %17,5, 1 yıla kadar %15, 1 yıldan uzun vadelerde %10 uygulanır.' },
      ],
      sources: [SRC.gv193],
    },
  },

  'kira-stopaji-hesaplama': {
    slug: 'kira-stopaji-hesaplama',
    intro: 'İş yeri kiralarında kiracı, brüt kiranın %20’sini stopaj olarak keser. Net kiradan brütü veya brütten neti hesaplayın.',
    fields: [
      { type: 'select', key: 'yon', label: 'Girdiğiniz kira', default: 'net', segmented: true, options: [
        { value: 'net', label: 'Net (ele geçen)' }, { value: 'brut', label: 'Brüt' },
      ] },
      money('tutar', 'Aylık kira', 20000),
      { type: 'toggle', key: 'kdv', label: 'Kiraya KDV uygulanıyor (%20)', default: false, help: 'Kiraya veren KDV mükellefi ise veya iş yeri bir şirketse.' },
    ],
    compute(v) {
      const r = s(v, 'yon') === 'brut' ? stopajBruttenNete(n(v, 'tutar'), 0.2) : stopajNettenBrute(n(v, 'tutar'), 0.2);
      const kdv = b(v, 'kdv') ? r.brut * 0.2 : 0;
      return {
        headline: s(v, 'yon') === 'net'
          ? { label: 'Brüt kira', value: tl(r.brut), sub: `Aylık stopaj ${tl(r.stopaj)}`, tone: 'primary' }
          : { label: 'Net kira', value: tl(r.net), sub: `Aylık stopaj ${tl(r.stopaj)}`, tone: 'up' },
        rows: [
          { label: 'Brüt kira', value: tl(r.brut) },
          { label: 'Stopaj (%20) — kiracı vergi dairesine öder', value: tl(r.stopaj) },
          { label: 'Kiraya verene ödenecek net', value: tl(r.net + kdv), strong: true },
          ...(kdv ? [{ label: 'KDV (%20, brüt üzerinden)', value: tl(kdv) }] : []),
          { label: 'Yıllık brüt kira', value: tl(r.brut * 12) },
          { label: 'Yıllık stopaj', value: tl(r.stopaj * 12) },
        ],
        notes: ['Stopaj, kiracı tarafından muhtasar ve prim hizmet beyannamesiyle beyan edilip ödenir. Konut kiralarında stopaj yoktur.'],
      };
    },
    info: {
      how: [
        'Şirketler, iş yeri sahipleri, serbest meslek erbabı gibi vergi sorumluları, gerçek kişilerden kiraladıkları iş yerleri için ödedikleri brüt kiranın %20’sini stopaj olarak keser.',
        'Sözleşmede “net” kira yazılıyorsa brüt kira net / 0,80 ile bulunur. Kiraya veren, yıllık beyanda bu stopajı hesaplanan vergiden mahsup eder.',
      ],
      formula: ['Brüt = net / 0,80', 'Stopaj = brüt × %20'],
      faqs: [
        { q: 'Konut kirasında stopaj var mı?', a: 'Hayır. Konut kiralarında stopaj kesilmez; ev sahibi kira gelirini istisnayı aşıyorsa yıllık beyannameyle beyan eder.' },
        { q: '20.000 TL net iş yeri kirasının brütü ne kadar?', a: '20.000 / 0,80 = 25.000 TL brüt; stopaj 5.000 TL’dir.' },
      ],
      sources: [SRC.gibKira, SRC.gv193],
    },
  },

  'kira-geliri-vergisi-hesaplama': {
    slug: 'kira-geliri-vergisi-hesaplama',
    intro: 'Yıllık konut kira gelirinizi girin; istisna, gider ve gelir vergisi dilimleriyle ödeyeceğiniz vergi hesaplanır.',
    fields: [
      money('kira', 'Yıllık toplam konut kira geliri', 300000, { help: 'Takvim yılı içinde tahsil edilen kiraların toplamı.' }),
      yearSelect('yil', 'Gelir yılı'),
      { type: 'toggle', key: 'istisna', label: 'Konut kira istisnasından yararlanıyorum', default: true, help: 'Ticari, zirai veya mesleki kazanç beyan edenler ve istisna tutarını aşan beyana tabi diğer geliri olanlar yararlanamaz.' },
      { type: 'select', key: 'yontem', label: 'Gider yöntemi', default: 'goturu', segmented: true, options: [
        { value: 'goturu', label: 'Götürü (%15)' }, { value: 'gercek', label: 'Gerçek gider' },
      ] },
      money('gider', 'Yıllık gerçek giderler', 0, { showIf: (v) => v.yontem === 'gercek', help: 'Onarım, sigorta, emlak vergisi, kredi faizi, amortisman vb.' }),
    ],
    compute(v) {
      const yil = Number(s(v, 'yil'));
      const r = kiraGeliriVergisi(n(v, 'kira'), yil, b(v, 'istisna'), s(v, 'yontem') as 'goturu' | 'gercek', n(v, 'gider') || 0);
      return {
        headline: r.beyanGerekli
          ? { label: 'Ödenecek gelir vergisi', value: tl(r.vergi), sub: `${yil + 1} Mart ayında beyan, Mart ve Temmuz’da 2 taksit`, tone: 'down' }
          : { label: 'Ödenecek gelir vergisi', value: tl(0), sub: 'Kira geliriniz istisna tutarının altında', tone: 'up' },
        rows: [
          { label: 'Yıllık kira geliri', value: tl(n(v, 'kira')) },
          { label: `İstisna (${yil})`, value: `− ${tl(r.istisna)}` },
          { label: 'Vergiye tabi kısım', value: tl(r.vergiyeTabi) },
          { label: s(v, 'yontem') === 'goturu' ? 'Götürü gider (%15)' : 'İndirilebilir gerçek gider', value: `− ${tl(r.gider)}` },
          { label: 'Vergi matrahı', value: tl(r.matrah), strong: true },
          { label: 'Gelir vergisi', value: tl(r.vergi), strong: true },
          ...(r.vergi > 0 ? [{ label: 'Taksit tutarı (2 eşit taksit)', value: tl(r.vergi / 2) }] : []),
        ],
        notes: [
          'Gerçek gider yönteminde istisnaya isabet eden giderler indirilemez; giderler vergiye tabi kısmın toplam gelire oranında dikkate alınır.',
          'Başka beyana tabi geliriniz (ör. birden fazla işverenden ücret) varsa vergi, gelirlerin toplamı üzerinden hesaplanır.',
        ],
      };
    },
    info: {
      how: [
        `Konut kira gelirinin belirli bir tutarı gelir vergisinden istisnadır: 2024 için ${int(KONUT_KIRA_ISTISNASI[2024])} TL, 2025 için ${int(KONUT_KIRA_ISTISNASI[2025])} TL, 2026 için ${int(KONUT_KIRA_ISTISNASI[2026])} TL. İstisnayı aşan kira geliri ertesi yılın Mart ayında yıllık beyannameyle beyan edilir.`,
        'İstisna düşüldükten sonra kalan tutardan ya %15 götürü gider ya da belgelendirilen gerçek giderler indirilir. Kalan matraha ücret dışı gelirler için gelir vergisi tarifesi uygulanır.',
      ],
      formula: ['Vergiye tabi = kira − istisna', 'Matrah = vergiye tabi − gider (götürü: vergiye tabi × %15)', 'Vergi = tarifeye göre (ücret dışı gelirler)'],
      faqs: [
        { q: '2026 kira geliri istisnası ne kadar?', a: '2026 yılında elde edilen konut kira gelirleri için istisna 58.000 TL’dir (2027 Mart’ta beyan edilir). 2025 gelirleri için 47.000 TL’dir.' },
        { q: 'Kira geliri beyannamesi ne zaman verilir?', a: 'Gelirin elde edildiği yılı izleyen yılın 1–31 Mart tarihleri arasında verilir; vergi Mart ve Temmuz aylarında iki eşit taksitte ödenir.' },
        { q: 'Götürü mü gerçek gider mi seçmeliyim?', a: 'Gerçek giderleriniz (belgeli) vergiye tabi kısmın %15’inden fazlaysa gerçek gider avantajlıdır. Götürü gideri seçen 2 yıl geçmeden gerçek gidere dönemez.' },
      ],
      sources: [SRC.gibKira, SRC.gibGv],
    },
  },

  'serbest-meslek-makbuzu-hesaplama': {
    slug: 'serbest-meslek-makbuzu-hesaplama',
    intro: 'Serbest meslek makbuzunda brüt ücret, %20 stopaj ve KDV’yi; brütten, almak istediğiniz netten ya da tahsil edilecek toplamdan hesaplayın.',
    fields: [
      { type: 'select', key: 'giris', label: 'Bildiğiniz tutar', default: 'brut', options: [
        { value: 'brut', label: 'Brüt ücret' }, { value: 'net', label: 'Net ücret (KDV hariç ele geçecek)' }, { value: 'tahsilat', label: 'Tahsil edilecek toplam' },
      ] },
      money('tutar', 'Tutar', 10000),
      { type: 'toggle', key: 'stopaj', label: 'Stopaj kesilecek (%20)', default: true, help: 'Müşteri şirket veya vergi sorumlusuysa stopaj keser; bireysel müşteride kesilmez.' },
      { type: 'select', key: 'kdv', label: 'KDV oranı', default: '20', segmented: true, options: [{ value: '20', label: '%20' }, { value: '10', label: '%10' }, { value: '0', label: 'KDV yok' }] },
    ],
    compute(v) {
      const r = serbestMeslek(n(v, 'tutar'), s(v, 'giris') as SmmGiris, b(v, 'stopaj') ? 0.2 : 0, Number(s(v, 'kdv')) / 100);
      return {
        headline: { label: 'Tahsil edilecek tutar', value: tl(r.tahsilEdilecek), sub: `Brüt ${tl(r.brut)} · net ${tl(r.netUcret)}`, tone: 'primary' },
        rows: [
          { label: 'Brüt ücret', value: tl(r.brut) },
          { label: 'Gelir vergisi stopajı', value: `− ${tl(r.stopaj)}`, tone: 'down' },
          { label: 'Net ücret', value: tl(r.netUcret), strong: true },
          { label: `KDV (%${s(v, 'kdv')}, brüt üzerinden)`, value: `+ ${tl(r.kdv)}` },
          { label: 'Tahsil edilecek (net + KDV)', value: tl(r.tahsilEdilecek), strong: true },
        ],
        notes: ['Stopaj, makbuzu alan tarafından vergi dairesine ödenir ve serbest meslek erbabının yıllık gelir vergisinden mahsup edilir. Bazı hizmetlerde KDV tevkifatı da uygulanabilir.'],
      };
    },
    info: {
      how: [
        'Serbest meslek makbuzunda KDV ve stopaj brüt ücret üzerinden hesaplanır. Müşteri vergi sorumlusuysa brütün %20’sini stopaj olarak keser; KDV ise brüte eklenir. Tahsil edilen tutar = brüt − stopaj + KDV’dir.',
        '%20 stopaj ve %20 KDV’de tahsil edilen toplam brüte eşit olur: 10.000 TL brüt için 2.000 TL stopaj düşülür, 2.000 TL KDV eklenir.',
      ],
      formula: ['Stopaj = brüt × %20', 'KDV = brüt × KDV oranı', 'Tahsil edilecek = brüt − stopaj + KDV', 'Netten brüt = net / 0,80'],
      faqs: [
        { q: 'Bireysel müşteriye kesilen makbuzda stopaj var mı?', a: 'Hayır. Vergi sorumlusu olmayan gerçek kişiler stopaj kesmez; makbuzda brüt + KDV tahsil edilir.' },
        { q: 'Net 8.000 TL almak için brüt kaç TL yazılmalı?', a: '8.000 / 0,80 = 10.000 TL brüt yazılır.' },
      ],
      sources: [SRC.gv193, SRC.kdv],
    },
  },

  'gecikme-zammi-hesaplama': {
    slug: 'gecikme-zammi-hesaplama',
    intro: 'Vadesinde ödenmeyen vergi, SGK primi, MTV veya emlak vergisi borcunun gecikme zammını, oran değişikliklerini dönemlere bölerek hesaplayın.',
    fields: [
      money('tutar', 'Borç (asıl) tutarı', 10000),
      dateField('vade', 'Son ödeme (vade) tarihi', (t) => addMonths(t, -3)),
      dateField('odeme', 'Ödeme tarihi', (t) => t),
    ],
    compute(v) {
      if (s(v, 'odeme') <= s(v, 'vade')) return { error: 'Ödeme tarihi vadeden sonra olmalı.' };
      const r = gecikmeZammi(n(v, 'tutar'), s(v, 'vade'), s(v, 'odeme'));
      return {
        headline: { label: 'Gecikme zammı', value: tl(r.zam), sub: `${r.gun} gün gecikme · toplam borç ${tl(r.toplam)}`, tone: 'down' },
        rows: [
          { label: 'Asıl borç', value: tl(n(v, 'tutar')) },
          { label: 'Gecikme zammı', value: tl(r.zam), tone: 'down' },
          { label: 'Ödenecek toplam', value: tl(r.toplam), strong: true },
        ],
        table: {
          caption: 'Dönemlere göre hesap',
          columns: ['Dönem', 'Aylık oran', 'Süre', 'Zam'],
          rows: r.donemler.map((d) => [`${fmtDateTr(d.baslangic)} – ${fmtDateTr(gosterimBitis(d.bitis))}`, pct(d.oran, 2), `${d.ay} ay ${d.kalanGun} gün`, tl(d.tutar)]),
        },
        notes: ['Ay kesirleri için gecikme zammı gün hesabıyla (aylık oran / 30) uygulanır.'],
      };
    },
    info: {
      how: [
        '6183 sayılı Kanun’un 51. maddesine göre amme alacağı vadesinde ödenmezse, vade tarihinden itibaren her ay için belirlenen oranda gecikme zammı uygulanır; ay kesirleri gün hesabıyla hesaplanır.',
        'Oran 13 Kasım 2025’ten itibaren aylık %3,7’dir (öncesinde 21.05.2024 – 12.11.2025 arası %4,5; 14.11.2023 – 20.05.2024 arası %3,5). Borç birden fazla oran dönemini kapsıyorsa her dönem kendi oranıyla hesaplanır.',
      ],
      formula: ['Zam = borç × (tam ay × aylık oran + kalan gün × aylık oran / 30)'],
      faqs: [
        { q: '2026 gecikme zammı oranı nedir?', a: 'Aylık %3,7’dir (13.11.2025’ten itibaren).' },
        { q: 'Gecikme zammı ile gecikme faizi aynı mı?', a: 'Hayır. Gecikme zammı ödeme süresi geçmiş kamu alacaklarına uygulanır. Gecikme faizi ise ikmalen veya re’sen tarh edilen vergilerde, normal vade ile tarhiyat arasındaki süre için uygulanır; oranı gecikme zammıyla aynıdır.' },
      ],
      sources: [SRC.kanun6183, { label: 'PKF İstanbul — Gecikme zammı ve gecikme faizi oranları', url: 'https://pkf.com.tr/gecikme-zammi-ve-gecikme-faizi-oranlari/' }],
    },
  },

  'yasal-faiz-hesaplama': {
    slug: 'yasal-faiz-hesaplama',
    intro: 'Alacak tutarı ve tarih aralığını girin; kanuni faiz, oran değişikliklerine göre dönemlere bölünerek gün esasıyla hesaplanır.',
    fields: [
      money('tutar', 'Alacak (asıl) tutarı', 100000),
      dateField('bas', 'Faiz başlangıç tarihi', (t) => addMonths(t, -6), { help: 'Temerrüt (dava, ihtar veya vade) tarihi.' }),
      dateField('bit', 'Faiz bitiş tarihi', (t) => t),
      { type: 'select', key: 'tur', label: 'Faiz türü', default: 'kanuni', options: [
        { value: 'kanuni', label: 'Kanuni (yasal) faiz — 3095 s. Kanun' }, { value: 'ozel', label: 'Sabit oran (ticari / avans / sözleşme)' },
      ] },
      percent('oran', 'Yıllık faiz oranı', 45, { showIf: (v) => v.tur === 'ozel' }),
    ],
    compute(v) {
      if (s(v, 'bit') <= s(v, 'bas')) return { error: 'Bitiş tarihi başlangıçtan sonra olmalı.' };
      const r = donemselFaiz(n(v, 'tutar'), s(v, 'bas'), s(v, 'bit'), s(v, 'tur') === 'ozel' ? n(v, 'oran') / 100 : undefined);
      return {
        headline: { label: 'İşlemiş faiz', value: tl(r.faiz), sub: `${int(r.gun)} gün · asıl + faiz ${tl(r.toplam)}`, tone: 'primary' },
        rows: [
          { label: 'Asıl alacak', value: tl(n(v, 'tutar')) },
          { label: 'Faiz', value: tl(r.faiz) },
          { label: 'Toplam', value: tl(r.toplam), strong: true },
        ],
        table: {
          caption: 'Dönemlere göre faiz',
          columns: ['Dönem', 'Yıllık oran', 'Gün', 'Faiz'],
          rows: r.donemler.map((d) => [`${fmtDateTr(d.baslangic)} – ${fmtDateTr(gosterimBitis(d.bitis))}`, pct(d.oran, 2), int(d.gun), tl(d.tutar)]),
        },
        notes: ['Faiz basit faiz ve 365 gün esasıyla hesaplanır; başlangıç günü dahil, bitiş günü hariçtir.'],
      };
    },
    info: {
      how: [
        '3095 sayılı Kanun’a göre kanuni faiz oranı 1.1.2006 – 31.5.2024 arasında yıllık %9, 1.6.2024’ten itibaren %24’tür. 12. Yargı Paketi (7589 sayılı Kanun) ile 31 Temmuz 2026’dan itibaren oran yıllık %31 olmuştur.',
        'Faiz, her dönem için o dönemde geçerli oranla ayrı ayrı hesaplanır: asıl alacak × yıllık oran × gün / 365. Ticari işlerde temerrüt faizi olarak TCMB avans faizi istenebilir; bu durumda “sabit oran” seçeneğini kullanın.',
      ],
      formula: ['Faiz = Σ (alacak × dönem oranı × dönemdeki gün / 365)'],
      faqs: [
        { q: '2026 yasal faiz oranı nedir?', a: '31 Temmuz 2026’dan itibaren yıllık %31’dir. 1 Haziran 2024 – 30 Temmuz 2026 arasında %24 uygulanmıştır.' },
        { q: 'Kanuni faiz ile temerrüt faizi farkı nedir?', a: 'Kanuni faiz, oran kararlaştırılmamış alacaklarda uygulanan faizdir. Temerrüt faizi borçlunun gecikmesi nedeniyle işler; sözleşmede oran yoksa kanuni faiz oranı, ticari işlerde avans faizi oranı uygulanabilir.' },
      ],
      sources: [SRC.kanun3095, { label: 'Harbiye Hukuk — Yeni yasal faiz oranı (12. Yargı Paketi)', url: 'https://www.harbiyehukuk.com/yasal-faiz-orani-nedir/' }],
    },
  },
};
