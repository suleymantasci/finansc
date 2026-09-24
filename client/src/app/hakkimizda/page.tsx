import type { Metadata } from 'next';
import { LEGAL, LEGAL_OPERATOR } from '@/lib/legal';

export const metadata: Metadata = {
  title: 'Hakkımızda | FinansCozum Ekibi ve Misyon',
  description: 'FinansCozum hakkında bilgi edinin. Türkiyenin bağımsız finans bilgi platformu olarak misyonumuz, vizyonumuz, editör ekibimiz ve sunduğumuz hizmetler.',
  keywords: ['hakkımızda', 'finans platformu', 'editör ekibi', 'misyon', 'vizyon'],
  alternates: { canonical: 'https://finanscozum.net/hakkimizda' },
};

export default function HakkimizdaPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 lg:px-8">
      <h1 className="font-display text-balance text-4xl text-foreground sm:text-5xl mb-6">Hakkımızda</h1>

      <div className="space-y-6 text-muted-foreground leading-relaxed">
        <p>
          <strong className="text-foreground">FinansCozum</strong>, Türkiye&apos;deki yatırımcılara ve finans
          meraklılarına anlık piyasa verilerini, hesaplama araçlarını ve güncel finans içeriklerini tek bir
          platformda sunan bağımsız bir finans bilgi portalıdır.
        </p>

        <section>
          <h2 className="font-display text-2xl text-foreground sm:text-3xl mb-3">Misyonumuz</h2>
          <p>
            Finansal okuryazarlığı artırmak, kullanıcılarımıza doğru ve güncel verilerle bilinçli yatırım
            kararları almaları için destek sağlamak temel misyonumuzdur. Karmaşık finansal bilgileri sade ve
            anlaşılır bir şekilde sunarak herkesin finansa erişimini kolaylaştırıyoruz.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl text-foreground sm:text-3xl mb-3">Vizyonumuz</h2>
          <p>
            Türkiye&apos;nin en güvenilir ve en çok tercih edilen finansal bilgi platformu olmayı hedefliyoruz.
            Teknoloji ve veri biliminin gücünü kullanarak, kullanıcı deneyimini sürekli iyileştirmeye devam
            ediyoruz.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl text-foreground sm:text-3xl mb-3">Hizmetlerimiz</h2>
          <ul className="ml-6 list-disc space-y-2">
            <li>
              <strong className="text-foreground">Piyasa Verileri:</strong> Altın ve döviz fiyatlarını yaklaşık 30 saniyede
              bir güncellenen verilerle, Borsa İstanbul hisse ve endekslerini en az 15 dakika gecikmeli olarak takip edin.
            </li>
            <li>
              <strong className="text-foreground">Hesaplama Araçları:</strong> Kredi, vergi, mevduat getirisi ve
              döviz çevirme araçlarıyla finansal hesaplamalarınızı kolayca yapın.
            </li>
            <li>
              <strong className="text-foreground">Finans İçerikleri:</strong> Piyasa analizleri, yatırım rehberleri
              ve finans rehberlerini bilgi merkezi bölümümüzden okuyun. Yazılar yapay zekâ araçları desteğiyle hazırlanır.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-2xl text-foreground sm:text-3xl mb-3">Yasal Uyarı</h2>
          <p>
            FinansCozum&apos;da sunulan bilgiler yalnızca genel bilgilendirme amaçlıdır ve yatırım tavsiyesi
            niteliği taşımaz. Yatırım kararlarınızı vermeden önce Sermaye Piyasası Kurulu&apos;ndan yetkili bir
            yatırım danışmanına başvurmanızı öneririz.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl text-foreground sm:text-3xl mb-3">Künye</h2>
          <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-[max-content_1fr]">
            <dt className="text-foreground">İşleten</dt>
            <dd>{LEGAL_OPERATOR}</dd>
            {LEGAL.address && (
              <>
                <dt className="text-foreground">Adres</dt>
                <dd>{LEGAL.address}</dd>
              </>
            )}
            {LEGAL.registry && (
              <>
                <dt className="text-foreground">Sicil / vergi</dt>
                <dd>{LEGAL.registry}</dd>
              </>
            )}
            <dt className="text-foreground">E-posta</dt>
            <dd>
              <a href={`mailto:${LEGAL.email}`} className="text-primary hover:underline">
                {LEGAL.email}
              </a>
            </dd>
          </dl>
        </section>
      </div>
    </div>
  );
}
