// Borsa, altın, döviz ve emlak araçları.

import type { ToolSpec } from '../types';
import { tl, pct, pctv, num, int, yilAy } from '../format';
import { SRC, b, money, n, percent, s } from './_shared';
import {
  altinAyar, basitKarZarar, carpanlar, hisseKarZarar, ikiyeKatlanma, ortalamaMaliyet, pozisyonBuyuklugu,
} from '@/lib/calculators/yatirim';
import { temettu } from '@/lib/calculators/vergi';
import { emlakVergisi, emlakciKomisyonu, evAmortisman, tapuHarci, type EmlakTuru } from '@/lib/calculators/emlak';
import { ALTIN_MILYEM, TAPU_DONER_SERMAYE_2026 } from '@/lib/calculators/params';

function karZararSpec(slug: string, birim: string, miktarLabel: string, alisDef: number, satisDef: number, miktarDef: number, intro: string, info: ToolSpec['info']): ToolSpec {
  return {
    slug,
    intro,
    fields: [
      money('alis', `Alış fiyatı (${birim} başına)`, alisDef),
      money('satis', `Satış / güncel fiyat (${birim} başına)`, satisDef),
      { type: 'number', key: 'miktar', label: miktarLabel, default: miktarDef, unit: birim, min: 0 },
    ],
    compute(v) {
      const r = basitKarZarar(n(v, 'alis'), n(v, 'satis'), n(v, 'miktar'));
      const kar = r.karZarar >= 0;
      return {
        headline: { label: kar ? 'Kâr' : 'Zarar', value: tl(r.karZarar), sub: `Getiri ${pctv(r.getiri)}`, tone: kar ? 'up' : 'down' },
        rows: [
          { label: 'Alış tutarı', value: tl(r.alisTutari) },
          { label: 'Satış / güncel değer', value: tl(r.satisTutari) },
          { label: kar ? 'Kâr' : 'Zarar', value: tl(r.karZarar), tone: kar ? 'up' : 'down', strong: true },
          { label: 'Yüzde getiri', value: pctv(r.getiri), tone: kar ? 'up' : 'down' },
        ],
        notes: ['Alış ve satış için kuyumcu/banka makasını (alış-satış farkını) hesaba katmak için gerçek işlem fiyatlarını girin.'],
      };
    },
    info,
  };
}

