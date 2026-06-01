import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kullanım Şartları',
  description: 'FinansCozum kullanım şartları ve koşulları. Platformumuzu kullanmadan önce lütfen okuyunuz.',
};

export default function KullanimSartlariPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 lg:px-8">
      <h1 className="mb-2 text-3xl font-bold">Kullanım Şartları</h1>
      <p className="mb-8 text-sm text-muted-foreground">Son güncelleme: 31 Mayıs 2026</p>

      <div className="space-y-8 text-muted-foreground leading-relaxed">
        <section>
          <h2 className="mb-3 text-xl font-semibold text-foreground">1. Genel Hükümler</h2>
          <p>
            Bu kullanım şartları, FinansCozum platformunu (&quot;Platform&quot;) kullanımınıza ilişkin koşulları
            düzenlemektedir. Platformu kullanarak bu şartları kabul etmiş sayılırsınız.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-foreground">2. Hizmet Tanımı</h2>
          <p>
            FinansCozum, kullanıcılarına anlık piyasa verileri, finansal hesaplama araçları ve finans
            içerikleri sunan bir bilgi platformudur. Sunulan tüm bilgiler yalnızca bilgilendirme amaçlıdır.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-foreground">3. Yatırım Tavsiyesi Değildir</h2>
          <p>
            Platformda yer alan hiçbir bilgi, analiz veya veri yatırım tavsiyesi niteliği taşımaz. Yatırım
            kararlarınız tamamen kendi sorumluluğunuzdadır. Yatırım yapmadan önce mutlaka lisanslı bir yatırım
            danışmanına başvurmanız önerilir.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-foreground">4. Veri Doğruluğu</h2>
          <p>
            Platformdaki piyasa verileri üçüncü taraf kaynaklardan alınmaktadır. Verilerin doğruluğu,
            eksiksizliği veya güncelliği konusunda garanti verilmez. Gecikmeler veya hatalar oluşabilir.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-foreground">5. Hesap Güvenliği</h2>
          <p>
            Hesap oluşturduğunuzda, hesap bilgilerinizin gizliliğini korumak sizin sorumluluğunuzdadır.
            Hesabınız üzerinden gerçekleştirilen tüm işlemlerden siz sorumlusunuz.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-foreground">6. Kabul Edilemez Kullanım</h2>
          <p className="mb-3">Aşağıdaki davranışlar kesinlikle yasaktır:</p>
          <ul className="ml-6 list-disc space-y-2">
            <li>Platformun güvenliğini tehlikeye atacak girişimlerde bulunmak</li>
            <li>Otomatik araçlarla aşırı miktarda istek göndermek</li>
            <li>Platform içeriklerini izinsiz kopyalamak veya dağıtmak</li>
            <li>Diğer kullanıcıların deneyimini olumsuz etkileyecek davranışlarda bulunmak</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-foreground">7. Fikri Mülkiyet</h2>
          <p>
            Platformdaki tüm içerikler, tasarımlar, logolar ve yazılımlar FinansCozum&apos;a aittir ve telif
            hakkı ile korunmaktadır. İzinsiz kullanım, çoğaltma veya dağıtım yasaktır.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-foreground">8. Sorumluluk Sınırı</h2>
          <p>
            FinansCozum, platformun kullanımından doğabilecek doğrudan veya dolaylı zararlardan sorumlu
            tutulamaz. Platform &quot;olduğu gibi&quot; sunulmakta olup, kesintisiz veya hatasız çalışacağına dair
            garanti verilmez.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-foreground">9. Değişiklikler</h2>
          <p>
            Bu kullanım şartları önceden bildirimde bulunmaksızın güncellenebilir. Güncel şartlar her zaman bu
            sayfada yayınlanacaktır. Platformu kullanmaya devam etmeniz, güncellenmiş şartları kabul ettiğiniz
            anlamına gelir.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-foreground">10. İletişim</h2>
          <p>
            Kullanım şartları hakkında sorularınız için{' '}
            <a href="mailto:info@finanscozum.com" className="text-primary hover:underline">
              info@finanscozum.com
            </a>{' '}
            adresinden bize ulaşabilirsiniz.
          </p>
        </section>
      </div>
    </div>
  );
}
