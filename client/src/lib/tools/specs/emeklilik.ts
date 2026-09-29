// Emeklilik, SGK borçlanması ve BES araçları.

import type { ToolSpec, ToolInfoContent } from '../types';
import { tl, pct, int, yilAy } from '../format';
import { SRC, count, dateField, money, n, percent, s } from './_shared';
import { besHesapla, borclanma, emeklilikHesapla, finansalOzgurluk, type BorclanmaTuru, type Cinsiyet, type Statu } from '@/lib/calculators/sgk';
import { addYears, diffYmd, fmtDateTr, fmtYmd } from '@/lib/calculators/core';
import { DOGUM_BORCLANMA_GUN_LIMIT } from '@/lib/calculators/params';

function borclanmaSpec(slug: string, tur: BorclanmaTuru, gunAlani: ToolSpec['fields'], gunHesap: (v: Record<string, unknown>) => number, info: ToolInfoContent, intro: string): ToolSpec {
  return {
    slug,
    intro,
    fields: [
      ...gunAlani,
      { type: 'select', key: 'kazanc', label: 'Günlük kazanç', default: 'alt', segmented: true, options: [
        { value: 'alt', label: 'En düşük (asgari)' }, { value: 'ozel', label: 'Kendim belirleyeceğim' },
      ], help: 'Seçilen günlük kazanç yüksekse ileride bağlanacak emekli aylığı da artar.' },
      money('gunluk', 'Günlük kazanç', 2000, { showIf: (v) => v.kazanc === 'ozel', help: 'Prime esas günlük kazancın alt ve üst sınırı arasında olmalı.' }),
    ],
    compute(v, { today }) {
      const gun = gunHesap(v);
      if (!(gun > 0)) return null;
      const r = borclanma(tur, gun, s(v, 'kazanc') === 'ozel' ? n(v, 'gunluk') : null, today);
      return {
        headline: { label: 'Borçlanma tutarı', value: tl(r.toplam), sub: `${int(gun)} gün × ${tl(r.gunlukPrim)}`, tone: 'primary' },
        rows: [
          { label: 'Borçlanılacak gün', value: `${int(gun)} gün` },
          { label: 'Günlük kazanç', value: tl(r.gunlukKazanc) },
          { label: 'Prim oranı', value: pct(r.oran, 0) },
          { label: 'Günlük prim', value: tl(r.gunlukPrim) },
          { label: 'Toplam borçlanma', value: tl(r.toplam), strong: true },
        ],
        notes: [
          `Günlük kazanç alt sınırı ${tl(r.gunlukAlt)}, üst sınırı ${tl(r.gunlukUst)}.`,
          'Borçlanma tutarı tebliğden itibaren 1 ay içinde ödenmelidir; ödenmezse yeniden başvuru gerekir. Tutar başvuru tarihindeki asgari ücrete göre hesaplanır.',
        ],
      };
    },
    info,
  };
}