export const specs: Record<string, ToolSpec> = {
  'altin-ayar-hesaplama': {
    slug: 'altin-ayar-hesaplama',
    intro: 'Altının ayarını ve gramını seçin; içindeki has (saf) altın miktarını ve has gram fiyatına göre değerini görün.',
    fields: [
      { type: 'number', key: 'gram', label: 'Ağırlık', default: 10, unit: 'gram', min: 0 },
      { type: 'select', key: 'ayar', label: 'Ayar', default: '22', segmented: true, options: ['24', '22', '21', '18', '14', '8'].map((a) => ({ value: a, label: `${a} ayar` })) },
      money('fiyat', 'Has altın gram fiyatı', null, { optional: true, help: 'Güncel gram altın (24 ayar) fiyatı. Boş bırakırsanız yalnızca has gram hesaplanır.' }),
    ],
    compute(v) {
      const r = altinAyar(n(v, 'gram'), s(v, 'ayar'), n(v, 'fiyat') || null);
      return {
        headline: { label: 'Has altın karşılığı', value: `${num(r.hasGram, 3)} gr`, sub: r.deger != null ? `Değeri ${tl(r.deger)}` : `Milyem ${num(r.milyem, 3)}`, tone: 'primary' },
        rows: [
          { label: 'Ayar / milyem', value: `${s(v, 'ayar')} ayar · ${num(r.milyem, 3)}` },
          { label: 'Has altın', value: `${num(r.hasGram, 3)} gram`, strong: true },
          ...(r.deger != null ? [{ label: 'Has gram fiyatıyla değeri', value: tl(r.deger), strong: true }] : []),
        ],
        table: {
          caption: 'Ayarların milyem (saflık) değerleri',
          columns: ['Ayar', 'Milyem', '1 gramdaki has altın'],
          rows: Object.entries(ALTIN_MILYEM).sort((a, c) => Number(c[0]) - Number(a[0])).map(([a, m]) => [`${a} ayar`, num(m, 3), `${num(m, 3)} gr`]),
        },
        notes: ['Kuyumcular ziynet ve bilezik satışında işçilik ücreti ekler; alımda işçilik ödenmez. Bu hesap yalnızca altın değerini verir.'],
      };
    },
    info: {
      how: [
        'Altının ayarı, içindeki saf altın oranını gösterir ve milyemle ifade edilir. Türkiye’de piyasa standardı olarak 24 ayar 0,995, 22 ayar 0,916, 18 ayar 0,750, 14 ayar 0,585 milyem kabul edilir.',
        'Bir altının has karşılığı ağırlığı ile milyeminin çarpımıdır. Değeri bulmak için has gram fiyatıyla çarpılır.',
      ],
      formula: ['Has altın (gr) = ağırlık × milyem', 'Değer = has altın × has gram fiyatı'],
      faqs: [
        { q: '22 ayar 1 gram kaç gram has altın eder?', a: '0,916 gram has altın eder.' },
        { q: '14 ayar ile 22 ayar arasındaki fark nedir?', a: '14 ayarda saf altın oranı %58,5, 22 ayarda %91,6’dır. 14 ayar daha sert ve dayanıklıdır, 22 ayar ise yatırım amaçlı bilezik ve ziynette tercih edilir.' },
      ],
    },
  },

  'altin-kar-zarar-hesaplama': karZararSpec(
    'altin-kar-zarar-hesaplama', 'gr', 'Miktar', 3000, 4200, 20,
    'Altını aldığınız ve sattığınız (veya güncel) gram fiyatını ve miktarı girin; kâr/zararınızı ve yüzde getirinizi görün.',
    {
      how: ['Kâr/zarar, satış tutarı ile alış tutarı arasındaki farktır. Yüzde getiri, bu farkın alış tutarına oranıdır. Çeyrek ve tam altın için “gr” yerine adet fiyatı ve adet girebilirsiniz.'],
      formula: ['Kâr/zarar = (satış fiyatı − alış fiyatı) × miktar', 'Getiri = kâr/zarar / alış tutarı × 100'],
      faqs: [
        { q: 'Altında makas neden önemli?', a: 'Kuyumcu ve bankaların alış ve satış fiyatı arasındaki fark (makas) sizin maliyetinizdir. Hesapta aldığınız gerçek fiyatı ve satabileceğiniz fiyatı kullanın.' },
        { q: 'Altın satış kârı vergiye tabi mi?', a: 'Bireylerin fiziki altın alım-satım kazancı genellikle vergilendirilmez; ancak ticari faaliyet niteliğindeki işlemler ve bazı finansal ürünler farklı değerlendirilebilir.' },
      ],
    },
  ),

  'doviz-kar-zarar-hesaplama': karZararSpec(
    'doviz-kar-zarar-hesaplama', 'birim', 'Döviz miktarı', 38.5, 42, 1000,
    'Dolar, euro veya sterlini aldığınız ve sattığınız kuru ve miktarı girin; TL cinsinden kâr/zararınızı görün.',
    {
      how: ['Döviz alım-satımında kâr/zarar, satış kuru ile alış kuru farkının döviz miktarıyla çarpımıdır. Banka ve döviz bürolarının alış-satış makası nedeniyle aynı gün al-sat genellikle zarar doğurur.'],
      formula: ['Kâr/zarar = (satış kuru − alış kuru) × miktar'],
      faqs: [
        { q: 'Döviz alımında vergi var mı?', a: 'Bankalardan ve yetkili kuruluşlardan yapılan döviz alımlarında Kambiyo Muameleleri Vergisi (KMV) uygulanabilir; oranı Cumhurbaşkanı kararıyla belirlenir. Güncel oranı bankanızdan teyit edin.' },
      ],
    },
  ),

  'ortalama-maliyet-hesaplama': {
    slug: 'ortalama-maliyet-hesaplama',
    intro: 'Aynı hisse, altın veya kripto için farklı fiyatlardan yaptığınız alımları satır satır girin; ağırlıklı ortalama maliyetinizi ve güncel kâr/zararınızı görün.',
    fields: [
      { type: 'rows', key: 'alimlar', label: 'Alımlar', wide: true, columns: [{ key: 'adet', label: 'Adet / lot' }, { key: 'fiyat', label: 'Fiyat', unit: '₺' }], default: [[100, 45.2], [150, 38.6], [50, 41]], maxRows: 20, addLabel: 'Alım ekle' },
      { type: 'number', key: 'komisyon', label: 'Komisyon (binde)', default: 0, unit: '‰', min: 0, optional: true, help: 'Aracı kurum komisyonu. BSMV (%5) otomatik eklenir.' },
      money('guncel', 'Güncel fiyat', 44, { optional: true }),
    ],
    compute(v) {
      const rows = (v.alimlar as number[][]).map(([adet, fiyat]) => ({ adet, fiyat }));
      const r = ortalamaMaliyet(rows, n(v, 'komisyon') || 0, n(v, 'guncel') || null);
      if (!(r.toplamAdet > 0)) return null;
      const kar = (r.karZarar ?? 0) >= 0;
      return {
        headline: { label: 'Ortalama maliyet', value: tl(r.ortalama), sub: `${num(r.toplamAdet, 4)} adet · toplam ${tl(r.toplamTutar)}`, tone: 'primary' },
        rows: [
          { label: 'Toplam adet', value: num(r.toplamAdet, 4) },
          ...(r.komisyon ? [{ label: 'Komisyon + BSMV', value: tl(r.komisyon) }] : []),
          { label: 'Toplam maliyet', value: tl(r.toplamTutar) },
          { label: 'Ortalama maliyet', value: tl(r.ortalama), strong: true },
          ...(r.guncelDeger != null ? [
            { label: 'Güncel değer', value: tl(r.guncelDeger) },
            { label: kar ? 'Kâr' : 'Zarar', value: tl(r.karZarar!), tone: (kar ? 'up' : 'down') as 'up' | 'down', strong: true },
            { label: 'Getiri', value: pctv(r.getiri!), tone: (kar ? 'up' : 'down') as 'up' | 'down' },
          ] : []),
        ],
      };
    },
    info: {
      how: [
        'Ortalama maliyet, tüm alımların toplam tutarının toplam adede bölünmesiyle bulunur (ağırlıklı ortalama). Fiyatların basit ortalaması, farklı miktarlarda alım yapıldığında yanlış sonuç verir.',
      ],
      formula: ['Ortalama maliyet = Σ(adet × fiyat) / Σ adet'],
      faqs: [
        { q: 'Maliyet düşürmek nedir?', a: 'Fiyat düştüğünde ek alım yaparak ortalama maliyeti aşağı çekmektir. Risk de aynı oranda artar; ek alımdan önce yeni ortalamayı bu araçla görün.' },
        { q: 'Satış yaptıktan sonra ortalama maliyet değişir mi?', a: 'Hayır. Satış, kalan adetlerin ortalama maliyetini değiştirmez; yalnızca yeni alımlar değiştirir.' },
      ],
    },
  },

  'hisse-kar-zarar-hesaplama': {
    slug: 'hisse-kar-zarar-hesaplama',
    intro: 'Alış ve satış fiyatını, lot sayısını ve aracı kurum komisyonunu girin; komisyon ve BSMV dahil net kâr/zararınızı ve başabaş fiyatınızı görün.',
    fields: [
      money('alis', 'Alış fiyatı', 50),
      money('satis', 'Satış fiyatı', 56),
      { type: 'number', key: 'adet', label: 'Lot (adet)', default: 1000, unit: 'lot', min: 0, integer: true },
      { type: 'number', key: 'komisyon', label: 'Komisyon oranı (binde)', default: 2, unit: '‰', min: 0, help: 'Aracı kurumunuzun işlem başı komisyonu; ör. binde 2. BSMV (%5) eklenir.' },
    ],
    compute(v) {
      const r = hisseKarZarar(n(v, 'alis'), n(v, 'satis'), n(v, 'adet'), n(v, 'komisyon'));
      const kar = r.karZarar >= 0;
      return {
        headline: { label: kar ? 'Net kâr' : 'Net zarar', value: tl(r.karZarar), sub: `Getiri ${pctv(r.getiri)} · başabaş ${tl(r.basabasFiyat)}`, tone: kar ? 'up' : 'down' },
        sections: [
          { title: 'Alış', rows: [
            { label: 'Alış tutarı', value: tl(r.alisTutari) },
            { label: 'Komisyon + BSMV', value: tl(r.alisKomisyon) },
            { label: 'Toplam maliyet', value: tl(r.toplamMaliyet), strong: true },
          ] },
          { title: 'Satış', rows: [
            { label: 'Satış tutarı', value: tl(r.satisTutari) },
            { label: 'Komisyon + BSMV', value: `− ${tl(r.satisKomisyon)}` },
            { label: 'Net satış', value: tl(r.netSatis), strong: true },
          ] },
          { title: 'Sonuç', rows: [
            { label: kar ? 'Net kâr' : 'Net zarar', value: tl(r.karZarar), tone: kar ? 'up' : 'down', strong: true },
            { label: 'Getiri', value: pctv(r.getiri), tone: kar ? 'up' : 'down' },
            { label: 'Başabaş satış fiyatı', value: tl(r.basabasFiyat), hint: 'Komisyonlar dahil zarar etmeden satılabilecek en düşük fiyat' },
          ] },
        ],
      };
    },
    info: {
      how: [
        'Aracı kurumlar alış ve satışta işlem tutarı üzerinden komisyon alır; komisyona %5 BSMV eklenir. Net kâr, komisyonlar düşülmüş satış tutarı ile komisyon eklenmiş alış maliyeti arasındaki farktır.',
        'Başabaş fiyat, satış komisyonu da ödendikten sonra toplam maliyeti karşılayan en düşük satış fiyatıdır.',
      ],
      formula: ['Komisyon = tutar × (binde oran / 1000) × 1,05', 'Net kâr = (satış − komisyon) − (alış + komisyon)', 'Başabaş = toplam maliyet / (adet × (1 − komisyon oranı × 1,05))'],
      faqs: [
        { q: 'Borsa İstanbul’da 1 lot kaç hisse?', a: 'Pay piyasasında 1 lot 1 adet paydır.' },
        { q: 'Hisse kazancına vergi var mı?', a: 'Borsa İstanbul’da işlem gören hisse senetlerinden bireysel yatırımcıların elde ettiği alım-satım kazançlarında stopaj oranı genellikle %0’dır; yatırım ortaklıkları gibi istisnalar vardır. Temettüde %15 stopaj uygulanır.' },
      ],
    },
  },

  'temettu-hesaplama': {
    slug: 'temettu-hesaplama',
    intro: 'Hisse adedinizi ve şirketin açıkladığı hisse başı brüt temettüyü girin; hesabınıza yatacak net tutarı ve temettü verimini görün.',
    fields: [
      { type: 'number', key: 'adet', label: 'Hisse adedi (lot)', default: 1000, unit: 'lot', min: 0, integer: true },
      money('brut', 'Hisse başı brüt temettü', 2.5),
      money('fiyat', 'Hisse fiyatı', 60, { optional: true, help: 'Temettü verimini hesaplamak için.' }),
    ],
    compute(v) {
      const r = temettu(n(v, 'adet'), n(v, 'brut'), n(v, 'fiyat') || null);
      return {
        headline: { label: 'Net temettü', value: tl(r.net), sub: r.verim != null ? `Brüt verim ${pct(r.verim)} · net ${pct(r.netVerim!)}` : `Brüt ${tl(r.brut)}`, tone: 'up' },
        rows: [
          { label: 'Brüt temettü', value: tl(r.brut) },
          { label: 'Stopaj (%15)', value: `− ${tl(r.stopaj)}`, tone: 'down' },
          { label: 'Net temettü', value: tl(r.net), strong: true },
          { label: 'Hisse başı net', value: tl(n(v, 'brut') * 0.85) },
          ...(r.verim != null ? [{ label: 'Brüt temettü verimi', value: pct(r.verim) }, { label: 'Net temettü verimi', value: pct(r.netVerim!) }] : []),
        ],
        notes: ['Temettüye hak kazanmak için hak kullanım tarihinden önceki işlem günü kapanışında hisseye sahip olmak gerekir (T+2 takas nedeniyle).'],
      };
    },
    info: {
      how: [
        'Tam mükellef kurumların gerçek kişi ortaklara dağıttığı kâr paylarından 22 Aralık 2024’ten itibaren %15 stopaj kesilir. Hesabınıza yatan tutar brüt temettünün %85’idir.',
        'Temettü verimi, hisse başı temettünün hisse fiyatına oranıdır ve yatırımın temettü getirisini gösterir.',
      ],
      formula: ['Brüt = adet × hisse başı brüt temettü', 'Net = brüt × (1 − %15)', 'Temettü verimi = hisse başı brüt / fiyat'],
      faqs: [
        { q: 'Temettü beyan edilir mi?', a: 'Stopaja tabi tutulmuş kâr paylarının yarısı gelir vergisinden istisnadır; kalan yarı, yıllık beyan sınırını aşarsa beyan edilir ve kesilen stopaj mahsup edilir. Güncel beyan sınırını GİB’den kontrol edin.' },
      ],
      sources: [{ label: 'GİB — Menkul Sermaye İradı', url: 'https://gib.gov.tr/vergi-konulari/1_bireysel/10_menkul_sermaye_iradi/10' }],
    },
  },

  'pozisyon-buyuklugu-hesaplama': {
    slug: 'pozisyon-buyuklugu-hesaplama',
    intro: 'Sermayenizi, işlem başına göze aldığınız risk yüzdesini, giriş ve stop fiyatını girin; alabileceğiniz lot sayısı hesaplansın.',
    fields: [
      money('sermaye', 'Toplam sermaye', 100000),
      percent('risk', 'İşlem başı risk', 2, { max: 100 }),
      money('giris', 'Giriş fiyatı', 50),
      money('stop', 'Zarar kes (stop) fiyatı', 47),
      money('hedef', 'Hedef fiyat', 59, { optional: true }),
    ],
    compute(v) {
      const r = pozisyonBuyuklugu(n(v, 'sermaye'), n(v, 'risk'), n(v, 'giris'), n(v, 'stop'), n(v, 'hedef') || null);
      if (!r) return { error: 'Giriş ve stop fiyatı farklı ve sıfırdan büyük olmalı.' };
      return {
        headline: { label: 'Alınacak lot', value: int(r.adet), sub: `Pozisyon ${tl(r.pozisyonTutari)} · sermayenin ${pctv(r.sermayeOrani)}`, tone: 'primary' },
        rows: [
          { label: 'Göze alınan risk', value: tl(r.riskTutari) },
          { label: 'Lot başına risk (giriş − stop)', value: tl(r.birimRisk) },
          { label: 'Lot', value: int(r.adet), strong: true },
          { label: 'Pozisyon tutarı', value: tl(r.pozisyonTutari) },
          { label: 'Stop olursa zarar', value: tl(r.gercekRisk), tone: 'down' },
          ...(r.odulRisk != null ? [{ label: 'Risk / ödül', value: `1 : ${num(r.odulRisk, 2)}` }, { label: 'Hedefte kâr', value: tl(r.hedefKar!), tone: 'up' as const }] : []),
        ],
        notes: ['Komisyon ve kayma (slippage) dahil değildir. Pozisyon tutarı sermayeyi aşamayacağı için lot gerektiğinde sermayeyle sınırlanır.'],
      };
    },
    info: {
      how: [
        'Pozisyon büyüklüğü, stop çalıştığında kaybedeceğiniz tutarın sermayenizin belirli bir yüzdesini (ör. %1–2) aşmayacağı şekilde belirlenir. Lot sayısı = risk tutarı / (giriş − stop).',
      ],
      formula: ['Risk tutarı = sermaye × risk %', 'Lot = ⌊risk tutarı / |giriş − stop|⌋', 'Risk/ödül = |hedef − giriş| / |giriş − stop|'],
      faqs: [
        { q: 'İşlem başına ne kadar risk alınmalı?', a: 'Yaygın risk yönetimi kuralı, tek işlemde sermayenin %1–2’sinden fazlasını riske atmamaktır.' },
      ],
    },
  },

  'fk-orani-hesaplama': {
    slug: 'fk-orani-hesaplama',
    intro: 'Hisse fiyatını, toplam hisse adedini (ödenmiş sermaye), son 12 aylık net kârı ve öz kaynağı girin; F/K, PD/DD ve hisse başı kâr hesaplansın.',
    fields: [
      money('fiyat', 'Hisse fiyatı', 50),
      { type: 'number', key: 'adet', label: 'Toplam hisse adedi', default: 1000000000, unit: 'adet', min: 0, help: 'Şirketin ödenmiş sermayesi (1 TL nominal pay sayısı).' },
      money('kar', 'Yıllık net kâr (son 12 ay)', 5000000000),
      money('ozkaynak', 'Öz kaynaklar', 25000000000, { optional: true }),
    ],
    compute(v) {
      const r = carpanlar(n(v, 'fiyat'), n(v, 'adet'), n(v, 'kar'), n(v, 'ozkaynak') || null);
      return {
        headline: { label: 'F/K oranı', value: r.fk != null ? num(r.fk, 2) : 'Anlamsız', sub: r.fk != null ? `Şirket kârıyla kendini ${num(r.fk, 1)} yılda öder` : 'Şirket zarar ettiği için F/K hesaplanmaz', tone: 'primary' },
        rows: [
          { label: 'Piyasa değeri', value: tl(r.piyasaDegeri) },
          { label: 'Hisse başı kâr', value: r.hbk != null ? tl(r.hbk) : '—' },
          { label: 'F/K', value: r.fk != null ? num(r.fk, 2) : 'Anlamsız (zarar)', strong: true },
          { label: 'PD/DD', value: r.pddd != null ? num(r.pddd, 2) : '—', strong: true },
        ],
      };
    },
    info: {
      how: [
        'F/K (fiyat/kazanç) oranı, piyasa değerinin yıllık net kâra bölünmesiyle bulunur; yatırımcının şirketin 1 TL kârı için kaç TL ödediğini gösterir. PD/DD (piyasa değeri/defter değeri) piyasa değerinin öz kaynaklara oranıdır.',
      ],
      formula: ['Piyasa değeri = fiyat × hisse adedi', 'F/K = piyasa değeri / net kâr', 'PD/DD = piyasa değeri / öz kaynaklar'],
      faqs: [
        { q: 'Düşük F/K ucuz hisse demek mi?', a: 'Tek başına değil. Büyüme beklentisi, sektör ortalaması, borçluluk ve tek seferlik kârlar birlikte değerlendirilmelidir.' },
        { q: 'F/K negatif çıkarsa ne olur?', a: 'Şirket zarar ediyorsa F/K anlamsızdır; bu durumda PD/DD veya satış bazlı çarpanlara bakılır.' },
      ],
    },
  },

  'paranin-ikiye-katlanma-suresi': {
    slug: 'paranin-ikiye-katlanma-suresi',
    intro: 'Yıllık getiri oranını girin; paranızın kaç yılda ikiye ve üçe katlanacağını hem 72 kuralıyla hem kesin formülle görün.',
    fields: [percent('oran', 'Yıllık getiri (bileşik)', 25, { max: 1000 })],
    compute(v) {
      const r = ikiyeKatlanma(n(v, 'oran'));
      if (!r) return { error: 'Getiri oranı sıfırdan büyük olmalı.' };
      return {
        headline: { label: 'İkiye katlanma süresi', value: yilAy(r.kesin), sub: `${num(r.kesin, 2)} yıl · 72 kuralı: ${num(r.kural72, 2)} yıl`, tone: 'primary' },
        rows: [
          { label: 'Kesin süre (ln 2 / ln(1 + r))', value: `${num(r.kesin, 2)} yıl`, strong: true },
          { label: '72 kuralı (72 / oran)', value: `${num(r.kural72, 2)} yıl` },
          { label: 'Üç katına çıkma', value: `${num(r.ucKat, 2)} yıl` },
        ],
      };
    },
    info: {
      how: [
        'Bileşik getiride paranın ikiye katlanma süresi n = ln 2 / ln(1 + r) formülüyle bulunur. 72 kuralı bunun pratik yaklaşımıdır: 72’yi yüzde olarak getiriye bölmek yaklaşık süreyi verir; %6–10 arası oranlarda çok isabetlidir, yüksek oranlarda sapar.',
      ],
      formula: ['n = ln 2 / ln(1 + r)', '72 kuralı ≈ 72 / (r × 100)'],
      faqs: [{ q: 'Enflasyon için de kullanılabilir mi?', a: 'Evet. Yıllık %30 enflasyonda fiyatlar yaklaşık 2,6 yılda ikiye katlanır; yani paranın alım gücü yarıya iner.' }],
    },
  },

  // ── Emlak ──
  'tapu-harci-hesaplama': {
    slug: 'tapu-harci-hesaplama',
    intro: 'Satış bedelini girin; alıcı ve satıcının ayrı ayrı ödeyeceği %2 tapu harcını ve döner sermaye ücretini görün.',
    fields: [
      money('bedel', 'Satış bedeli', 5000000),
      money('rayic', 'Emlak vergisi değeri (rayiç)', null, { optional: true, help: 'Beyan edilen bedel bu değerden düşük olamaz; belediyeden öğrenilir.' }),
      money('doner', 'Döner sermaye ücreti', TAPU_DONER_SERMAYE_2026.max, { optional: true, help: `2026’da il/ilçeye göre ${int(TAPU_DONER_SERMAYE_2026.min)}–${int(TAPU_DONER_SERMAYE_2026.max)} TL arası.` }),
    ],
    compute(v) {
      const r = tapuHarci(n(v, 'bedel'), n(v, 'rayic') || 0, n(v, 'doner') || 0);
      return {
        headline: { label: 'Alıcının ödeyeceği', value: tl(r.aliciToplam), sub: `Satıcı ${tl(r.saticiHarci)} · toplam harç ${tl(r.toplamHarc)}`, tone: 'primary' },
        rows: [
          { label: 'Harç matrahı', value: tl(r.matrah) },
          { label: 'Alıcı tapu harcı (%2)', value: tl(r.aliciHarci) },
          { label: 'Satıcı tapu harcı (%2)', value: tl(r.saticiHarci) },
          { label: 'Toplam tapu harcı (%4)', value: tl(r.toplamHarc), strong: true },
          { label: 'Döner sermaye ücreti', value: tl(r.donerSermaye) },
          { label: 'Genel toplam', value: tl(r.genelToplam), strong: true },
        ],
        notes: ['Uygulamada tarafların anlaşmasıyla harcın tamamını alıcı da ödeyebilir. Döner sermaye ücreti genellikle alıcıdan alınır.'],
      };
    },
    info: {
      how: [
        '492 sayılı Harçlar Kanunu’na göre gayrimenkul satışında alıcı ve satıcıdan ayrı ayrı binde 20 (%2) tapu harcı alınır. Harç, beyan edilen satış bedeli üzerinden hesaplanır; bu bedel emlak vergisi değerinden düşük olamaz.',
        'Ayrıca tapu müdürlüğü işlemleri için döner sermaye ücreti ödenir. 2026 göstergesi 2.227 TL’dir ve bölgenin katsayısına (0,30–3,00) göre 668,10 TL ile 6.681 TL arasında değişir.',
      ],
      formula: ['Tapu harcı (her taraf) = max(satış bedeli, emlak vergisi değeri) × %2'],
      faqs: [
        { q: 'Tapu harcını kim öder?', a: 'Kanunen alıcı ve satıcı %2’şer öder. Taraflar harcın tamamının tek tarafça ödenmesinde anlaşabilir.' },
        { q: 'Düşük bedel göstermek sorun olur mu?', a: 'Gerçek bedelin altında beyan vergi ziyaı cezası ve kredi/ekspertiz sorunlarına yol açabilir; beyan edilen bedel emlak vergi değerinden de düşük olamaz.' },
        { q: 'İlk evini alanlar harç öder mi?', a: 'Genel bir muafiyet yoktur. Belirli şartlardaki konut kooperatifleri ve kentsel dönüşüm gibi istisnai durumlar kanunda sayılmıştır.' },
      ],
      sources: [SRC.harclar],
    },
  },

  'emlak-vergisi-hesaplama': {
    slug: 'emlak-vergisi-hesaplama',
    intro: 'Taşınmazın türünü, emlak vergisi değerini ve büyükşehirde olup olmadığını girin; yıllık vergi ve taksit tutarı hesaplansın.',
    fields: [
      { type: 'select', key: 'tur', label: 'Taşınmaz türü', default: 'konut', segmented: true, options: [
        { value: 'konut', label: 'Konut' }, { value: 'isyeri', label: 'İş yeri' }, { value: 'arsa', label: 'Arsa' }, { value: 'arazi', label: 'Arazi' },
      ] },
      money('deger', 'Emlak vergisi değeri', 2500000, { help: 'Belediyenin belirlediği vergi değeri (rayiç). Piyasa değeri değildir.' }),
      { type: 'toggle', key: 'bs', label: 'Büyükşehir belediyesi sınırlarında', default: true },
      percent('hisse', 'Hisse payınız', 100, { max: 100, min: 0.01 }),
    ],
    compute(v) {
      const r = emlakVergisi(n(v, 'deger'), s(v, 'tur') as EmlakTuru, b(v, 'bs'), n(v, 'hisse') / 100);
      return {
        headline: { label: 'Yıllık emlak vergisi', value: tl(r.yillik), sub: `2 taksit × ${tl(r.taksit)} (Mayıs ve Kasım)`, tone: 'down' },
        rows: [
          { label: 'Vergi oranı', value: `binde ${num(r.oran * 1000, 1)}` },
          { label: 'Yıllık vergi', value: tl(r.yillik), strong: true },
          { label: '1. taksit (31 Mayıs)', value: tl(r.taksit) },
          { label: '2. taksit (30 Kasım)', value: tl(r.taksit) },
        ],
        table: {
          caption: 'Emlak vergisi oranları',
          columns: ['Tür', 'Normal', 'Büyükşehir'],
          rows: [['Konut', 'binde 1', 'binde 2'], ['İş yeri', 'binde 2', 'binde 4'], ['Arsa', 'binde 3', 'binde 6'], ['Arazi', 'binde 1', 'binde 2']],
        },
        notes: ['Tek konutu olan ve belirli şartları taşıyan emekli, engelli, şehit yakını gibi mükellefler için konut vergisi sıfır oranlı olabilir.'],
      };
    },
    info: {
      how: [
        'Emlak vergisi, taşınmazın emlak vergisi değeri üzerinden yıllık olarak hesaplanır. Oranlar konutta binde 1, iş yerinde binde 2, arsada binde 3, arazide binde 1’dir; büyükşehir belediyesi sınırları ve mücavir alanlarda bu oranlar %100 artırımlı uygulanır.',
        'Vergi iki eşit taksitte Mayıs ve Kasım aylarının sonuna kadar ödenir. Hisseli mülkte her malik kendi payı oranında vergi öder.',
      ],
      formula: ['Yıllık vergi = vergi değeri × oran × (büyükşehirde 2) × hisse payı'],
      faqs: [
        { q: 'Emlak vergisi değerini nereden öğrenirim?', a: 'Taşınmazın bağlı olduğu belediyeden veya belediyenin e-belediye hizmetlerinden öğrenebilirsiniz.' },
        { q: 'Emlak vergisi ödenmezse ne olur?', a: 'Vadeden sonra aylık gecikme zammı işler (2026’da %3,7). Gecikme Zammı Hesaplama aracıyla tutarı bulabilirsiniz.' },
      ],
      sources: [SRC.emlak],
    },
  },

  'emlakci-komisyonu-hesaplama': {
    slug: 'emlakci-komisyonu-hesaplama',
    intro: 'Satış veya kiralama işlemi için emlak danışmanına ödenebilecek yasal azami hizmet bedelini hesaplayın.',
    fields: [
      { type: 'select', key: 'islem', label: 'İşlem', default: 'satis', segmented: true, options: [{ value: 'satis', label: 'Satış' }, { value: 'kira', label: 'Kiralama' }] },
      money('bedel', 'Satış bedeli', 5000000, { showIf: (v) => v.islem === 'satis' }),
      money('kira', 'Aylık kira', 25000, { showIf: (v) => v.islem === 'kira' }),
    ],
    compute(v) {
      const satis = s(v, 'islem') === 'satis';
      const r = emlakciKomisyonu(satis ? 'satis' : 'kira', satis ? n(v, 'bedel') : n(v, 'kira'));
      return satis
        ? {
          headline: { label: 'Alıcı ve satıcı ayrı ayrı', value: tl(r.tarafToplam), sub: `Emlakçıya toplam ${tl(r.genelToplam)}`, tone: 'primary' },
          rows: [
            { label: 'Hizmet bedeli (%2)', value: tl(r.taraf) },
            { label: 'KDV (%20)', value: tl(r.tarafKdv) },
            { label: 'Taraf başına toplam', value: tl(r.tarafToplam), strong: true },
            { label: 'İki taraftan toplam', value: tl(r.genelToplam) },
          ],
        }
        : {
          headline: { label: 'Azami toplam hizmet bedeli', value: tl(r.genelToplam), sub: '1 aylık kira + KDV (taraflar arasında paylaştırılır)', tone: 'primary' },
          rows: [
            { label: '1 aylık kira', value: tl(r.taraf) },
            { label: 'KDV (%20)', value: tl(r.tarafKdv) },
            { label: 'Azami toplam', value: tl(r.genelToplam), strong: true },
          ],
          notes: ['Kiralamada yönetmelik toplam tutara sınır koyar; kiracı ve ev sahibi arasındaki paylaşım sözleşmede belirlenir.'],
        };
    },
    info: {
      how: [
        'Taşınmaz Ticareti Hakkında Yönetmelik’e göre satışta emlak danışmanı, satış bedelinin alıcıdan ve satıcıdan ayrı ayrı en fazla %2’si + KDV tutarında hizmet bedeli alabilir. Kiralamada hizmet bedeli toplamda bir aylık kira + KDV’yi geçemez.',
      ],
      formula: ['Satış (her taraf) = bedel × %2 × 1,20', 'Kiralama (toplam) = aylık kira × 1,20'],
      faqs: [
        { q: 'Emlakçı komisyonu yüzde kaç?', a: 'Satışta her iki taraftan en fazla %2 + KDV (toplam %4 + KDV), kiralamada toplam en fazla 1 aylık kira + KDV’dir.' },
        { q: 'Yetki belgesi olmayan emlakçıya komisyon ödenir mi?', a: 'Yönetmeliğe göre taşınmaz ticareti yetki belgesi olmayan kişiler bu faaliyeti yapamaz; sözleşme imzalamadan önce yetki belgesini sorun.' },
      ],
      sources: [SRC.tasinmaz],
    },
  },

  'ev-amortisman-hesaplama': {
    slug: 'ev-amortisman-hesaplama',
    intro: 'Evin fiyatını ve alabileceği kirayı girin; evin kendini kaç yılda ödeyeceğini ve kira getirisi oranını görün.',
    fields: [
      money('fiyat', 'Ev fiyatı', 5000000),
      money('kira', 'Aylık kira', 25000),
      money('gider', 'Yıllık giderler', 0, { optional: true, help: 'Emlak vergisi, DASK, bakım, boş kalma kaybı vb.' }),
      percent('artis', 'Yıllık kira artışı', 0, { optional: true, help: 'Kira artışlı senaryo için. 0 bırakırsanız sabit kira varsayılır.' }),
    ],
    compute(v) {
      const r = evAmortisman(n(v, 'fiyat'), n(v, 'kira'), n(v, 'gider') || 0, (n(v, 'artis') || 0) / 100);
      if (!(r.yillikNet > 0)) return { error: 'Yıllık giderler kira gelirinden büyük; ev kendini ödeyemez.' };
      return {
        headline: { label: 'Amortisman süresi', value: yilAy(r.sabitKiraYil), sub: `Brüt kira getirisi ${pct(r.brutGetiri)}${r.artisliKiraYil != null && n(v, 'artis') > 0 ? ` · kira artışıyla ${yilAy(r.artisliKiraYil)}` : ''}`, tone: 'primary' },
        rows: [
          { label: 'Yıllık kira', value: tl(r.yillikKira) },
          { label: 'Yıllık net kira', value: tl(r.yillikNet) },
          { label: 'Brüt kira getirisi', value: pct(r.brutGetiri) },
          { label: 'Net kira getirisi', value: pct(r.netGetiri) },
          { label: 'Amortisman (sabit kira)', value: `${num(r.sabitKiraYil, 1)} yıl`, strong: true },
          ...(r.artisliKiraYil != null && n(v, 'artis') > 0 ? [{ label: `Amortisman (%${n(v, 'artis')} kira artışıyla)`, value: `${num(r.artisliKiraYil, 1)} yıl`, strong: true }] : []),
        ],
        notes: ['Evin değer artışı ve kira gelir vergisi hesaba katılmamıştır.'],
      };
    },
    info: {
      how: [
        'Amortisman süresi, ev fiyatının yıllık net kira gelirine bölünmesiyle bulunur ve yatırımın kira yoluyla kaç yılda geri döneceğini gösterir. Kira getirisi bunun tersidir: yıllık kira / fiyat.',
        'Kira her yıl artırılırsa geri dönüş süresi kısalır; araç kira artışlı senaryoda toplam net kiranın fiyata ulaştığı yılı ayrıca hesaplar.',
      ],
      formula: ['Amortisman (yıl) = fiyat / (aylık kira × 12 − yıllık gider)', 'Brüt getiri = aylık kira × 12 / fiyat'],
      faqs: [
        { q: 'Kaç yıllık amortisman iyidir?', a: 'Uluslararası piyasalarda 15–20 yıl (brüt getiri %5–7) makul kabul edilir. Türkiye’de bölgeye göre büyük farklar vardır; aynı bölgedeki diğer ilanlarla karşılaştırın.' },
      ],
    },
  },
};

