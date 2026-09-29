// Kredi ve kredi kartı araçları (eski elle yazılmış araçların bildirimsel karşılıkları).
// URL parametre adları eski araçlarla aynıdır; paylaşılmış linkler çalışmaya devam eder.

import type { CalcResult, ToolInfoContent, ToolSpec } from '../types';
import { tl, pct } from '../format';
import { b, count, money, n, percent, s } from './_shared';
import {
  KREDI_DOSYA_MASRAFI_ORANI, KREDI_VERGI, asgariOdemeOrani, erkenKapatmaTazminati, kartGecikme, kartTaksit, krediGecikme,
  krediPlani, krediYapilandirma, neKadarKredi, yillikMaliyetOrani, type KrediPlani, type Vergi,
} from '@/lib/calculators/kredi';
import { KART_AZAMI_FAIZ, kartAzamiFaiz } from '@/lib/calculators/params';

const TUR_OPTS = [
  { value: 'ihtiyac', label: 'İhtiyaç' }, { value: 'tasit', label: 'Taşıt' }, { value: 'konut', label: 'Konut' }, { value: 'ticari', label: 'Ticari' },
];
const turVergi = (t: string): Vergi => KREDI_VERGI[(t in KREDI_VERGI ? t : 'ihtiyac') as keyof typeof KREDI_VERGI];

const VERGI_FAQ = {
  bsmv: { q: 'BSMV ve KKDF nedir?', a: 'Banka ve Sigorta Muameleleri Vergisi (BSMV) ve Kaynak Kullanımını Destekleme Fonu (KKDF), kredi faizi üzerinden alınır. Tüketici kredilerinde (ihtiyaç, taşıt, kredi kartı) BSMV %15, KKDF %15; ticari kredilerde BSMV %5, KKDF %0’dır.' },
};

/** Ödeme planı sonucu (taksit, toplamlar, tablo) */
function planSonucu(p: KrediPlani, tutar: number, v: Vergi): CalcResult {
  const yillik = (1 + p.aylikMaliyet) ** 12 - 1;
  return {
    headline: { label: 'Aylık taksit', value: tl(p.taksit), sub: `Toplam geri ödeme ${tl(p.toplamOdeme)}`, tone: 'primary' },
    rows: [
      { label: 'Kredi tutarı', value: tl(tutar) },
      { label: 'Aylık taksit', value: tl(p.taksit), strong: true },
      { label: 'Toplam faiz', value: tl(p.toplamFaiz) },
      ...(v.bsmv ? [{ label: `BSMV (%${v.bsmv * 100})`, value: tl(p.toplamBsmv) }] : []),
      ...(v.kkdf ? [{ label: `KKDF (%${v.kkdf * 100})`, value: tl(p.toplamKkdf) }] : []),
      { label: 'Toplam geri ödeme', value: tl(p.toplamOdeme), strong: true },
      { label: 'Aylık maliyet (vergiler dahil)', value: pct(p.aylikMaliyet) },
      { label: 'Yıllık bileşik maliyet', value: pct(yillik) },
    ],
    table: {
      caption: 'Ödeme planı',
      columns: ['Ay', 'Taksit', 'Anapara', 'Faiz', ...(v.bsmv || v.kkdf ? ['Vergi'] : []), 'Kalan'],
      rows: p.satirlar.map((r) => [String(r.ay), tl(r.taksit), tl(r.anapara), tl(r.faiz), ...(v.bsmv || v.kkdf ? [tl(r.bsmv + r.kkdf)] : []), tl(r.kalan)]),
      collapseAfter: 12,
    },
  };
}

const PLAN_HOW = [
  'Eşit taksitli kredilerde her ay aynı tutar ödenir. Taksitin içindeki faiz payı kalan anapara üzerinden hesaplandığı için ilk aylarda yüksek, son aylarda düşüktür; anapara payı ise giderek artar.',
  'Faiz üzerinden alınan BSMV ve KKDF taksite dahildir. Bu yüzden taksit, aylık faiz oranı × (1 + BSMV + KKDF) efektif oranıyla hesaplanır.',
];
const PLAN_FORMULA = ['Efektif oran r = aylık faiz × (1 + BSMV + KKDF)', 'Taksit = K × r × (1 + r)ⁿ / ((1 + r)ⁿ − 1)', 'Her ay: faiz = kalan × aylık faiz; anapara = taksit − faiz − vergiler'];

function krediSpec(slug: string, v: Vergi, maxVade: number, def: [number, number, number], intro: string, info: Omit<ToolInfoContent, 'how' | 'formula'> & { how?: string[] }): ToolSpec {
  return {
    slug,
    intro,
    fields: [
      money('amount', 'Kredi tutarı', def[0], { min: 1 }),
      count('term', 'Vade', def[1], 'ay', { integer: true, min: 1, max: maxVade }),
      percent('rate', 'Aylık faiz oranı', def[2], { min: 0.01, max: 20 }),
    ],
    compute(val) {
      const p = krediPlani(n(val, 'amount'), n(val, 'rate') / 100, n(val, 'term'), v);
      return planSonucu(p, n(val, 'amount'), v);
    },
    info: { how: [...(info.how ?? []), ...PLAN_HOW], formula: PLAN_FORMULA, faqs: info.faqs, sources: info.sources },
  };
}

