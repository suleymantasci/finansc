const { Client } = require('pg');

const blogContent = `
<p>Kredi, bir finans kuruluşunun belirli bir süre içinde geri ödenmek üzere kişi veya kurumlara verdiği borç paradır. Bankalar, kredi verirken belirli bir faiz oranı uygular ve bu faiz, kredinin toplam maliyetini belirleyen en önemli unsurdur. Türkiye'de bireysel ve ticari olmak üzere iki ana kredi kategorisi bulunur.</p>

<h2>Kredi Türleri</h2>
<p>Bireysel krediler arasında en yaygın olanı <strong>ihtiyaç kredisidir</strong>. Belirli bir amaca bağlı olmaksızın kullanılabilir ve genellikle 3 ile 60 ay arası vadeyle sunulur. <strong>Konut kredisi</strong> ise gayrimenkul alımı için kullanılır; vadesi 120 aya kadar çıkabilir ve KKDF ile BSMV muafiyetleri sayesinde maliyeti nispeten düşüktür. <strong>Taşıt kredisi</strong> araç alımına yönelik olup, araç rehin gösterilerek kullanılır.</p>

<p>Ticari krediler ise işletmelerin nakit ihtiyacını karşılamaya yöneliktir. İşyeri kredisi, ticari taşıt kredisi ve genel ticari ihtiyaç kredisi bu kategorinin başlıca örnekleridir. Ticari kredilerde BSMV oranı %5, KKDF ise %0 olarak uygulanır.</p>

<h2>Kredi Başvurusunda Nelere Bakılır?</h2>
<p>Bankalar kredi başvurusunu değerlendirirken birkaç temel kritere odaklanır:</p>
<ul>
  <li><strong>Kredi notu:</strong> Kredi Kayıt Bürosu (KKB) tarafından hesaplanan ve 1 ile 1900 arasında puanlanan bir değerdir. 1500 üzeri puan iyi, 1700 üzeri ise mükemmel kabul edilir.</li>
  <li><strong>Gelir durumu:</strong> Düzenli gelir belgesi veya maaş bordrosu istenir. Aylık taksit tutarı genellikle net gelirin %50'sini geçmemelidir.</li>
  <li><strong>Mevcut borçlar:</strong> Kişinin halihazırdaki kredi ve kredi kartı borçları toplam borçluluk oranını etkiler.</li>
  <li><strong>İstihdam süresi:</strong> Aynı işyerinde en az 6 ay çalışmış olmak avantaj sağlar.</li>
</ul>

<h2>Kredi Notu Nasıl Yükseltilir?</h2>
<p>Kredi notunuzu iyileştirmek için düzenli ödeme alışkanlığı edinmek en etkili yoldur. Kredi kartı borcunuzu her ay tam ve zamanında ödeyin. Birden fazla kredi başvurusu yapmaktan kaçının; çünkü her sorgulama notunuzu geçici olarak düşürür. Kullanılmayan kredi kartlarını kapatmak yerine düşük limitli olarak açık tutmak da notu olumlu etkiler.</p>

<h2>Kredi Maliyetini Etkileyen Faktörler</h2>
<p>Kredinizin toplam maliyeti sadece faiz oranıyla belirlenmez. <strong>BSMV</strong> (Banka ve Sigorta Muameleleri Vergisi) ve <strong>KKDF</strong> (Kaynak Kullanımını Destekleme Fonu) gibi yasal kesintiler de taksit tutarını doğrudan etkiler. Bireysel kredilerde BSMV %15, KKDF %15 oranında uygulanırken, konut kredisinde ilk konut alımında bu kesintiler sıfırdır.</p>

<p>Bunlara ek olarak bazı bankalar <strong>dosya masrafı</strong>, <strong>ekspertiz ücreti</strong> ve <strong>sigorta</strong> gibi ek maliyetler de talep edebilir. Kredi kullanmadan önce <strong>yıllık maliyet oranını</strong> (APR) mutlaka karşılaştırın.</p>

<h2>Erken Kapatma ve Yapılandırma</h2>
<p>Kredinizi vadesinden önce kapatmak istiyorsanız, kalan anapara üzerinden erken kapama tutarı hesaplanır. Yasal olarak bankalar bireysel kredilerde en fazla %2 erken kapama komisyonu alabilir. Ödemekte zorlanıyorsanız ise kredi yapılandırması seçeneğini değerlendirin: mevcut borcunuz yeniden vadelendirilerek taksitler düşürülebilir.</p>

<h2>Sonuç</h2>
<p>Kredi kullanırken aceleci davranmayın. Farklı bankaların faiz oranlarını, ek masraflarını ve toplam geri ödeme tutarlarını karşılaştırın. <a href="/araclar/ihtiyac-kredisi">Kredi hesaplama aracımızı</a> kullanarak aylık taksit tutarınızı ve toplam maliyetinizi önceden görebilirsiniz. Bilinçli kredi kullanımı, finansal sağlığınızın temelidir.</p>
`;

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

  // Check existing
  const existing = await client.query("SELECT id FROM blogs WHERE slug = 'kredi-nedir-kredi-kullanimi-ve-kredi-notu-rehberi'");
  if (existing.rows.length > 0) {
    console.log('Blog already exists, skipping');
    await client.end();
    return;
  }

  const now = new Date().toISOString();

  await client.query(
    `INSERT INTO blogs (
      id, title, slug, content, excerpt, category, status,
      "isFeatured", "seoTitle", "seoDescription", "seoKeywords",
      "viewCount", "publishedAt", "createdAt", "updatedAt"
    ) VALUES (
      gen_random_uuid(), $1, $2, $3, $4, $5, $6,
      $7, $8, $9, $10,
      $11, $12, $13, $14
    )`,
    [
      'Kredi Nedir? Kredi Kullanımı ve Kredi Notu Rehberi',
      'kredi-nedir-kredi-kullanimi-ve-kredi-notu-rehberi',
      blogContent.trim(),
      'Kredi türleri, başvuru şartları, kredi notu nasıl yükseltilir ve kredi maliyetini etkileyen faktörler hakkında kapsamlı rehber.',
      'Kredi',
      'published',
      true,
      'Kredi Nedir? Kredi Kullanımı ve Kredi Notu Rehberi | FinansÇözüm',
      'Kredi nedir, nasıl kullanılır, kredi notu nasıl yükseltilir? İhtiyaç, konut ve taşıt kredisi hakkında bilmeniz gereken her şey.',
      'kredi nedir, kredi notu, kredi kullanımı, ihtiyaç kredisi, konut kredisi, kredi başvurusu, BSMV, KKDF',
      0,
      now, now, now,
    ]
  );

  console.log('Blog post inserted successfully!');
  await client.end();
}

seed().catch(e => { console.error('Error:', e.message); process.exit(1); });
