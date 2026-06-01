import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Gizlilik Politikası',
  description: 'FinansCozum gizlilik politikası. Kişisel verilerinizi nasıl topladığımızı ve koruduğumuzu öğrenin.',
};

export default function GizlilikPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 lg:px-8">
      <h1 className="mb-2 text-3xl font-bold">Gizlilik Politikası</h1>
      <p className="mb-8 text-sm text-muted-foreground">Son güncelleme: 31 Mayıs 2026</p>

      <div className="space-y-8 text-muted-foreground leading-relaxed">
        <section>
          <h2 className="mb-3 text-xl font-semibold text-foreground">1. Genel Bakış</h2>
          <p>
            FinansCozum (&quot;biz&quot;, &quot;Platform&quot;) olarak kullanıcılarımızın gizliliğine büyük önem
            veriyoruz. Bu gizlilik politikası, kişisel verilerinizin nasıl toplandığını, kullanıldığını ve
            korunduğunu açıklamaktadır.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-foreground">2. Toplanan Veriler</h2>
          <p className="mb-3">Platformumuzu kullandığınızda aşağıdaki veriler toplanabilir:</p>
          <ul className="ml-6 list-disc space-y-2">
            <li>
              <strong className="text-foreground">Hesap Bilgileri:</strong> Ad, soyad, e-posta adresi ve
              oluşturduğunuz hesap bilgileri.
            </li>
            <li>
              <strong className="text-foreground">Kullanım Verileri:</strong> Ziyaret ettiğiniz sayfalar,
              tıklama verileri ve platformda geçirdiğiniz süre.
            </li>
            <li>
              <strong className="text-foreground">Teknik Veriler:</strong> IP adresi, tarayıcı türü, cihaz
              bilgileri ve çerez verileri.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-foreground">3. Verilerin Kullanım Amacı</h2>
          <p className="mb-3">Toplanan veriler aşağıdaki amaçlarla kullanılmaktadır:</p>
          <ul className="ml-6 list-disc space-y-2">
            <li>Platformun işleyişini sağlamak ve iyileştirmek</li>
            <li>Kullanıcı deneyimini kişiselleştirmek</li>
            <li>Güvenlik önlemlerini uygulamak</li>
            <li>Yasal yükümlülükleri yerine getirmek</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-foreground">4. Çerezler</h2>
          <p>
            Platformumuz, kullanıcı deneyimini iyileştirmek için çerezler kullanmaktadır. Çerezler,
            tarayıcınız tarafından cihazınıza kaydedilen küçük metin dosyalarıdır. Tarayıcı ayarlarınızdan
            çerezleri yönetebilir veya devre dışı bırakabilirsiniz.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-foreground">5. Verilerin Paylaşımı</h2>
          <p>
            Kişisel verileriniz, yasal zorunluluklar dışında üçüncü taraflarla paylaşılmaz. Anonim ve
            toplu kullanım istatistikleri, hizmet kalitemizi artırmak için analiz amaçlı kullanılabilir.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-foreground">6. Veri Güvenliği</h2>
          <p>
            Verilerinizi korumak için endüstri standardı güvenlik önlemleri (SSL şifreleme, güvenli sunucular)
            uygulanmaktadır. Ancak internet üzerinden hiçbir veri aktarımının %100 güvenli olduğu garanti
            edilemez.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-foreground">7. Haklarınız</h2>
          <p className="mb-3">KVKK kapsamında aşağıdaki haklara sahipsiniz:</p>
          <ul className="ml-6 list-disc space-y-2">
            <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
            <li>İşlenmişse buna ilişkin bilgi talep etme</li>
            <li>Verilerin düzeltilmesini veya silinmesini isteme</li>
            <li>İşlemenin kısıtlanmasını talep etme</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-foreground">8. İletişim</h2>
          <p>
            Gizlilik politikamız hakkında sorularınız için{' '}
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
