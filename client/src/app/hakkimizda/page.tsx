import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Hakkımızda',
  description: 'FinansCozum hakkında bilgi edinin. Misyonumuz, vizyonumuz ve sunduğumuz hizmetler.',
};

export default function HakkimizdaPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 lg:px-8">
      <h1 className="mb-6 text-3xl font-bold">Hakkımızda</h1>

      <div className="space-y-6 text-muted-foreground leading-relaxed">
        <p>
          <strong className="text-foreground">FinansCozum</strong>, Türkiye&apos;deki yatırımcılara ve finans
          meraklılarına anlık piyasa verilerini, hesaplama araçlarını ve güncel finans içeriklerini tek bir
          platformda sunan bağımsız bir finans bilgi portalıdır.
        </p>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-foreground">Misyonumuz</h2>
          <p>
            Finansal okuryazarlığı artırmak, kullanıcılarımıza doğru ve güncel verilerle bilinçli yatırım
            kararları almaları için destek sağlamak temel misyonumuzdur. Karmaşık finansal bilgileri sade ve
            anlaşılır bir şekilde sunarak herkesin finansa erişimini kolaylaştırıyoruz.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-foreground">Vizyonumuz</h2>
          <p>
            Türkiye&apos;nin en güvenilir ve en çok tercih edilen finansal bilgi platformu olmayı hedefliyoruz.
            Teknoloji ve veri biliminin gücünü kullanarak, kullanıcı deneyimini sürekli iyileştirmeye devam
            ediyoruz.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-foreground">Hizmetlerimiz</h2>
          <ul className="ml-6 list-disc space-y-2">
            <li>
              <strong className="text-foreground">Anlık Piyasa Verileri:</strong> Borsa İstanbul hisse senetleri,
              endeksler ve altın fiyatlarını canlı olarak takip edin.
            </li>
            <li>
              <strong className="text-foreground">Hesaplama Araçları:</strong> Kredi, vergi, mevduat getirisi ve
              döviz çevirme araçlarıyla finansal hesaplamalarınızı kolayca yapın.
            </li>
            <li>
              <strong className="text-foreground">Finans İçerikleri:</strong> Piyasa analizleri, yatırım rehberleri
              ve güncel finans haberlerini bilgi merkezi bölümümüzden takip edin.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-foreground">Yasal Uyarı</h2>
          <p>
            FinansCozum&apos;da sunulan bilgiler yalnızca genel bilgilendirme amaçlıdır ve yatırım tavsiyesi
            niteliği taşımaz. Yatırım kararlarınızı vermeden önce mutlaka profesyonel bir finansal danışmana
            başvurmanızı öneririz.
          </p>
        </section>
      </div>
    </div>
  );
}
