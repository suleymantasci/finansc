// Kredi, kredi kartı ve faiz araçları.

import type { ToolSpec } from '../types';
import { tl, pct, yilAy } from '../format';
import { count, money, n, percent, s } from './_shared';
import { gunlukFaiz, kartBorcKapatma, krediOzet, oranDonustur, taksittenFaizOrani, type OranTuru, type VergiTipi } from '@/lib/calculators/faiz';

const VERGI_OPTS = [
  { value: 'bireysel', label: 'Bireysel (BSMV %15 + KKDF %15)' },
  { value: 'konut', label: 'Konut kredisi (vergisiz)' },
  { value: 'yok', label: 'Vergi eklemeden' },
];

export const specs: Record<string, ToolSpec> = {
  'kredi-faiz-orani-hesaplama': {
    slug: 'kredi-faiz-orani-hesaplama',
    intro: 'Bankanın size sunduğu kredi tutarını, aylık taksiti ve vadeyi girin; kredinin gerçek aylık faiz oranı ve yıllık maliyeti hesaplansın.',
    fields: [
      money('tutar', 'Kredi tutarı', 100000),
      money('taksit', 'Aylık taksit', 10500),
      count('vade', 'Vade', 12, 'ay', { integer: true, min: 1, max: 360 }),
      { type: 'select', key: 'tip', label: 'Kredi türü', default: 'bireysel', options: VERGI_OPTS },
    ],
    compute(v) {
      const r = taksittenFaizOrani(n(v, 'tutar'), n(v, 'taksit'), n(v, 'vade'), s(v, 'tip') as VergiTipi);
      if (!r) return { error: 'Toplam geri ödeme (taksit × vade) kredi tutarından büyük olmalı.' };
      return {
        headline: { label: 'Aylık akdi faiz oranı', value: pct(r.aylikAkdi), sub: `Vergiler dahil aylık ${pct(r.aylikEfektif)} · yıllık efektif ${pct(r.yillikEfektif)}`, tone: 'primary' },
        rows: [
          { label: 'Aylık akdi faiz (bankanın ilan ettiği)', value: pct(r.aylikAkdi), strong: true },
          { label: 'Aylık efektif (vergiler dahil)', value: pct(r.aylikEfektif) },
          { label: 'Yıllık akdi faiz (aylık × 12)', value: pct(r.yillikAkdi) },
          { label: 'Yıllık efektif maliyet (bileşik)', value: pct(r.yillikEfektif) },
          { label: 'Toplam geri ödeme', value: tl(r.toplamOdeme) },
          { label: 'Toplam faiz ve vergi', value: tl(r.toplamFaiz) },
        ],
        notes: ['Dosya masrafı ve sigorta gibi ek ödemeler dahil değildir; bunlar yıllık maliyet oranını artırır.'],
      };
    },
    info: {
      how: [
        'Eşit taksitli kredide taksit, kredi tutarı ile aylık oran ve vadeye bağlıdır: taksit = P·r·(1+r)ⁿ / ((1+r)ⁿ − 1). Bu araç denklemi tersine çözerek taksitten oranı bulur.',
        'Bireysel ihtiyaç ve taşıt kredilerinde faizin üzerine %15 BSMV ve %15 KKDF eklenir; bulunan oran 1,30’a bölünerek bankanın ilan ettiği akdi faize ulaşılır. Konut kredileri bu vergilerden muaftır.',
      ],
      formula: ['Taksit = P × r × (1 + r)ⁿ / ((1 + r)ⁿ − 1) → r sayısal olarak çözülür', 'Akdi faiz = r / 1,30 (bireysel)', 'Yıllık efektif = (1 + r)¹² − 1'],
      faqs: [
        { q: 'Kredinin gerçek faizini nasıl anlarım?', a: 'Tutar, taksit ve vadeyi bu araca girin. Bulunan akdi oran bankanın söylediğinden yüksekse krediye masraf ya da farklı vergi eklenmiş olabilir.' },
        { q: 'Yıllık faiz aylık faizin 12 katı mı?', a: 'Akdi yıllık oran genellikle aylık × 12 olarak ifade edilir. Bileşik (efektif) yıllık maliyet ise (1 + aylık)¹² − 1 ile bulunur ve daha yüksektir.' },
      ],
    },
  },

  'kredi-karsilastirma': {
    slug: 'kredi-karsilastirma',
    intro: 'İki kredi teklifini aynı tabloda karşılaştırın: aylık taksit, toplam geri ödeme ve masraflar dahil toplam maliyet.',
    fields: [
      money('tutar', 'Kredi tutarı', 200000, { wide: true }),
      { type: 'select', key: 'tip', label: 'Kredi türü', default: 'bireysel', options: VERGI_OPTS, wide: true },
      percent('f1', 'A — aylık faiz', 3.29, { max: 20 }),
      count('v1', 'A — vade', 24, 'ay', { integer: true, min: 1, max: 360 }),
      money('m1', 'A — masraf', 0, { optional: true }),
      percent('f2', 'B — aylık faiz', 3.09, { max: 20 }),
      count('v2', 'B — vade', 36, 'ay', { integer: true, min: 1, max: 360 }),
      money('m2', 'B — masraf', 0, { optional: true }),
    ],
    compute(v) {
      const tip = s(v, 'tip') as VergiTipi;
      const a = krediOzet(n(v, 'tutar'), n(v, 'f1') / 100, n(v, 'v1'), tip, n(v, 'm1') || 0);
      const c = krediOzet(n(v, 'tutar'), n(v, 'f2') / 100, n(v, 'v2'), tip, n(v, 'm2') || 0);
      const ucuz = a.toplamMaliyet <= c.toplamMaliyet ? 'A' : 'B';
      return {
        headline: { label: 'Toplam maliyeti düşük olan', value: `Kredi ${ucuz}`, sub: `Fark ${tl(Math.abs(a.toplamMaliyet - c.toplamMaliyet))}`, tone: 'up' },
        table: {
          columns: ['', 'Kredi A', 'Kredi B'],
          rows: [
            ['Aylık faiz', pct(n(v, 'f1') / 100), pct(n(v, 'f2') / 100)],
            ['Vade', `${n(v, 'v1')} ay`, `${n(v, 'v2')} ay`],
            ['Aylık taksit', tl(a.taksit), tl(c.taksit)],
            ['Toplam geri ödeme', tl(a.toplamOdeme), tl(c.toplamOdeme)],
            ['Faiz + vergi', tl(a.toplamFaiz), tl(c.toplamFaiz)],
            ['Masraf', tl(a.masraf), tl(c.masraf)],
            ['Toplam maliyet', tl(a.toplamMaliyet), tl(c.toplamMaliyet)],
          ],
        },
        notes: ['Vadeler farklıysa düşük toplam maliyet, düşük aylık taksit anlamına gelmez; bütçenize uyan taksiti de değerlendirin.'],
      };
    },
    info: {
      how: [
        'Her kredi için aylık taksit, akdi faize (bireysel kredilerde BSMV ve KKDF eklenerek) göre eşit taksit formülüyle hesaplanır. Toplam maliyet = toplam geri ödeme − kredi tutarı + masraflar.',
      ],
      formula: ['Taksit = P × r × (1 + r)ⁿ / ((1 + r)ⁿ − 1), r = aylık faiz × 1,30 (bireysel)'],
      faqs: [
        { q: 'Uzun vade mi kısa vade mi daha avantajlı?', a: 'Uzun vade aylık taksiti düşürür ama toplam faizi artırır. Enflasyonun faizden yüksek olduğu dönemlerde uzun vade reel olarak ucuzlayabilir.' },
      ],
    },
  },

  'kredi-karti-borc-kapatma': {
    slug: 'kredi-karti-borc-kapatma',
    intro: 'Kredi kartı borcunuzu, aylık akdi faizi ve her ay ödeyebileceğiniz tutarı girin; borcun kaç ayda biteceğini ve toplam faiz maliyetini görün.',
    fields: [
      money('borc', 'Kart borcu', 50000),
      percent('faiz', 'Aylık akdi faiz', 3.25, { max: 20, help: 'Kart ekstrenizde yazan aylık akdi faiz oranı.' }),
      money('odeme', 'Her ay ödeyeceğiniz tutar', 5000),
    ],
    compute(v) {
      const r = kartBorcKapatma(n(v, 'borc'), n(v, 'faiz') / 100, n(v, 'odeme'));
      if (!r.biterMi || r.ay == null) {
        return {
          headline: { label: 'Borç bitmiyor', value: '—', sub: 'Aylık ödeme, faiz ve vergileri karşılamıyor', tone: 'down' },
          warnings: [`Bu borçta ilk ayın faizi ve vergisi ${tl(n(v, 'borc') * n(v, 'faiz') / 100 * 1.3)}. Borcun azalması için bundan fazla ödemelisiniz.`],
        };
      }
      return {
        headline: { label: 'Borcun bitme süresi', value: `${r.ay} ay`, sub: `${yilAy(r.ay / 12)} · toplam faiz + vergi ${tl(r.toplamFaiz + r.toplamVergi)}`, tone: 'primary' },
        rows: [
          { label: 'Toplam ödeme', value: tl(r.toplamOdeme), strong: true },
          { label: 'Toplam faiz', value: tl(r.toplamFaiz), tone: 'down' },
          { label: 'BSMV + KKDF', value: tl(r.toplamVergi), tone: 'down' },
          { label: 'Son ay ödemesi', value: tl(r.satirlar[r.satirlar.length - 1].odeme) },
        ],
        table: {
          caption: 'İlk 12 ay',
          columns: ['Ay', 'Faiz', 'Vergi', 'Ödeme', 'Kalan'],
          rows: r.satirlar.slice(0, 12).map((x) => [String(x.ay), tl(x.faiz), tl(x.vergi), tl(x.odeme), tl(x.kalan)]),
        },
        notes: ['Borç kapanana kadar karta yeni harcama yapılmadığı varsayılır. Asgari ödemenin altında kalınırsa gecikme faizi uygulanır.'],
      };
    },
    info: {
      how: [
        'Her ay kalan borca aylık akdi faiz işler ve faiz tutarı üzerinden %15 BSMV ile %15 KKDF eklenir. Ardından yaptığınız ödeme borçtan düşülür. Bu döngü borç sıfırlanana kadar sürer.',
        'Kredi kartı azami faiz oranları TCMB tarafından aylık olarak belirlenir; ekstrenizdeki güncel oranı kullanın.',
      ],
      formula: ['Yeni borç = kalan × (1 + faiz × 1,30) − ödeme'],
      faqs: [
        { q: 'Sadece asgari ödeme yaparsam ne olur?', a: 'Kalan borca akdi faiz ve vergiler işlemeye devam eder; borç çok uzun sürede kapanır ve toplam maliyet ciddi biçimde artar.' },
        { q: 'Kart borcunu taksitlendirmek mantıklı mı?', a: 'Taksitlendirme faizi genellikle akdi faizle benzerdir; asıl fayda sabit bir ödeme planı olmasıdır. Kredi Kartı Ek Taksit aracıyla karşılaştırabilirsiniz.' },
      ],
    },
  },

  'gunluk-faiz-hesaplama': {
    slug: 'gunluk-faiz-hesaplama',
    intro: 'Paranızın mevduatta kaç gün kalacağını, yıllık faiz oranını ve stopajı girin; brüt ve net getiriniz ile günlük kazancınız hesaplansın.',
    fields: [
      money('anapara', 'Anapara', 1000000),
      percent('oran', 'Yıllık faiz oranı (brüt)', 42, { max: 200 }),
      count('gun', 'Vade', 32, 'gün', { integer: true, min: 1 }),
      { type: 'select', key: 'stopaj', label: 'Stopaj', default: '17.5', options: [
        { value: '17.5', label: '%17,5 (6 aya kadar vade)' }, { value: '15', label: '%15 (1 yıla kadar)' }, { value: '10', label: '%10 (1 yıldan uzun)' }, { value: '0', label: 'Stopajsız (brüt)' },
      ] },
    ],
    compute(v) {
      const r = gunlukFaiz(n(v, 'anapara'), n(v, 'oran') / 100, n(v, 'gun'), Number(s(v, 'stopaj')) / 100);
      return {
        headline: { label: `${n(v, 'gun')} günlük net getiri`, value: tl(r.net), sub: `Günlük ${tl(r.gunlukNet)} · vade sonu ${tl(r.toplam)}`, tone: 'up' },
        rows: [
          { label: 'Brüt faiz', value: tl(r.brut) },
          { label: `Stopaj (%${s(v, 'stopaj').replace('.', ',')})`, value: `− ${tl(r.stopaj)}`, tone: 'down' },
          { label: 'Net faiz', value: tl(r.net), strong: true },
          { label: 'Günlük net kazanç', value: tl(r.gunlukNet) },
          { label: 'Aylık (30 gün) net karşılığı', value: tl(r.gunlukNet * 30) },
          { label: 'Vade sonu toplam', value: tl(r.toplam), strong: true },
        ],
      };
    },
    info: {
      how: [
        'Mevduat faizi basit faiz ve 365 gün esasıyla hesaplanır: anapara × yıllık oran × gün / 365. Bulunan brüt faizden vadeye göre stopaj kesilir.',
        'TL mevduatta 31.12.2026’ya kadar vadesiz ve 6 aya kadar vadelerde %17,5, 1 yıla kadar %15, 1 yıldan uzun vadelerde %10 stopaj uygulanır.',
      ],
      formula: ['Brüt faiz = anapara × oran × gün / 365', 'Net faiz = brüt − brüt × stopaj oranı'],
      faqs: [
        { q: '1 milyon TL’nin günlük faizi ne kadar?', a: 'Yıllık %42 brüt faizde günlük brüt getiri 1.000.000 × 0,42 / 365 ≈ 1.150,68 TL; %17,5 stopaj sonrası yaklaşık 949,32 TL’dir.' },
        { q: 'Bankalar faizi 360 gün mü 365 gün mü hesaplar?', a: 'TL mevduatta Türkiye’de 365 gün esası kullanılır.' },
      ],
    },
  },

  'faiz-orani-donusturme': {
    slug: 'faiz-orani-donusturme',
    intro: 'Aylık faizi yıllığa, yıllık faizi aylığa çevirin; basit ve bileşik (efektif) karşılıklarını birlikte görün.',
    fields: [
      percent('oran', 'Faiz oranı', 3, { max: 1000 }),
      { type: 'select', key: 'tur', label: 'Girdiğiniz oran', default: 'aylik', options: [
        { value: 'aylik', label: 'Aylık' }, { value: 'yillikBasit', label: 'Yıllık (basit / nominal)' }, { value: 'yillikBilesik', label: 'Yıllık (bileşik / efektif)' },
      ] },
    ],
    compute(v) {
      const r = oranDonustur(n(v, 'oran') / 100, s(v, 'tur') as OranTuru);
      return {
        headline: s(v, 'tur') === 'aylik'
          ? { label: 'Yıllık bileşik (efektif) faiz', value: pct(r.yillikBilesik), sub: `Yıllık basit ${pct(r.yillikBasit)}`, tone: 'primary' }
          : { label: 'Aylık faiz', value: pct(r.aylik, 4), sub: `Yıllık bileşik ${pct(r.yillikBilesik)}`, tone: 'primary' },
        rows: [
          { label: 'Aylık', value: pct(r.aylik, 4) },
          { label: 'Yıllık basit (aylık × 12)', value: pct(r.yillikBasit) },
          { label: 'Yıllık bileşik ((1 + aylık)¹² − 1)', value: pct(r.yillikBilesik), strong: true },
          { label: 'Günlük (basit, 365 gün)', value: pct(r.gunluk, 4) },
        ],
      };
    },
    info: {
      how: [
        'Basit (nominal) yıllık oran, aylık oranın 12 katıdır. Bileşik (efektif) yıllık oran ise her ay kazanılan faizin yeniden faiz kazandığı varsayımıyla (1 + aylık)¹² − 1 formülüyle bulunur.',
        'Yıllık bileşik orandan aylık orana geçmek için (1 + yıllık)^(1/12) − 1 kullanılır.',
      ],
      formula: ['Yıllık basit = aylık × 12', 'Yıllık bileşik = (1 + aylık)¹² − 1', 'Aylık = (1 + yıllık bileşik)^(1/12) − 1'],
      faqs: [
        { q: 'Aylık %3 faiz yıllık kaç eder?', a: 'Basit olarak %36, bileşik (efektif) olarak %42,58 eder.' },
        { q: 'Kredi kartı faizleri hangi yöntemle ifade edilir?', a: 'Kart ve kredi faizleri genellikle aylık akdi oran olarak ilan edilir; yıllık maliyeti görmek için bileşik karşılığa bakmak gerekir.' },
      ],
    },
  },
};