export const specs: Record<string, ToolSpec> = {
  'ihtiyac-kredisi': krediSpec('ihtiyac-kredisi', KREDI_VERGI.ihtiyac, 120, [100000, 24, 3.49],
    'İhtiyaç kredisinin aylık taksitini, toplam geri ödemesini ve ödeme planını BSMV (%15) ve KKDF (%15) dahil hesaplayın.',
    { how: ['İhtiyaç kredisi, eğitim, sağlık, tatil gibi harcamalar için bireylere verilen tüketici kredisidir.'], faqs: [
      VERGI_FAQ.bsmv,
      { q: 'İhtiyaç kredisi erken kapatılırsa ceza var mı?', a: 'Tüketici kredilerinde erken ödemede henüz işlememiş faiz ve buna bağlı vergiler düşülür; konut dışındaki tüketici kredilerinde erken ödeme tazminatı alınmaz.' },
      { q: 'Faiz oranı neye göre belirlenir?', a: 'Bankanın fonlama maliyeti, kredi notunuz, vade ve tutara göre belirlenir. Teklifleri Kredi Karşılaştırma aracıyla kıyaslayabilirsiniz.' },
    ] }),
  'tasit-kredisi': krediSpec('tasit-kredisi', KREDI_VERGI.tasit, 60, [750000, 24, 3.19],
    'Sıfır veya ikinci el araç için taşıt kredisinin taksitini ve toplam maliyetini BSMV ve KKDF dahil hesaplayın.',
    { faqs: [
      VERGI_FAQ.bsmv,
      { q: 'Taşıt kredisinde vade ve tutar sınırı var mı?', a: 'BDDK, aracın fatura değerine göre kullandırılabilecek kredi oranını ve azami vadeyi sınırlar; sınırlar dönem dönem güncellendiği için bankanızdan teyit edin.' },
    ] }),
  'is-yeri-kredisi': krediSpec('is-yeri-kredisi', KREDI_VERGI.ticari, 120, [1000000, 36, 3.29],
    'İş yeri kredisi taksitini ve toplam maliyetini hesaplayın. Ticari kredilerde KKDF uygulanmaz, BSMV %5’tir.',
    { how: ['İş yeri kredisi, ticari gayrimenkul alımı veya iş yeri geliştirme için kullanılan ticari kredidir.'], faqs: [VERGI_FAQ.bsmv, { q: 'İş yeri kredisini kimler kullanabilir?', a: 'Ticari faaliyet gösteren gerçek ve tüzel kişiler.' }] }),
  'ticari-kredi': krediSpec('ticari-kredi', KREDI_VERGI.ticari, 120, [500000, 24, 3.39],
    'Ticari kredinin aylık taksitini, toplam faizini ve ödeme planını hesaplayın (BSMV %5, KKDF %0).',
    { faqs: [VERGI_FAQ.bsmv, { q: 'Ticari kredi faizleri neden farklı?', a: 'Ticari kredilerde faiz, firmanın risk profili, teminatı ve bankayla ilişkisine göre bireysel kredilerden ayrı belirlenir.' }] }),
  'ticari-ihtiyac-kredisi': krediSpec('ticari-ihtiyac-kredisi', KREDI_VERGI.ticari, 120, [250000, 12, 3.49],
    'İşletme sermayesi ve kısa vadeli ihtiyaçlar için ticari ihtiyaç kredisinin taksitini hesaplayın (BSMV %5, KKDF %0).',
    { faqs: [VERGI_FAQ.bsmv, { q: 'Bireysel ihtiyaç kredisinden farkı nedir?', a: 'Ticari kredide KKDF alınmaz ve BSMV %5’tir; bireysel ihtiyaç kredisinde BSMV ve KKDF %15’er uygulanır.' }] }),
  'ticari-arac-kredisi': krediSpec('ticari-arac-kredisi', KREDI_VERGI.ticari, 60, [1500000, 36, 3.29],
    'Kamyonet, minibüs gibi ticari araçlar için kredi taksitini ve toplam maliyetini hesaplayın (BSMV %5, KKDF %0).',
    { faqs: [VERGI_FAQ.bsmv, { q: 'Bireyler ticari araç kredisi alabilir mi?', a: 'Genellikle ticari faaliyeti olan kişi ve kurumlara sunulur; bireysel araç alımında taşıt kredisi kullanılır.' }] }),

  'konut-kredisi': {
    slug: 'konut-kredisi',
    intro: 'Konut kredisinin aylık taksitini, toplam geri ödemesini ve ödeme planını hesaplayın. Konut kredilerinde KKDF yoktur; üzerinize kayıtlı konut yoksa BSMV de alınmaz.',
    fields: [
      money('amount', 'Kredi tutarı', 2000000, { min: 1 }),
      count('term', 'Vade', 120, 'ay', { integer: true, min: 1, max: 360 }),
      percent('rate', 'Aylık faiz oranı', 2.59, { min: 0.01, max: 20 }),
      { type: 'toggle', key: 'hasOtherProperty', label: 'Kredi tarihinde üzerime kayıtlı başka konut var', default: false, help: 'Bu durumda BSMV istisnası uygulanmaz (%5 BSMV).' },
    ],
    compute(v) {
      const vergi = b(v, 'hasOtherProperty') ? KREDI_VERGI.konutIkinci : KREDI_VERGI.konut;
      const r = planSonucu(krediPlani(n(v, 'amount'), n(v, 'rate') / 100, n(v, 'term'), vergi), n(v, 'amount'), vergi);
      r.notes = [b(v, 'hasOtherProperty')
        ? 'Kredi kullanım tarihinde üzerine kayıtlı konutu olanlara verilen konut kredilerinde BSMV istisnası uygulanmaz; hesapta %5 BSMV kullanıldı. Bankanızın sözleşmesindeki oranı teyit edin.'
        : 'Kredi tarihinde üzerinize kayıtlı konut yoksa konut kredisi BSMV ve KKDF’den muaftır.'];
      return r;
    },
    info: {
      how: ['Konut kredileri KKDF’den muaftır. BSMV istisnası ise kredinin kullanıldığı tarihte üzerine kayıtlı konutu olmayan tüketicilere verilen konut kredileri için geçerlidir (Gider Vergileri Kanunu md. 29).', ...PLAN_HOW],
      formula: PLAN_FORMULA,
      faqs: [
        { q: 'Konut kredisinde BSMV ve KKDF var mı?', a: 'KKDF yoktur. Kredi tarihinde üzerinize kayıtlı konut yoksa BSMV de alınmaz; başka konutunuz varsa BSMV istisnası uygulanmaz.' },
        { q: 'Konut kredisi erken kapatılırsa ceza var mı?', a: 'Sabit faizli konut kredilerinde kalan vade 36 ay ve altındaysa erken ödenen tutarın %1’i, 36 aydan fazlaysa %2’si kadar erken ödeme tazminatı alınabilir.' },
        { q: 'Evin değerinin ne kadarı kredilendirilebilir?', a: 'BDDK, konutun değerine ve enerji sınıfına göre kredi/değer oranı sınırları uygular; güncel oranı bankanızdan öğrenin.' },
      ],
      sources: [{ label: 'Müşavir Rotası — Konut kredilerinde BSMV', url: 'https://www.musavirrotasi.com/yazar/melek-oz/konut-icin-kullanilan-kredilerde-banka-ve-sigorta-muameleleri-vergisi-var-mi' }],
    },
  },

  'kredi-hesaplama': {
    slug: 'kredi-hesaplama',
    intro: 'Kredi türünü seçin; taksit, toplam geri ödeme ve ödeme planı türün vergileriyle hesaplansın.',
    fields: [
      { type: 'select', key: 'type', label: 'Kredi türü', default: 'ihtiyac', segmented: true, options: TUR_OPTS, wide: true },
      money('amount', 'Kredi tutarı', 100000, { min: 1 }),
      count('term', 'Vade', 24, 'ay', { integer: true, min: 1, max: 360 }),
      percent('rate', 'Aylık faiz oranı', 3.49, { min: 0.01, max: 20 }),
    ],
    compute(v) {
      const vergi = turVergi(s(v, 'type'));
      return planSonucu(krediPlani(n(v, 'amount'), n(v, 'rate') / 100, n(v, 'term'), vergi), n(v, 'amount'), vergi);
    },
    info: { how: PLAN_HOW, formula: PLAN_FORMULA, faqs: [VERGI_FAQ.bsmv, { q: 'Hangi kredi türü en düşük maliyetlidir?', a: 'Vergi muafiyeti nedeniyle konut kredileri, aynı faizde en düşük maliyetli kredidir.' }] },
  },

  'ne-kadar-kredi-alabilirim': {
    slug: 'ne-kadar-kredi-alabilirim',
    intro: 'Hane gelirinize, mevcut taksitlerinize ve vadeye göre çekebileceğiniz en yüksek kredi tutarını hesaplayın.',
    fields: [
      { type: 'select', key: 'type', label: 'Kredi türü', default: 'ihtiyac', segmented: true, options: TUR_OPTS.slice(0, 3), wide: true },
      money('income', 'Aylık net geliriniz', 60000),
      money('spouseIncome', 'Eşinizin geliri', 0, { optional: true }),
      money('otherIncome', 'Diğer hane geliri', 0, { optional: true }),
      money('existingInstallment', 'Mevcut kredi taksitleri', 0, { optional: true }),
      count('term', 'Vade', 36, 'ay', { integer: true, min: 1, max: 360 }),
      percent('rate', 'Aylık faiz oranı', 3.49, { min: 0.01, max: 20 }),
      percent('oran', 'Taksit / gelir oranı', 50, { max: 100, help: 'Bankaların çoğu taksitin hane gelirinin yarısını aşmamasını ister.' }),
    ],
    compute(v) {
      const gelir = n(v, 'income') + (n(v, 'spouseIncome') || 0) + (n(v, 'otherIncome') || 0);
      const r = neKadarKredi(gelir, n(v, 'oran') / 100, n(v, 'existingInstallment') || 0, n(v, 'rate') / 100, n(v, 'term'), turVergi(s(v, 'type')));
      if (r.azamiTaksit <= 0) return { headline: { label: 'Çekilebilecek kredi', value: tl(0), sub: 'Mevcut taksitleriniz taksit sınırını dolduruyor', tone: 'down' } };
      return {
        headline: { label: 'Çekebileceğiniz en yüksek kredi', value: tl(r.azamiKredi), sub: `Aylık en fazla ${tl(r.azamiTaksit)} taksit`, tone: 'up' },
        rows: [
          { label: 'Toplam hane geliri', value: tl(gelir) },
          { label: 'Azami aylık taksit', value: tl(r.azamiTaksit) },
          { label: 'Çekilebilecek kredi', value: tl(r.azamiKredi), strong: true },
          { label: 'Toplam geri ödeme', value: tl(r.toplamOdeme) },
        ],
        notes: ['Bankalar kredi notu, gelir belgesi ve mevcut borçluluğa göre farklı limit verebilir; hesap genel bir üst sınır tahminidir.'],
      };
    },
    info: {
      how: ['Önce ödeyebileceğiniz azami taksit bulunur: hane geliri × taksit/gelir oranı − mevcut taksitler. Bu taksitin, vergiler dahil efektif faizle bugünkü değeri çekilebilecek en yüksek kredidir.'],
      formula: ['Azami taksit = gelir × oran − mevcut taksitler', 'Kredi = taksit × (1 − (1 + r)⁻ⁿ) / r, r = faiz × (1 + BSMV + KKDF)'],
      faqs: [
        { q: 'Gelirin yarısı kuralı zorunlu mu?', a: 'Bankaların yaygın uygulamasıdır; bankadan bankaya ve kredi notuna göre değişebilir. Oranı alandan değiştirebilirsiniz.' },
        { q: 'Eşin geliri hesaba katılır mı?', a: 'Eşiniz kefil veya ortak borçlu olursa geliri hane gelirine eklenerek limit artırılabilir.' },
      ],
    },
  },

  'kredi-dosya-masrafi': {
    slug: 'kredi-dosya-masrafi',
    intro: 'Tüketici kredilerinde bankaların alabileceği kredi tahsis ücreti (dosya masrafı), kredi tutarının binde 5’ini geçemez.',
    fields: [money('amount', 'Kredi tutarı', 100000, { min: 1 })],
    compute(v) {
      const m = n(v, 'amount') * KREDI_DOSYA_MASRAFI_ORANI;
      return { headline: { label: 'Azami dosya masrafı', value: tl(m), sub: 'Kredi tutarının binde 5’i', tone: 'primary' }, rows: [{ label: 'Kredi tutarı', value: tl(n(v, 'amount')) }, { label: 'Azami masraf (binde 5)', value: tl(m), strong: true }] };
    },
    info: {
      how: ['Finansal Tüketicilerden Alınacak Ücretlere İlişkin Yönetmelik’e göre tüketici kredilerinde kredi tahsis ücreti kredi tutarının binde 5’ini aşamaz.'],
      faqs: [{ q: 'Dosya masrafı iade alınabilir mi?', a: 'Yasal sınırın üzerinde alınan ücretler için bankaya ve Tüketici Hakem Heyeti’ne başvurulabilir.' }],
    },
  },

  'kredi-erken-kapatma': {
    slug: 'kredi-erken-kapatma',
    intro: 'Konut kredisini erken kapatırken ödenebilecek erken ödeme tazminatını hesaplayın.',
    fields: [
      { type: 'select', key: 'remainingTerm', label: 'Kalan vade', default: 'short', segmented: true, options: [{ value: 'short', label: '36 ay ve altı' }, { value: 'long', label: '36 aydan fazla' }] },
      money('earlyPayment', 'Erken ödenecek tutar', 500000, { min: 1 }),
    ],
    compute(v) {
      const r = erkenKapatmaTazminati(n(v, 'earlyPayment'), s(v, 'remainingTerm') === 'short' ? 36 : 37);
      return {
        headline: { label: 'Erken ödeme tazminatı', value: tl(r.tazminat), sub: `Oran ${pct(r.oran, 0)}`, tone: 'down' },
        rows: [{ label: 'Erken ödenen tutar', value: tl(n(v, 'earlyPayment')) }, { label: 'Tazminat oranı', value: pct(r.oran, 0) }, { label: 'Tazminat', value: tl(r.tazminat), strong: true }],
        notes: ['Tazminat yalnızca sabit faizli konut finansmanı sözleşmelerinde alınabilir. İhtiyaç ve taşıt kredilerinde erken ödeme tazminatı yoktur.'],
      };
    },
    info: {
      how: ['6502 sayılı Tüketicinin Korunması Hakkında Kanun’a göre sabit faizli konut finansmanında erken ödemede, kalan vade 36 ay veya daha kısaysa erken ödenen tutarın %1’i, daha uzunsa %2’si kadar tazminat istenebilir.'],
      faqs: [{ q: 'Erken kapatmada faiz indirimi yapılır mı?', a: 'Evet. Erken ödenen tutara ait henüz işlememiş faiz ve buna bağlı vergiler düşülür.' }],
      sources: [{ label: '6502 sayılı Tüketicinin Korunması Hakkında Kanun', url: 'https://www.mevzuat.gov.tr/mevzuat?MevzuatNo=6502&MevzuatTur=1&MevzuatTertip=5' }],
    },
  },

  'kredi-gecikme-faizi': {
    slug: 'kredi-gecikme-faizi',
    intro: 'Geciken kredi taksiti için işleyecek gecikme faizini ve vergileri hesaplayın. Gecikme faizi akdi faizin %30 fazlasını geçemez.',
    fields: [
      { type: 'select', key: 'type', label: 'Kredi türü', default: 'ihtiyac', segmented: true, options: TUR_OPTS.slice(0, 3) },
      money('taksit', 'Geciken taksit tutarı', 10000, { min: 1 }),
      percent('rate', 'Aylık akdi faiz', 3.49, { min: 0.01, max: 20 }),
      count('delayDays', 'Gecikme süresi', 15, 'gün', { integer: true, min: 1, max: 365 }),
    ],
    compute(v) {
      const r = krediGecikme(n(v, 'taksit'), n(v, 'rate') / 100, n(v, 'delayDays'), turVergi(s(v, 'type')));
      return {
        headline: { label: 'Gecikme faizi ve vergiler', value: tl(r.toplamEk), sub: `Ödenecek toplam ${tl(r.toplam)}`, tone: 'down' },
        rows: [
          { label: 'Aylık gecikme faizi oranı (akdi × 1,30)', value: pct(r.gecikmeOrani) },
          { label: 'Gecikme faizi', value: tl(r.faiz) },
          ...(r.bsmv ? [{ label: 'BSMV', value: tl(r.bsmv) }] : []),
          ...(r.kkdf ? [{ label: 'KKDF', value: tl(r.kkdf) }] : []),
          { label: 'Taksit + gecikme', value: tl(r.toplam), strong: true },
        ],
        notes: ['Sözleşmenizdeki gecikme faizi daha düşük olabilir; yasal üst sınır akdi faizin %30 fazlasıdır. Banka ayrıca ihtar masrafı talep edebilir.'],
      };
    },
    info: {
      how: ['Tüketici kredisinde temerrüt halinde uygulanacak gecikme faizi oranı, sözleşmedeki akdi faiz oranının %30 fazlasını geçemez. Faiz, geciken taksit tutarı üzerinden gün esasıyla işler; bireysel kredilerde üzerine BSMV ve KKDF eklenir.'],
      formula: ['Gecikme faizi = taksit × (akdi × 1,30) / 30 × gün', 'Vergiler = gecikme faizi × (BSMV + KKDF)'],
      faqs: [{ q: 'Gecikme kredi notunu etkiler mi?', a: 'Evet. Taksitin gecikmesi Kredi Kayıt Bürosu’na bildirilir ve kredi notunuzu düşürür.' }],
    },
  },

  'kredi-yapilandirma': {
    slug: 'kredi-yapilandirma',
    intro: 'Mevcut kredinizi kapatıp daha düşük faizli yeni bir krediye geçmenin (refinansman) size ne kazandıracağını hesaplayın.',
    fields: [
      { type: 'select', key: 'type', label: 'Kredi türü', default: 'ihtiyac', segmented: true, options: TUR_OPTS.slice(0, 3), wide: true },
      money('amount', 'Mevcut kredinin çekilen tutarı', 300000, { min: 1 }),
      count('term', 'Mevcut vade', 36, 'ay', { integer: true, min: 1, max: 360 }),
      percent('rate', 'Mevcut aylık faiz', 4.29, { min: 0.01, max: 20 }),
      count('paidMonths', 'Ödenen taksit sayısı', 12, 'taksit', { integer: true }),
      percent('earlyPenalty', 'Erken kapama ücreti', 0, { optional: true, max: 10, help: 'Konut kredisinde %1–2; diğer tüketici kredilerinde 0.' }),
      money('newCost', 'Yeni kredi masrafları', 0, { optional: true }),
      count('newTerm', 'Yeni vade', 24, 'ay', { integer: true, min: 1, max: 360 }),
      percent('newRate', 'Yeni aylık faiz', 3.19, { min: 0.01, max: 20 }),
    ],
    compute(v) {
      if (n(v, 'paidMonths') >= n(v, 'term')) return { error: 'Ödenen taksit sayısı vadeden küçük olmalı.' };
      const r = krediYapilandirma(n(v, 'amount'), n(v, 'rate') / 100, n(v, 'term'), n(v, 'paidMonths'), turVergi(s(v, 'type')), (n(v, 'earlyPenalty') || 0) / 100, n(v, 'newCost') || 0, n(v, 'newRate') / 100, n(v, 'newTerm'));
      if (!r) return null;
      const kazanc = r.fark >= 0;
      return {
        headline: { label: kazanc ? 'Toplamda tasarruf' : 'Toplamda ek maliyet', value: tl(Math.abs(r.fark)), sub: `Yeni taksit ${tl(r.yeniTaksit)} (eski ${tl(r.eskiTaksit)})`, tone: kazanc ? 'up' : 'down' },
        sections: [
          { title: 'Mevcut kredi', rows: [{ label: 'Kalan anapara', value: tl(r.kalanAnapara) }, { label: 'Aylık taksit', value: tl(r.eskiTaksit) }, { label: `Kalan ${n(v, 'term') - n(v, 'paidMonths')} taksit toplamı`, value: tl(r.eskiKalanOdeme), strong: true }] },
          { title: 'Yeni kredi', rows: [{ label: 'Erken kapama ücreti', value: tl(r.ceza) }, { label: 'Yeni kredi tutarı', value: tl(r.yeniTutar) }, { label: 'Aylık taksit', value: tl(r.yeniTaksit) }, { label: 'Toplam geri ödeme', value: tl(r.yeniToplam), strong: true }] },
        ],
        notes: ['Karşılaştırma nominal ödemeler üzerindendir; vadeler farklıysa aylık bütçenizi de dikkate alın.'],
      };
    },
    info: {
      how: ['Mevcut kredinin ödenen taksitlerden sonraki kalan anaparası bulunur. Yeni kredi tutarı = kalan anapara + erken kapama ücreti + masraflar. Yeni kredinin toplam geri ödemesi, eski kredinin kalan taksit toplamıyla karşılaştırılır.'],
      faqs: [{ q: 'Refinansman ne zaman mantıklıdır?', a: 'Yeni faiz belirgin şekilde düşükse ve erken kapama ücreti ile masraflar faiz tasarrufundan azsa.' }],
    },
  },

  'kredi-yillik-maliyet-orani': {
    slug: 'kredi-yillik-maliyet-orani',
    intro: 'Kredinin faiz, vergi ve masraflar dahil gerçek yıllık maliyetini (YMO) hesaplayın.',
    fields: [
      { type: 'select', key: 'type', label: 'Kredi türü', default: 'ihtiyac', segmented: true, options: TUR_OPTS, wide: true },
      money('amount', 'Kredi tutarı', 100000, { min: 1 }),
      count('term', 'Vade', 24, 'ay', { integer: true, min: 1, max: 360 }),
      percent('rate', 'Aylık faiz oranı', 3.49, { min: 0.01, max: 20 }),
      money('totalCost', 'Masraflar (dosya, sigorta vb.)', 500, { optional: true }),
    ],
    compute(v) {
      const r = yillikMaliyetOrani(n(v, 'amount'), n(v, 'rate') / 100, n(v, 'term'), turVergi(s(v, 'type')), n(v, 'totalCost') || 0);
      if (!r) return { error: 'Masraflar kredi tutarından küçük olmalı.' };
      return {
        headline: { label: 'Yıllık maliyet oranı (YMO)', value: pct(r.yillik), sub: `Aylık ${pct(r.aylik)}`, tone: 'primary' },
        rows: [
          { label: 'Aylık taksit (vergiler dahil)', value: tl(r.taksit) },
          { label: 'Eline geçen net tutar', value: tl(r.netKullanilan) },
          { label: 'Toplam geri ödeme', value: tl(r.toplamOdeme) },
          { label: 'Toplam maliyet (faiz + vergi + masraf)', value: tl(r.toplamMaliyet) },
          { label: 'Aylık maliyet oranı', value: pct(r.aylik) },
          { label: 'Yıllık maliyet oranı', value: pct(r.yillik), strong: true },
        ],
      };
    },
    info: {
      how: ['Yıllık maliyet oranı, krediden eline geçen net tutarı (kredi − masraflar) vergiler dahil taksitlere eşitleyen aylık oranın yıllık bileşiğidir. Farklı bankaların tekliflerini karşılaştırmanın en doğru yoludur.'],
      formula: ['Net tutar = Σ taksit / (1 + i)ᵗ → i bulunur', 'YMO = (1 + i)¹² − 1'],
      faqs: [{ q: 'YMO ile faiz oranı neden farklı?', a: 'Faiz oranı yalnızca borçlanma bedelini, YMO ise vergi ve tüm masrafları birlikte gösterir.' }],
    },
  },

  // ── Kredi kartı ──
  'kredi-karti-asgari-odeme': {
    slug: 'kredi-karti-asgari-odeme',
    intro: 'Kart limitinize ve dönem borcunuza göre ödemeniz gereken asgari tutarı hesaplayın.',
    fields: [money('debt', 'Dönem borcu', 15000, { min: 1 }), money('limit', 'Kart limiti', 40000, { min: 1 })],
    compute(v) {
      const oran = asgariOdemeOrani(n(v, 'limit'));
      const asgari = n(v, 'debt') * oran;
      const faiz = kartAzamiFaiz(n(v, 'debt'));
      return {
        headline: { label: 'Asgari ödeme tutarı', value: tl(asgari), sub: `Dönem borcunun %${oran * 100}’i`, tone: 'primary' },
        rows: [
          { label: 'Dönem borcu', value: tl(n(v, 'debt')) },
          { label: 'Asgari ödeme oranı', value: `%${oran * 100}` },
          { label: 'Asgari ödeme', value: tl(asgari), strong: true },
          { label: 'Asgari ödenirse kalan borç', value: tl(n(v, 'debt') - asgari) },
          { label: `Kalan borca bir aylık akdi faiz + vergi (≈ %${(faiz.akdi * 100).toFixed(2).replace('.', ',')})`, value: tl((n(v, 'debt') - asgari) * faiz.akdi * 1.3) },
        ],
        notes: [`Akdi faiz tahmini TCMB azami oranlarıyla (${KART_AZAMI_FAIZ.donem}) yapılmıştır.`],
      };
    },
    info: {
      how: ['BDDK düzenlemesine göre kart limiti 50.000 TL ve altındaysa asgari ödeme dönem borcunun %20’si, 50.000 TL’nin üzerindeyse %40’ıdır.', 'Asgari tutar ödenirse gecikme faizi işlemez; ancak ödenmeyen kısma akdi faiz ve vergiler uygulanır.'],
      faqs: [
        { q: 'Asgari ödeme yapmazsam ne olur?', a: 'Ödenmeyen asgari tutara gecikme faizi, kalan kısma akdi faiz işler. Üst üste asgari ödeme yapılmazsa kart kullanıma kapatılabilir.' },
        { q: 'Asgari ödeme oranı neden %40?', a: 'Limiti 50.000 TL’yi aşan kartlarda BDDK asgari ödeme oranını %40 olarak belirlemiştir.' },
      ],
      sources: [{ label: 'BDDK Kurul Kararı 10970 (27.09.2024)', url: 'https://www.bddk.org.tr/Mevzuat/DokumanGetir/1255' }],
    },
  },

  'kredi-karti-gecikme-faizi': {
    slug: 'kredi-karti-gecikme-faizi',
    intro: 'Kredi kartı borcunu eksik ödediğinizde işleyecek gecikme ve akdi faizi, vergilerle birlikte hesaplayın.',
    fields: [
      money('debt', 'Dönem borcu', 20000, { min: 1 }),
      money('limit', 'Kart limiti', 40000, { min: 1 }),
      money('payment', 'Yaptığınız ödeme', 1000, { optional: true }),
      count('delayDays', 'Gün sayısı (sonraki hesap kesimine)', 30, 'gün', { integer: true, min: 1, max: 45 }),
      percent('contractRate', 'Aylık akdi faiz', null, { optional: true, max: 20, placeholder: 'Boşsa TCMB azami oranı' }),
      percent('delayRate', 'Aylık gecikme faizi', null, { optional: true, max: 20, placeholder: 'Boşsa TCMB azami oranı' }),
    ],
    compute(v) {
      const azami = kartAzamiFaiz(n(v, 'debt'));
      const akdi = Number.isFinite(n(v, 'contractRate')) ? n(v, 'contractRate') / 100 : azami.akdi;
      const gec = Number.isFinite(n(v, 'delayRate')) ? n(v, 'delayRate') / 100 : azami.gecikme;
      const r = kartGecikme(n(v, 'debt'), n(v, 'limit'), n(v, 'payment') || 0, akdi, gec, n(v, 'delayDays'));
      return {
        headline: { label: 'Faiz ve vergiler', value: tl(r.toplamFaiz), sub: `Sonraki ekstreye yansıyan borç ${tl(r.sonrakiBorc)}`, tone: 'down' },
        rows: [
          { label: 'Asgari ödeme tutarı', value: tl(r.asgari) },
          { label: 'Ödenmeyen asgari (gecikme faizine tabi)', value: tl(r.odenmeyenAsgari) },
          { label: 'Kalan borç (akdi faize tabi)', value: tl(r.akdiyeTabi) },
          { label: `Gecikme faizi (aylık ${pct(gec)})`, value: tl(r.gecikmeFaizi) },
          { label: `Akdi faiz (aylık ${pct(akdi)})`, value: tl(r.akdiFaiz) },
          { label: 'BSMV + KKDF (%30)', value: tl(r.vergi) },
          { label: 'Toplam faiz ve vergi', value: tl(r.toplamFaiz), strong: true },
        ],
        notes: [`Oran girilmezse dönem borcuna göre TCMB azami oranları (${KART_AZAMI_FAIZ.donem}) kullanılır.`],
      };
    },
    info: {
      how: ['Banka Kartları ve Kredi Kartları Kanunu’na göre asgari tutar ödenmezse ödenmeyen asgari kısma gecikme faizi, dönem borcunun geri kalan ödenmeyen kısmına akdi faiz uygulanır. Faizler gün esasıyla hesaplanır; üzerine %15 BSMV ve %15 KKDF eklenir.', 'Azami akdi ve gecikme faiz oranlarını TCMB her ay belirler; dönem borcu arttıkça oran yükselir.'],
      formula: ['Gecikme faizi = ödenmeyen asgari × gecikme oranı / 30 × gün', 'Akdi faiz = kalan diğer borç × akdi oran / 30 × gün', 'Vergi = faizler × %30'],
      faqs: [{ q: 'Eylül 2026 kredi kartı faiz oranları nedir?', a: 'Dönem borcu 30 bin TL’nin altında akdi %3,25 / gecikme %3,55; 30–180 bin TL arası %3,75 / %4,05; 180 bin TL üzeri %4,25 / %4,55 (aylık, azami).' }],
      sources: [{ label: 'TCMB — Kredi kartı azami faiz oranları', url: 'https://www.tcmb.gov.tr/wps/wcm/connect/TR/TCMB+TR/Main+Menu/Istatistikler/Bankacilik+Verileri/Kredi_Karti_Islemlerinde_Uygulanacak_Azami_Faiz_Oranlari' }],
    },
  },

  'kredi-karti-ek-taksit': {
    slug: 'kredi-karti-ek-taksit',
    intro: 'Taksitli kart harcamanıza ek taksit eklediğinizde aylık ödemenin ve toplam maliyetin nasıl değişeceğini görün.',
    fields: [
      money('amount', 'Kalan taksitli tutar', 12000, { min: 1 }),
      count('currentTerm', 'Mevcut kalan taksit', 3, 'taksit', { integer: true, min: 1, max: 36 }),
      count('newTerm', 'Yeni taksit sayısı', 9, 'taksit', { integer: true, min: 2, max: 36 }),
      percent('rate', 'Aylık faiz oranı', 3.75, { min: 0.01, max: 20 }),
    ],
    compute(v) {
      const eski = n(v, 'amount') / n(v, 'currentTerm');
      const r = kartTaksit(n(v, 'amount'), n(v, 'rate') / 100, n(v, 'newTerm'));
      return {
        headline: { label: 'Yeni aylık taksit', value: tl(r.taksit), sub: `Önceki ${tl(eski)} · ek maliyet ${tl(r.toplam - n(v, 'amount'))}`, tone: 'primary' },
        rows: [
          { label: 'Mevcut aylık taksit (faizsiz)', value: tl(eski) },
          { label: 'Yeni aylık taksit', value: tl(r.taksit), strong: true },
          { label: 'Faiz', value: tl(r.faiz) },
          { label: 'BSMV + KKDF', value: tl(r.bsmv + r.kkdf) },
          { label: 'Toplam ödeme', value: tl(r.toplam), strong: true },
        ],
      };
    },
    info: {
      how: ['Ek taksitte kalan tutar, bankanın aylık faizi ve %15 BSMV + %15 KKDF ile yeni taksit sayısına eşit taksitlerle bölünür. Aylık ödeme düşer, toplam ödeme artar.'],
      formula: ['Taksit = T × r × (1 + r)ⁿ / ((1 + r)ⁿ − 1), r = faiz × 1,30'],
      faqs: [{ q: 'Ek taksit her harcamada yapılabilir mi?', a: 'Bankanın izin verdiği ve taksit sınırlamasına takılmayan (ör. akaryakıt, kuyum hariç) işlemlerde yapılabilir.' }],
    },
  },

  'kredi-karti-islem-taksitlendirme': {
    slug: 'kredi-karti-islem-taksitlendirme',
    intro: 'Peşin yaptığınız bir kart harcamasını sonradan taksitlendirmenin aylık ve toplam maliyetini hesaplayın.',
    fields: [
      money('amount', 'İşlem tutarı', 10000, { min: 1 }),
      count('term', 'Taksit sayısı', 6, 'taksit', { integer: true, min: 2, max: 12 }),
      percent('rate', 'Aylık faiz oranı', 3.75, { min: 0.01, max: 20 }),
    ],
    compute(v) {
      const r = kartTaksit(n(v, 'amount'), n(v, 'rate') / 100, n(v, 'term'));
      return {
        headline: { label: 'Aylık taksit', value: tl(r.taksit), sub: `Toplam ${tl(r.toplam)}`, tone: 'primary' },
        rows: [{ label: 'Faiz', value: tl(r.faiz) }, { label: 'BSMV (%15)', value: tl(r.bsmv) }, { label: 'KKDF (%15)', value: tl(r.kkdf) }, { label: 'Toplam ödeme', value: tl(r.toplam), strong: true }, { label: 'Ek maliyet', value: tl(r.toplam - n(v, 'amount')) }],
      };
    },
    info: {
      how: ['Sonradan taksitlendirmede işlem tutarı, bankanın aylık faizi ve faiz üzerinden %15 BSMV ile %15 KKDF eklenerek eşit taksitlere bölünür.'],
      formula: ['Taksit = T × r × (1 + r)ⁿ / ((1 + r)ⁿ − 1), r = faiz × 1,30'],
      faqs: [{ q: 'Kaç taksit yapılabilir?', a: 'BDDK’nın sektörlere göre belirlediği azami taksit sayıları geçerlidir; birçok işlemde en fazla 12 taksittir.' }],
    },
  },

  'kredi-karti-taksitli-nakit-avans': {
    slug: 'kredi-karti-taksitli-nakit-avans',
    intro: 'Kartınızdan taksitli nakit avans çektiğinizde aylık taksiti ve toplam maliyeti hesaplayın.',
    fields: [
      money('amount', 'Avans tutarı', 20000, { min: 1 }),
      count('term', 'Taksit sayısı', 6, 'taksit', { integer: true, min: 2, max: 12 }),
      percent('rate', 'Aylık faiz oranı', KART_AZAMI_FAIZ.nakitAvans.akdi * 100, { min: 0.01, max: 20, help: `TCMB azami nakit avans faizi (${KART_AZAMI_FAIZ.donem}): %${String(KART_AZAMI_FAIZ.nakitAvans.akdi * 100).replace('.', ',')}` }),
    ],
    compute(v) {
      const r = kartTaksit(n(v, 'amount'), n(v, 'rate') / 100, n(v, 'term'));
      return {
        headline: { label: 'Aylık taksit', value: tl(r.taksit), sub: `Toplam geri ödeme ${tl(r.toplam)}`, tone: 'primary' },
        rows: [{ label: 'Faiz', value: tl(r.faiz) }, { label: 'BSMV (%15)', value: tl(r.bsmv) }, { label: 'KKDF (%15)', value: tl(r.kkdf) }, { label: 'Toplam geri ödeme', value: tl(r.toplam), strong: true }, { label: 'Toplam maliyet', value: tl(r.toplam - n(v, 'amount')) }],
        notes: ['Bazı bankalar nakit avans için ayrıca işlem ücreti alabilir.'],
      };
    },
    info: {
      how: ['Nakit avansa çekildiği günden itibaren faiz işler. Taksitli nakit avansta tutar, aylık faiz ile faiz üzerinden %15 BSMV ve %15 KKDF eklenerek eşit taksitlere bölünür.'],
      formula: ['Taksit = T × r × (1 + r)ⁿ / ((1 + r)ⁿ − 1), r = faiz × 1,30'],
      faqs: [{ q: 'Nakit avans faizi neden yüksek?', a: 'TCMB nakit çekim işlemleri için ayrı ve daha yüksek bir azami faiz belirler; ayrıca faiz ilk günden işler.' }],
    },
  },
};

