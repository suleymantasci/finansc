import type { Metadata } from 'next';
import Link from 'next/link';
import { LEGAL, LEGAL_OPERATOR } from '@/lib/legal';

export const metadata: Metadata = {
  title: 'Kullanım Şartları',
  description: 'FinansÇözüm kullanım şartları: hizmetin kapsamı, yatırım tavsiyesi olmadığı, veri doğruluğu, üyelik, fikri haklar ve sorumluluk.',
  alternates: { canonical: 'https://finanscozum.net/kullanim-sartlari' },
};

const H2 = 'font-display mb-3 text-2xl text-foreground sm:text-3xl';

export default function KullanimSartlariPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 lg:px-8">
      <h1 className="font-display mb-2 text-balance text-4xl text-foreground sm:text-5xl">Kullanım Şartları</h1>
      <p className="mb-8 text-sm text-muted-foreground">Son güncelleme: 24 Eylül 2026</p>

      <div className="space-y-8 leading-relaxed text-muted-foreground">
        <section>
          <h2 className={H2}>1. Taraflar ve kapsam</h2>
          <p>
            Bu şartlar, finanscozum.net (&quot;Site&quot;) ile Site&apos;yi ziyaret eden veya üye olan kullanıcılar
            arasındaki ilişkiyi düzenler. Site <strong className="text-foreground">{LEGAL_OPERATOR}</strong>
            {LEGAL.address && <> ({LEGAL.address})</>} tarafından işletilir. Site&apos;yi kullanmak ücretsizdir; üye
            olurken bu şartları kabul edersiniz, üye olmadan kullanırken de bu şartlar geçerlidir.
          </p>
        </section>

        <section>
          <h2 className={H2}>2. Hizmetin niteliği</h2>
          <p>
            Site; altın, döviz, borsa ve emtia fiyatlarını, finansal hesaplama araçlarını ve genel bilgilendirme
            amaçlı içerikleri sunan bir bilgi platformudur. Site bir aracı kurum, banka, portföy yöneticisi veya
            yatırım danışmanı değildir; alım-satım emri almaz, para veya varlık kabul etmez.
          </p>
        </section>

        <section>
          <h2 className={H2}>3. Yatırım tavsiyesi değildir</h2>
          <p>
            Site&apos;deki fiyatlar, grafikler, hesaplama sonuçları ve yazılar yatırım danışmanlığı kapsamında değildir;
            hiçbir menkul kıymet, döviz, altın veya emtianın alınması ya da satılması yönünde öneri içermez. Yatırım
            danışmanlığı hizmeti, Sermaye Piyasası Kurulu&apos;ndan yetki almış kuruluşlarca kişinin risk ve getiri
            tercihleri dikkate alınarak sunulur. Bu bilgilere dayanarak verdiğiniz kararlar kendi sorumluluğunuzdadır.
          </p>
        </section>

        <section>
          <h2 className={H2}>4. Verilerin kaynağı ve doğruluğu</h2>
          <p>
            Piyasa verileri kamuya açık üçüncü taraf kaynaklardan otomatik olarak derlenir; Borsa İstanbul verileri en
            az 15 dakika gecikmelidir. Veriler gecikmeli, eksik veya hatalı olabilir ve resmî fiyat yerine geçmez. Alım,
            satım veya sözleşme işlemlerinde ilgili kurumun (banka, aracı kurum, kuyumcu, TCMB) ilan ettiği fiyatı esas
            alınız. Ayrıntı: <Link href="/kaynak-politikasi" className="text-primary hover:underline">Kaynak Politikası</Link>.
            Hesaplama araçları genel varsayımlarla sonuç üretir; vergi, faiz ve masraf gibi kalemler kurumdan kuruma
            değişebilir.
          </p>
        </section>

        <section>
          <h2 className={H2}>5. Üyelik</h2>
          <ul className="ml-6 list-disc space-y-2">
            <li>Üyelik için doğru bilgi vermeniz ve şifrenizi gizli tutmanız gerekir. Hesabınızın yetkisiz kullanıldığını fark ederseniz bize bildiriniz.</li>
            <li>Üyeliğinizi dilediğiniz zaman {LEGAL.email} adresine yazarak sonlandırabilirsiniz; verileriniz Gizlilik Politikası&apos;ndaki sürelerle silinir.</li>
            <li>Bu şartlara aykırı kullanım hâlinde hesap, önceden bildirimle (acil güvenlik durumlarında bildirimsiz) askıya alınabilir veya kapatılabilir.</li>
          </ul>
        </section>

        <section>
          <h2 className={H2}>6. Yasak kullanımlar</h2>
          <ul className="ml-6 list-disc space-y-2">
            <li>Site&apos;nin güvenliğini tehlikeye atmak, yetkisiz erişim denemek veya zararlı yazılım yaymak,</li>
            <li>Site&apos;ye olağan kullanımı aşan yükte otomatik istek göndermek veya içeriği toplu hâlde kopyalamak,</li>
            <li>Site içeriğini, kaynak göstermeden veya ticari amaçla izinsiz çoğaltmak ve yaymak,</li>
            <li>Başkalarının haklarını ihlal eden veya hukuka aykırı içerik iletmek.</li>
          </ul>
        </section>

        <section>
          <h2 className={H2}>7. Fikri haklar</h2>
          <p>
            Site&apos;nin tasarımı, yazılımı, logosu ve Site için hazırlanan yazılar Site işletmecisine aittir.
            Piyasa verileri ve bunlara ilişkin haklar ilgili kaynaklara ve borsalara aittir; üçüncü kişilere ait marka
            ve kurum adları yalnızca fiyatın ait olduğu piyasayı belirtmek için kullanılır ve bu kişilerle bir ortaklık
            anlamına gelmez. Yazılardan kısa alıntılar, bağlantı verilerek ve kaynak gösterilerek yapılabilir.
          </p>
        </section>

        <section>
          <h2 className={H2}>8. Sorumluluk</h2>
          <p>
            Site ücretsiz ve &quot;olduğu gibi&quot; sunulur; kesintisiz veya hatasız çalışacağı garanti edilmez. Verilerin
            gecikmesi, hatası veya Site&apos;nin kullanılamaması nedeniyle doğabilecek zararlardan, mevzuatın izin
            verdiği ölçüde sorumluluk kabul edilmez. Bu sınırlama; kast veya ağır ihmalden doğan zararlarla, tüketici
            mevzuatı gereği sınırlanamayan haklarınızı kapsamaz.
          </p>
        </section>

        <section>
          <h2 className={H2}>9. Dış bağlantılar</h2>
          <p>
            Site&apos;de üçüncü kişilere ait sitelere bağlantılar bulunabilir. Bu sitelerin içeriği ve gizlilik
            uygulamalarından ilgili site sahipleri sorumludur.
          </p>
        </section>

        <section>
          <h2 className={H2}>10. Değişiklikler</h2>
          <p>
            Bu şartlar güncellenebilir; güncel sürüm her zaman bu sayfadadır. Üyeleri etkileyen esaslı değişiklikler,
            yürürlüğe girmeden önce kayıtlı e-posta adresine bildirilir. Değişikliği kabul etmiyorsanız üyeliğinizi
            sonlandırabilirsiniz.
          </p>
        </section>

        <section>
          <h2 className={H2}>11. Uygulanacak hukuk ve uyuşmazlıklar</h2>
          <p>
            Bu şartlara Türkiye Cumhuriyeti hukuku uygulanır. Tüketici sıfatıyla doğacak uyuşmazlıklarda, parasal
            sınırlar dâhilinde yerleşim yerinizdeki veya işlemin yapıldığı yerdeki Tüketici Hakem Heyetleri ile
            Tüketici Mahkemeleri yetkilidir.
          </p>
        </section>

        <section>
          <h2 className={H2}>12. İletişim</h2>
          <p>
            Sorularınız için{' '}
            <a href={`mailto:${LEGAL.email}`} className="text-primary hover:underline">
              {LEGAL.email}
            </a>{' '}
            adresine yazabilirsiniz.
          </p>
        </section>
      </div>
    </div>
  );
}