export const specs: Record<string, ToolSpec> = {
  'emeklilik-hesaplama': {
    slug: 'emeklilik-hesaplama',
    intro: 'Doğum tarihiniz, ilk sigorta giriş tarihiniz ve prim gününüzle SGK (4/a) veya Bağ-Kur (4/b) için tahmini emeklilik tarihinizi görün.',
    fields: [
      { type: 'select', key: 'statu', label: 'Sigorta türü', default: '4a', segmented: true, options: [
        { value: '4a', label: 'SSK (4/a)' }, { value: '4b', label: 'Bağ-Kur (4/b)' },
      ] },
      { type: 'select', key: 'cins', label: 'Cinsiyet', default: 'erkek', segmented: true, options: [
        { value: 'kadin', label: 'Kadın' }, { value: 'erkek', label: 'Erkek' },
      ] },
      dateField('dogum', 'Doğum tarihi', '1985-06-15'),
      dateField('giris', 'İlk sigorta giriş tarihi', '2005-03-01', { help: 'e-Devlet “SGK Tescil ve Hizmet Dökümü”nde yazan ilk giriş tarihi.' }),
      count('prim', 'Toplam prim günü', 5000, 'gün', { integer: true }),
      count('yillik', 'Bundan sonra yılda ödenecek prim', 360, 'gün', { integer: true, max: 360, help: 'Kesintisiz çalışmada yılda 360 gün.' }),
    ],
    compute(v, { today }) {
      if (s(v, 'giris') < s(v, 'dogum')) return { error: 'Giriş tarihi doğum tarihinden önce olamaz.' };
      const r = emeklilikHesapla({
        statu: s(v, 'statu') as Statu, cinsiyet: s(v, 'cins') as Cinsiyet, dogum: s(v, 'dogum'), giris: s(v, 'giris'),
        primGun: n(v, 'prim'), bugun: today, yillikPrim: n(v, 'yillik'),
      });
      if (r.emeklilikTarihi.startsWith('9999')) return { error: 'Prim günü tamamlanamıyor; yıllık prim gününü artırın.' };
      const emekli = r.emeklilikTarihi <= today;
      const kalan = diffYmd(today, r.emeklilikTarihi);
      const yas = diffYmd(s(v, 'dogum'), r.emeklilikTarihi).years;
      const donemAdi = r.donem === 'eyt' ? '8 Eylül 1999 öncesi (EYT)' : r.donem === '1999-2008' ? '9 Eylül 1999 – 30 Nisan 2008' : '1 Mayıs 2008 sonrası';
      return {
        headline: emekli
          ? { label: 'Emeklilik şartları', value: 'Tamamlanmış', sub: 'Yaşlılık aylığı için başvurabilirsiniz', tone: 'up' }
          : { label: 'Tahmini emeklilik tarihi', value: fmtDateTr(r.emeklilikTarihi), sub: `${fmtYmd(kalan)} sonra · ${yas} yaşında`, tone: 'primary' },
        rows: [
          { label: 'Tabi olduğunuz dönem', value: donemAdi },
          { label: 'Gereken prim günü', value: `${int(r.gerekenGun)} gün` },
          { label: 'Prim gününün tamamlanması', value: r.primTamamlanma <= today ? 'Tamamlandı' : fmtDateTr(r.primTamamlanma) },
          ...(r.gerekenYas != null ? [{ label: 'Gereken yaş', value: `${r.gerekenYas}` }, { label: 'Yaşın tamamlanması', value: r.yasTamamlanma! <= today ? 'Tamamlandı' : fmtDateTr(r.yasTamamlanma!) }] : [{ label: 'Yaş şartı', value: 'Yok' }]),
          ...(r.gerekenSigortalilikYil != null ? [{ label: 'Gereken sigortalılık süresi', value: `${r.gerekenSigortalilikYil} yıl` }, { label: 'Sigortalılık süresinin dolması', value: r.sigortalilikTamamlanma! <= today ? 'Tamamlandı' : fmtDateTr(r.sigortalilikTamamlanma!) }] : []),
          { label: 'Emeklilik tarihi', value: emekli ? 'Şartlar sağlandı' : fmtDateTr(r.emeklilikTarihi), strong: true },
        ],
        notes: [r.aciklama, 'Tahmin; prim günlerinin bundan sonra girdiğiniz hızda birikeceği varsayımıyla yapılır. Borçlanma ve farklı statülerde geçen hizmetler sonucu değiştirebilir; kesin bilgi için SGK’ya başvurun.'],
      };
    },
    info: {
      how: [
        'Emeklilik şartları ilk sigorta giriş tarihine göre üç dönemde belirlenir. 8 Eylül 1999 ve öncesinde girişi olanlarda EYT düzenlemesiyle yaş şartı kaldırılmıştır; 4/a için giriş tarihine göre 5000–5975 prim günü ile kadınlarda 20, erkeklerde 25 yıl sigortalılık aranır.',
        '9 Eylül 1999 – 30 Nisan 2008 arası girişlilerde 4/a için kadınlarda 58, erkeklerde 60 yaş ve 7000 prim günü (veya aynı yaşlarda 25 yıl sigortalılık ve 4500 gün) gerekir. Bağ-Kur’da 9000 gün aranır.',
        '1 Mayıs 2008 ve sonrası girişlilerde 4/a için 7200, 4/b için 9000 prim günü gerekir. Yaş, prim şartının tamamlandığı yıla göre 2036’dan itibaren kademeli olarak 65’e yükselir.',
      ],
      faqs: [
        { q: '1999 öncesi girişliler kaç günle emekli olur?', a: 'SSK’lılar ilk giriş tarihine göre 5000 ile 5975 gün arasında prim ve kadınlarda 20, erkeklerde 25 yıl sigortalılık süresiyle, yaş şartı olmadan emekli olur.' },
        { q: '2008 sonrası girişliler kaç yaşında emekli olur?', a: '7200 günü 2035 sonuna kadar tamamlayanlar kadınlarda 58, erkeklerde 60 yaşında emekli olur. Sonraki yıllarda yaş kademeli artar ve 2048’den itibaren herkes için 65 olur.' },
        { q: 'Prim günümü nasıl öğrenirim?', a: 'e-Devlet’te “SGK Tescil ve Hizmet Dökümü” hizmetinden toplam prim gününüzü ve ilk giriş tarihinizi görebilirsiniz.' },
      ],
      sources: [SRC.eyt, SRC.kanun5510],
    },
  },

  'askerlik-borclanmasi-hesaplama': borclanmaSpec(
    'askerlik-borclanmasi-hesaplama', 'askerlik',
    [count('ay', 'Askerlik süresi', 12, 'ay', { help: 'Er/erbaş olarak yapılan süre. Gün olarak girmek için ay yerine 0 yazıp gün alanını kullanın.' }), count('ekgun', 'Ek gün', 0, 'gün', { integer: true, optional: true })],
    (v) => Math.round((Number(v.ay) || 0) * 30 + (Number(v.ekgun) || 0)),
    {
      how: [
        'Askerlik borçlanmasında, borçlanılacak her gün için seçtiğiniz günlük kazancın belirli bir oranı prim olarak ödenir. 7566 sayılı Kanunla 1 Ocak 2026’dan itibaren askerlik borçlanması oranı %32’den %45’e çıkarıldı.',
        'Günlük kazanç, brüt asgari ücretin 30’da biri (2026: 1.101 TL) ile bunun 9 katı arasında serbestçe seçilir. En düşük tutarla borçlanıldığında 2026’da günlük prim 495,45 TL’dir.',
      ],
      formula: ['Borçlanma = gün × günlük kazanç × %45'],
      faqs: [
        { q: '2026’da 12 ay askerlik borçlanması ne kadar?', a: '360 gün × 495,45 TL = 178.362 TL (en düşük kazançla).' },
        { q: 'Askerlik borçlanması emeklilik tarihini öne çeker mi?', a: 'Borçlanılan günler prim gününe eklenir. Sigorta girişinden önceki askerlik borçlanıldığında giriş tarihi de borçlanılan gün kadar geriye çekilir; bu da EYT veya daha avantajlı bir döneme girmeyi sağlayabilir.' },
        { q: 'Yedek subaylık süresi borçlanılabilir mi?', a: 'Evet, er ve erbaş olarak yapılan süreler ile yedek subay okulunda geçen süreler borçlanılabilir.' },
      ],
      sources: [SRC.borclanma, SRC.kanun5510, SRC.sgkPek],
    },
    '2026’dan itibaren askerlik borçlanması %45 oranıyla hesaplanır. Askerlik sürenizi ve günlük kazanç tercihinizi girin.',
  ),

  'dogum-borclanmasi-hesaplama': borclanmaSpec(
    'dogum-borclanmasi-hesaplama', 'dogum',
    [
      { type: 'select', key: 'cocuk', label: 'Çocuk sayısı', default: '1', segmented: true, options: [{ value: '1', label: '1' }, { value: '2', label: '2' }, { value: '3', label: '3' }] },
      count('gun', 'Çocuk başına borçlanılacak gün', DOGUM_BORCLANMA_GUN_LIMIT, 'gün', { integer: true, max: DOGUM_BORCLANMA_GUN_LIMIT, help: 'Her doğum için en fazla 2 yıl (720 gün).' }),
    ],
    (v) => Number(v.cocuk) * Math.min(DOGUM_BORCLANMA_GUN_LIMIT, Number(v.gun) || 0),
    {
      how: [
        'Kadın sigortalılar, doğumdan sonraki 2 yıllık süreyi (720 gün), çalışmamak ve çocuğun yaşaması şartıyla en fazla 3 doğum için borçlanabilir. Doğum borçlanmasında prim oranı %32’dir; 2026’da askerlik borçlanmasına getirilen %45 oranı doğum borçlanmasına uygulanmaz.',
        'En düşük günlük kazançla 2026’da günlük prim 352,32 TL, bir çocuk için 720 günlük borçlanma 253.670,40 TL’dir.',
      ],
      formula: ['Borçlanma = gün × günlük kazanç × %32'],
      faqs: [
        { q: 'Doğum borçlanması için şartlar nelerdir?', a: 'Kadın sigortalı olmak, borçlanılacak sürede sigortalı olarak çalışmamış olmak ve çocuğun yaşıyor olması gerekir. Hizmet dökümünüze göre hangi doğumların borçlanılabileceğini SGK başvurusunda netleştirebilirsiniz.' },
        { q: '2 çocuk için doğum borçlanması ne kadar?', a: 'En düşük kazançla 1.440 gün × 352,32 TL = 507.340,80 TL.' },
        { q: 'Kısmi borçlanma yapılabilir mi?', a: 'Evet, 720 günün tamamı yerine emeklilik için eksik olan gün kadar borçlanabilirsiniz.' },
      ],
      sources: [SRC.borclanma, SRC.kanun5510, SRC.sgkPek],
    },
    'Çocuk başına 720 güne kadar, %32 oranıyla doğum borçlanması tutarını hesaplayın.',
  ),

  'yurtdisi-borclanmasi-hesaplama': borclanmaSpec(
    'yurtdisi-borclanmasi-hesaplama', 'yurtdisi',
    [count('gun', 'Borçlanılacak gün', 1800, 'gün', { integer: true, help: 'Yurt dışında sigortalı veya ikamet ederek geçen, borçlanmak istediğiniz süre.' })],
    (v) => Number(v.gun) || 0,
    {
      how: [
        '3201 sayılı Kanun kapsamında yurt dışında geçen sigortalılık, ev kadınlığı veya işsizlik süreleri Türkiye’de borçlanılabilir. Borçlanma tutarı, seçilen günlük kazancın %45’idir.',
        'Günlük kazanç brüt asgari ücretin 30’da biri ile 9 katı arasında seçilir; 2026’da en düşük günlük prim 495,45 TL’dir.',
      ],
      formula: ['Borçlanma = gün × günlük kazanç × %45'],
      faqs: [
        { q: 'Yurt dışı borçlanması kaç günlük yapılabilir?', a: 'Yurt dışında sigortalı çalışılan veya ikamet edilen sürelerin tamamı ya da istenen kısmı borçlanılabilir.' },
        { q: 'Yurt dışı borçlanmasıyla emekli aylığı nasıl hesaplanır?', a: 'Borçlanılan süre Türkiye’deki hizmete eklenir ve seçtiğiniz günlük kazanç aylık hesabında dikkate alınır.' },
      ],
      sources: [SRC.borclanma, SRC.sgkPek],
    },
    'Yurt dışında geçen sürelerinizin borçlanma tutarını %45 oranıyla hesaplayın.',
  ),

  'bes-hesaplama': {
    slug: 'bes-hesaplama',
    intro: 'Aylık katkı payınızı, süreyi ve beklenen yıllık getiriyi girin; BES birikiminizi ve %20 devlet katkısını görün.',
    fields: [
      money('katki', 'Aylık katkı payı', 3000),
      count('yil', 'Süre', 10, 'yıl', { min: 1, max: 60 }),
      percent('getiri', 'Beklenen yıllık getiri', 30, { help: 'Fonların ortalama yıllık getirisi (nominal).' }),
      count('yas', 'Başlangıç yaşınız', 35, 'yaş', { integer: true, min: 18, max: 80 }),
    ],
    compute(v, { today }) {
      const r = besHesapla(n(v, 'katki'), n(v, 'yil'), n(v, 'getiri') / 100, n(v, 'yas'), today);
      return {
        headline: { label: 'Tahmini toplam birikim', value: tl(r.toplamBirikim), sub: `${n(v, 'yil')} yıl sonra · hak ediş ${pct(r.hakEdisOrani, 0)}`, tone: 'up' },
        sections: [
          { title: 'Katkı payları', rows: [
            { label: 'Ödenen toplam katkı', value: tl(r.toplamKatki) },
            { label: 'Katkı birikimi (getiri dahil)', value: tl(r.katkiBirikimi), strong: true },
          ] },
          { title: 'Devlet katkısı', rows: [
            { label: 'Devlet katkısı oranı', value: pct(r.devletKatkiOrani, 0) },
            { label: 'Aylık devlet katkısı', value: tl(r.aylikDevletKatkisi) },
            { label: 'Yıllık üst sınır', value: tl(r.yillikTavan) },
            { label: 'Devlet katkısı birikimi', value: tl(r.devletKatkisiBirikimi) },
            { label: `Hak edilen (${pct(r.hakEdisOrani, 0)})`, value: tl(r.hakEdilenDevletKatkisi), strong: true },
          ] },
        ],
        notes: ['Getiri garantili değildir. Hesap, katkıların ve devlet katkısının her ay sonunda yatırıldığı ve devlet katkısı üst sınırının bugünkü tutarında kaldığı varsayımıyla yapılır.'],
        table: {
          caption: 'Devlet katkısı hak ediş oranları',
          columns: ['Sistemde kalma süresi', 'Hak ediş'],
          rows: [['3 yıldan az', '%0'], ['3–6 yıl', '%15'], ['6–10 yıl', '%35'], ['10 yıl ve üzeri', '%60'], ['10 yıl + 56 yaş (emeklilik)', '%100']],
        },
      };
    },
    info: {
      how: [
        'Bireysel emeklilik sisteminde ödenen her katkı payına devlet belirli oranda katkı ekler. 7 Ocak 2026 tarihli Cumhurbaşkanı Kararıyla 1 Ocak 2026’dan itibaren devlet katkısı oranı %30’dan %20’ye indirildi.',
        'Bir yılda alınabilecek devlet katkısı, o yılın brüt asgari ücret toplamının %20’siyle sınırlıdır (2026: 79.272 TL). Devlet katkısının ne kadarının size kalacağı sistemde kalma sürenize ve yaşınıza bağlıdır.',
      ],
      formula: ['Aylık devlet katkısı = min(katkı × %20, yıllık üst sınır / 12)', 'Birikim = her ay: önceki birikim × (1 + aylık getiri) + aylık ödeme'],
      faqs: [
        { q: '2026’da maksimum devlet katkısı ne kadar?', a: '79.272 TL. Bunun için yıl içinde 396.360 TL katkı payı ödemek gerekir (aylık 33.030 TL).' },
        { q: 'BES’ten erken çıkarsam ne olur?', a: 'Katkı paylarınız ve getirisi size ödenir; getiriden stopaj kesilir. Devlet katkısından ise yalnızca hak ettiğiniz oran (3 yıldan az kalınmışsa %0) ödenir.' },
        { q: 'Otomatik katılımda da devlet katkısı var mı?', a: 'Evet, otomatik katılım sisteminde de katkı paylarına aynı oranda devlet katkısı verilir.' },
      ],
      sources: [SRC.egm],
    },
  },

  'emekli-zammi-hesaplama': {
    slug: 'emekli-zammi-hesaplama',
    intro: 'SSK ve Bağ-Kur emekli aylıkları her 6 ayda bir, önceki 6 ayın enflasyonu oranında artırılır. Aylık enflasyon oranlarını girin; zam oranı ve yeni aylığınız hesaplansın.',
    fields: [
      money('aylik', 'Mevcut emekli aylığı', 20000),
      percent('a1', '1. ay enflasyonu', 2, { max: 100 }),
      percent('a2', '2. ay enflasyonu', 2, { max: 100 }),
      percent('a3', '3. ay enflasyonu', 2, { max: 100 }),
      percent('a4', '4. ay enflasyonu', 2, { max: 100 }),
      percent('a5', '5. ay enflasyonu', 2, { max: 100 }),
      percent('a6', '6. ay enflasyonu', 2, { max: 100 }),
      percent('refah', 'Ek refah payı', 0, { optional: true }),
      money('taban', 'En düşük emekli aylığı (taban)', null, { optional: true, help: 'Hesaplanan aylık tabanın altında kalırsa taban ödenir.' }),
    ],
    compute(v) {
      const aylar = ['a1', 'a2', 'a3', 'a4', 'a5', 'a6'].map((k) => n(v, k) / 100);
      const kum = aylar.reduce((c, m) => c * (1 + m), 1) - 1;
      const refah = (n(v, 'refah') || 0) / 100;
      const zam = (1 + kum) * (1 + refah) - 1;
      const hesaplanan = n(v, 'aylik') * (1 + zam);
      const taban = n(v, 'taban');
      const yeni = taban > 0 ? Math.max(taban, hesaplanan) : hesaplanan;
      return {
        headline: { label: 'Zamlı emekli aylığı', value: tl(yeni), sub: `Zam oranı ${pct(zam)} · artış ${tl(yeni - n(v, 'aylik'))}`, tone: 'up' },
        rows: [
          { label: '6 aylık kümülatif enflasyon', value: pct(kum) },
          ...(refah ? [{ label: 'Refah payı', value: pct(refah) }] : []),
          { label: 'Toplam zam oranı', value: pct(zam), strong: true },
          { label: 'Hesaplanan aylık', value: tl(hesaplanan) },
          ...(taban > 0 && taban > hesaplanan ? [{ label: 'Taban aylık uygulandı', value: tl(taban) }] : []),
          { label: 'Yeni aylık', value: tl(yeni), strong: true },
        ],
        notes: ['Kümülatif oran aylık oranların toplanmasıyla değil, çarpılmasıyla bulunur: (1 + a₁) × … × (1 + a₆) − 1.'],
      };
    },
    info: {
      how: [
        'SSK ve Bağ-Kur emeklilerinin aylıkları Ocak ve Temmuz aylarında, önceki 6 aylık dönemin TÜFE artışı oranında yükseltilir. 6 aylık oran, aylık enflasyon oranlarının bileşik çarpımıyla hesaplanır.',
        'En düşük emekli aylığı kanunla ayrıca belirlenir; hesaplanan aylık bu tutarın altında kalırsa taban tutar ödenir.',
      ],
      formula: ['6 aylık zam = (1 + a₁)(1 + a₂)(1 + a₃)(1 + a₄)(1 + a₅)(1 + a₆) − 1', 'Yeni aylık = mevcut aylık × (1 + zam)'],
      faqs: [
        { q: 'Emekli zammı neden aylık enflasyonların toplamı değil?', a: 'Enflasyon her ay bir önceki ayın fiyat seviyesi üzerine eklenir. Bu yüzden oranlar çarpılır; toplama yöntemi gerçek artıştan düşük sonuç verir.' },
        { q: 'Memur emeklilerinin zammı nasıl hesaplanır?', a: 'Memur ve memur emeklilerinde toplu sözleşme zammı ile 6 aylık enflasyonun toplu sözleşme zammını aşan kısmı (enflasyon farkı) birlikte uygulanır.' },
      ],
    },
  },

  'finansal-ozgurluk-hesaplama': {
    slug: 'finansal-ozgurluk-hesaplama',
    intro: 'Aylık giderinize göre çalışmadan yaşamak için gereken birikimi ve bu hedefe düzenli yatırımla ne zaman ulaşacağınızı görün.',
    fields: [
      money('gider', 'Aylık gideriniz (bugünkü)', 50000),
      percent('cekim', 'Yıllık güvenli çekim oranı', 4, { help: 'Birikimden her yıl çekeceğiniz oran. Yaygın kural %4.' }),
      money('mevcut', 'Mevcut birikim', 500000, { optional: true }),
      money('yatirim', 'Aylık yatırım', 20000),
      percent('reel', 'Beklenen reel (enflasyon üstü) getiri', 4, { help: 'Enflasyondan arındırılmış yıllık getiri. Sonuçlar bugünkü fiyatlarla ifade edilir.' }),
    ],
    compute(v) {
      if (!(n(v, 'cekim') > 0)) return { error: 'Çekim oranı sıfırdan büyük olmalı.' };
      const r = finansalOzgurluk(n(v, 'gider'), n(v, 'cekim') / 100, n(v, 'mevcut') || 0, n(v, 'yatirim'), n(v, 'reel') / 100);
      return {
        headline: r.ay == null
          ? { label: 'Hedef birikim', value: tl(r.hedef), sub: '100 yılda ulaşılamıyor; aylık yatırımı artırın', tone: 'down' }
          : r.ay === 0
            ? { label: 'Hedef birikim', value: tl(r.hedef), sub: 'Hedefe zaten ulaşmışsınız', tone: 'up' }
            : { label: 'Hedefe ulaşma süresi', value: yilAy(r.ay / 12), sub: `Hedef birikim ${tl(r.hedef)}`, tone: 'up' },
        rows: [
          { label: 'Yıllık gider', value: tl(n(v, 'gider') * 12) },
          { label: 'Gereken birikim (gider × 12 / çekim oranı)', value: tl(r.hedef), strong: true },
          { label: 'Aylık yatırım', value: tl(n(v, 'yatirim')) },
          ...(r.ay ? [{ label: 'Ulaşma süresi', value: `${r.ay} ay (${yilAy(r.ay / 12)})` }] : []),
        ],
        notes: ['Tüm tutarlar bugünkü alım gücüyle ifade edilir (reel getiri kullanıldığı için).'],
      };
    },
    info: {
      how: [
        '“%4 kuralı”, birikimin her yıl %4’ünü çekerek uzun yıllar boyunca tükenmeden yaşamanın mümkün olduğunu öngören bir planlama yaklaşımıdır. Buna göre gereken birikim, yıllık giderin 25 katıdır.',
        'Hedefe ulaşma süresi, mevcut birikim ve aylık yatırımların reel getiriyle aylık bileşik büyüdüğü varsayılarak hesaplanır.',
      ],
      formula: ['Hedef = aylık gider × 12 / çekim oranı', 'Birikim(ay) = birikim × (1 + r) + aylık yatırım'],
      faqs: [
        { q: 'Türkiye için %4 kuralı uygun mu?', a: 'Kural ABD piyasa verilerine dayanır. Yüksek enflasyon ve kur oynaklığı olan ekonomilerde daha temkinli bir oran (%3–3,5) seçmek güvenlik payı sağlar.' },
      ],
    },
  },
};
