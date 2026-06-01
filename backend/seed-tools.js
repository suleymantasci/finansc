const { Client } = require('pg');

const TOOLS = [
  // Kredi
  { slug: 'ihtiyac-kredisi', title: 'İhtiyaç Kredisi', desc: 'İhtiyaç kredisi taksit ve faiz hesaplaması.', category: 'kredi', sort: 1 },
  { slug: 'konut-kredisi', title: 'Konut Kredisi', desc: 'Konut kredisi taksit ve maliyet hesaplaması.', category: 'kredi', sort: 2 },
  { slug: 'tasit-kredisi', title: 'Taşıt Kredisi', desc: 'Taşıt kredisi taksit hesaplaması.', category: 'kredi', sort: 3 },
  { slug: 'is-yeri-kredisi', title: 'İş Yeri Kredisi', desc: 'İş yeri kredisi taksit hesaplaması.', category: 'kredi', sort: 4 },
  { slug: 'ticari-kredi', title: 'Ticari Kredi', desc: 'Ticari kredi taksit hesaplaması.', category: 'kredi', sort: 5 },
  { slug: 'ticari-ihtiyac-kredisi', title: 'Ticari İhtiyaç Kredisi', desc: 'Ticari ihtiyaç kredisi hesaplaması.', category: 'kredi', sort: 6 },
  { slug: 'ticari-arac-kredisi', title: 'Ticari Araç Kredisi', desc: 'Ticari araç kredisi hesaplaması.', category: 'kredi', sort: 7 },
  { slug: 'kredi-hesaplama', title: 'Kredi Hesaplama', desc: 'Genel kredi hesaplama aracı.', category: 'kredi', sort: 8 },
  { slug: 'ne-kadar-kredi-alabilirim', title: 'Ne Kadar Kredi Alabilirim?', desc: 'Gelirinize göre maksimum kredi tutarı.', category: 'kredi', sort: 9 },
  { slug: 'kredi-dosya-masrafi', title: 'Kredi Dosya Masrafı', desc: 'Dosya masrafı tutarını hesaplayın.', category: 'kredi', sort: 10 },
  { slug: 'kredi-erken-kapatma', title: 'Kredi Erken Kapatma', desc: 'Erken kapatma tutarı ve ceza hesaplaması.', category: 'kredi', sort: 11 },
  { slug: 'kredi-gecikme-faizi', title: 'Kredi Gecikme Faizi', desc: 'Gecikme faizi tutarını hesaplayın.', category: 'kredi', sort: 12 },
  { slug: 'kredi-yapilandirma', title: 'Kredi Yapılandırma', desc: 'Kredi yeniden yapılandırma karşılaştırması.', category: 'kredi', sort: 13 },
  { slug: 'kredi-yillik-maliyet-orani', title: 'Yıllık Maliyet Oranı', desc: 'Efektif yıllık maliyet oranı hesaplaması.', category: 'kredi', sort: 14 },
  { slug: 'kredi-karti-asgari-odeme', title: 'Asgari Ödeme', desc: 'Kredi kartı asgari ödeme tutarı.', category: 'kredi', sort: 15 },
  { slug: 'kredi-karti-ek-taksit', title: 'Ek Taksit', desc: 'Kredi kartı borcunu taksitlendirme.', category: 'kredi', sort: 16 },
  { slug: 'kredi-karti-gecikme-faizi', title: 'Kart Gecikme Faizi', desc: 'Kredi kartı gecikme faizi hesaplaması.', category: 'kredi', sort: 17 },
  { slug: 'kredi-karti-islem-taksitlendirme', title: 'İşlem Taksitlendirme', desc: 'Tek işlemi taksitlendirme hesaplaması.', category: 'kredi', sort: 18 },
  { slug: 'kredi-karti-taksitli-nakit-avans', title: 'Nakit Avans', desc: 'Taksitli nakit avans maliyet hesaplaması.', category: 'kredi', sort: 19 },
  // Yatırım / Finans
  { slug: 'altin-hesaplama', title: 'Altın Hesaplama', desc: 'Altın türleri arasında çeviri ve değer hesaplaması.', category: 'yatirim', sort: 20 },
  { slug: 'doviz-hesaplama', title: 'Döviz Hesaplama', desc: 'Döviz kuru ile çeviri hesaplaması.', category: 'yatirim', sort: 21 },
  { slug: 'faiz-hesaplama', title: 'Faiz Hesaplama', desc: 'Basit ve bileşik faiz hesaplaması.', category: 'yatirim', sort: 22 },
  { slug: 'vadeli-mevduat', title: 'Vadeli Mevduat', desc: 'Vadeli mevduat getiri ve stopaj hesaplaması.', category: 'tasarruf', sort: 23 },
  { slug: 'bono-hesaplama', title: 'Bono Hesaplama', desc: 'Hazine bonosu getiri hesaplaması.', category: 'yatirim', sort: 24 },
  { slug: 'tahvil-hesaplama', title: 'Tahvil Hesaplama', desc: 'Devlet tahvili getiri hesaplaması.', category: 'yatirim', sort: 25 },
  { slug: 'repo-hesaplama', title: 'Repo Hesaplama', desc: 'Repo yatırım getirisi hesaplaması.', category: 'yatirim', sort: 26 },
  { slug: 'eurobond-hesaplama', title: 'Eurobond Hesaplama', desc: 'Eurobond vadeye kadar getiri hesaplaması.', category: 'yatirim', sort: 27 },
  { slug: 'birikim-hesaplama', title: 'Birikim Hesaplama', desc: 'Düzenli tasarruf ile birikim hesaplaması.', category: 'tasarruf', sort: 28 },
  { slug: 'enflasyon-hesaplama', title: 'Enflasyon Hesaplama', desc: 'Paranızın değer değişimini hesaplayın.', category: 'diger', sort: 29 },
  { slug: 'bilesik-buyume', title: 'Bileşik Büyüme (CAGR)', desc: 'Yıllık bileşik büyüme oranı hesaplaması.', category: 'yatirim', sort: 30 },
  { slug: 'reel-getiri', title: 'Reel Getiri', desc: 'Enflasyondan arındırılmış getiri hesaplaması.', category: 'yatirim', sort: 31 },
  { slug: 'kira-artis-orani', title: 'Kira Artış Oranı', desc: 'Kira artış tutarını hesaplayın.', category: 'diger', sort: 32 },
  { slug: 'parasal-deger', title: 'Parasal Değer', desc: 'Enflasyona göre parasal değer güncelleme.', category: 'diger', sort: 33 },
  { slug: 'net-bugunku-deger', title: 'Net Bugünkü Değer (NPV)', desc: 'Nakit akışlarının bugünkü değerini hesaplayın.', category: 'yatirim', sort: 34 },
  { slug: 'ic-verim-orani', title: 'İç Verim Oranı (IRR)', desc: 'Yatırımın iç verim oranını hesaplayın.', category: 'yatirim', sort: 35 },
  { slug: 'ic-dis-iskonto', title: 'İç ve Dış İskonto', desc: 'Basit ve bileşik iskonto hesaplaması.', category: 'yatirim', sort: 36 },
  { slug: 'ortalama-vade', title: 'Ortalama Vade', desc: 'Ağırlıklı ortalama vade hesaplaması.', category: 'yatirim', sort: 37 },
  { slug: 'vadeli-islem-fiyati', title: 'Vadeli İşlem Fiyatı', desc: 'Vadeli işlem teorik fiyat hesaplaması.', category: 'yatirim', sort: 38 },
  { slug: 'sermaye-temettu', title: 'Sermaye ve Temettü', desc: 'Temettü ve sermaye artırımı hesaplaması.', category: 'yatirim', sort: 39 },
  { slug: 'gecmis-altin-fiyatlari', title: 'Geçmiş Altın Fiyatları', desc: 'Geçmiş tarihli altın fiyatları ile hesaplama.', category: 'yatirim', sort: 40 },
  { slug: 'gecmis-doviz-kurlari', title: 'Geçmiş Döviz Kurları', desc: 'Geçmiş tarihli döviz kurları ile hesaplama.', category: 'yatirim', sort: 41 },
  { slug: 'iban-dogrulama', title: 'IBAN Doğrulama', desc: 'IBAN numaranızın geçerliliğini kontrol edin.', category: 'diger', sort: 42 },
];

async function seed() {
  const client = new Client({
    host: '72.62.93.150',
    port: 5432,
    database: 'finanscozum',
    user: 'finanscozum',
    password: '1cwXn5Nhpev2AIhrKHgebGRr',
    ssl: false,
  });

  await client.connect();
  console.log('DB connected');

  let inserted = 0;
  let skipped = 0;

  for (const tool of TOOLS) {
    const existing = await client.query('SELECT id FROM tools WHERE slug = $1', [tool.slug]);
    if (existing.rows.length > 0) {
      skipped++;
      continue;
    }

    const now = new Date().toISOString();
    await client.query(
      `INSERT INTO tools (id, title, slug, description, category, icon, "isActive", "sortOrder", "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, NULL, true, $5, $6, $7)`,
      [tool.title, tool.slug, tool.desc, tool.category, tool.sort, now, now]
    );
    inserted++;
  }

  console.log(`Done: ${inserted} inserted, ${skipped} skipped`);
  await client.end();
}

seed().catch(e => { console.error('Error:', e.message); process.exit(1); });
