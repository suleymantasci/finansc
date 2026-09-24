import type { Metadata } from 'next';
import Link from 'next/link';
import { LEGAL, LEGAL_OPERATOR } from '@/lib/legal';

export const metadata: Metadata = {
  title: 'Gizlilik Politikası ve KVKK Aydınlatma Metni',
  description:
    'FinansÇözüm kişisel verileri hangi amaçla, hangi hukuki sebeple işler, kimlere aktarır ve KVKK kapsamındaki haklarınızı nasıl kullanabilirsiniz.',
  alternates: { canonical: 'https://finanscozum.net/gizlilik' },
};

const H2 = 'font-display mb-3 text-2xl text-foreground sm:text-3xl';
const STRONG = 'text-foreground';

/**
 * 6698 sayılı KVKK md.10 ve Aydınlatma Yükümlülüğünün Yerine Getirilmesinde Uyulacak
 * Usul ve Esaslar Hakkında Tebliğ'e göre hazırlanmıştır. İçerik sitenin gerçek veri
 * işleme faaliyetlerini yansıtmalıdır; yeni bir form/araç/üçüncü taraf eklenirse güncelleyin.
 */
export default function GizlilikPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 lg:px-8">
      <h1 className="font-display mb-2 text-balance text-4xl text-foreground sm:text-5xl">Gizlilik Politikası ve KVKK Aydınlatma Metni</h1>
      <p className="mb-8 text-sm text-muted-foreground">Son güncelleme: 24 Eylül 2026</p>

      <div className="space-y-8 leading-relaxed text-muted-foreground">
        <section>
          <h2 className={H2}>1. Veri sorumlusu</h2>
          <p>
            6698 sayılı Kişisel Verilerin Korunması Kanunu (&quot;KVKK&quot;) kapsamında veri sorumlusu{' '}
            <strong className={STRONG}>{LEGAL_OPERATOR}</strong>
            {LEGAL.address && <>, {LEGAL.address}</>}&apos;dır. İletişim:{' '}
            <a href={`mailto:${LEGAL.kvkkEmail}`} className="text-primary hover:underline">
              {LEGAL.kvkkEmail}
            </a>
            . Bu metin, finanscozum.net (&quot;Site&quot;) üzerinden işlenen kişisel verileri açıklar.
          </p>
        </section>

        <section>
          <h2 className={H2}>2. İşlenen veriler, amaçlar ve hukuki sebepler</h2>
          <div className="space-y-4">
            <div>
              <p className={STRONG}>Üyelik</p>
              <p>
                Ad, soyad, e-posta adresi, şifrenizin geri döndürülemez özeti (şifrenin kendisi saklanmaz) ve eklediğiniz
                favoriler. Amaç: hesabı oluşturmak, girişi sağlamak, favori ve hesap özelliklerini sunmak, şifre sıfırlama
                e-postası göndermek. Hukuki sebep: sözleşmenin kurulması ve ifası (KVKK md.5/2-c).
              </p>
            </div>
            <div>
              <p className={STRONG}>İletişim formu ve e-posta yazışmaları</p>
              <p>
                Ad soyad, e-posta adresi, konu ve mesaj içeriği. Amaç: talebinizi yanıtlamak ve kaydını tutmak. Hukuki
                sebep: talebinizin karşılanması için veri işlemenin zorunlu olması ve meşru menfaat (md.5/2-c, md.5/2-f).
              </p>
            </div>
            <div>
              <p className={STRONG}>İşlem güvenliği ve sunucu kayıtları</p>
              <p>
                IP adresi, tarayıcı/cihaz bilgisi, istek zamanı ve adresi. Amaç: Site&apos;nin güvenliğini sağlamak,
                kötüye kullanımı ve saldırıları tespit etmek, hataları gidermek, yetkili makamların talebi hâlinde bilgi
                vermek. Hukuki sebep: hukuki yükümlülük ve meşru menfaat (md.5/2-ç, md.5/2-f).
              </p>
            </div>
            <div>
              <p className={STRONG}>Ziyaret istatistikleri (yalnızca onayınızla)</p>
              <p>
                Google Analytics aracılığıyla ziyaret edilen sayfalar, ziyaret süresi, yaklaşık konum ve cihaz bilgisi.
                Amaç: hangi içeriklerin kullanıldığını ölçmek ve Site&apos;yi geliştirmek. Hukuki sebep: açık rıza
                (md.5/1). Onay vermezseniz bu çerezler yüklenmez; onayınızı istediğiniz zaman geri alabilirsiniz.
                Ayrıntı: <Link href="/cerez-politikasi" className="text-primary hover:underline">Çerez Politikası</Link>.
              </p>
            </div>
          </div>
          <p className="mt-4">
            Site; yaş, sağlık, din, biyometrik veri gibi özel nitelikli kişisel veri talep etmez. Hesaplama araçlarına
            girdiğiniz tutarlar kimliğinizle ilişkilendirilmez ve saklanmaz (bazı hesaplamalar, ör. enflasyon
            düzeltmesi, sonuç üretmek için sunucuda yapılır).
          </p>
        </section>

        <section>
          <h2 className={H2}>3. Toplama yöntemi</h2>
          <p>
            Veriler; üyelik, giriş ve iletişim formlarına sizin girdiğiniz bilgilerle, Site&apos;yi kullanırken sunucu
            kayıtlarıyla ve (onay vermeniz hâlinde) çerezlerle, elektronik ortamda otomatik yollarla toplanır.
          </p>
        </section>

        <section>
          <h2 className={H2}>4. Aktarım (yurt içi ve yurt dışı)</h2>
          <p className="mb-3">Kişisel veriler yalnızca aşağıdaki alıcılara, belirtilen amaçla sınırlı olarak aktarılır:</p>
          <ul className="ml-6 list-disc space-y-2">
            <li>
              <strong className={STRONG}>Sunucu barındırma hizmeti:</strong> Site ve veritabanı {LEGAL.hosting} üzerinde
              çalışır; bu nedenle üyelik, iletişim ve sunucu kayıt verileri yurt dışında saklanır.
            </li>
            <li>
              <strong className={STRONG}>E-posta gönderim hizmeti:</strong> şifre sıfırlama ve iletişim yanıtları için
              kullanılan e-posta altyapısı.
            </li>
            <li>
              <strong className={STRONG}>Google LLC / Google Ireland Ltd. (yalnızca onayınızla):</strong> Google Analytics
              ölçümü; veriler ABD dâhil yurt dışındaki sunucularda işlenebilir.
            </li>
            <li>
              <strong className={STRONG}>Yetkili kamu kurum ve kuruluşları:</strong> yalnızca mevzuattan doğan zorunluluk
              ve usulüne uygun talep hâlinde.
            </li>
          </ul>
          <p className="mt-3">
            Yurt dışına aktarımlar KVKK md.9 kapsamında gerçekleştirilir. Kişisel verileriniz satılmaz ve reklam amacıyla
            üçüncü kişilerle paylaşılmaz.
          </p>
        </section>

        <section>
          <h2 className={H2}>5. Saklama süreleri</h2>
          <ul className="ml-6 list-disc space-y-2">
            <li>Üyelik verileri: hesabınız açık kaldığı sürece; hesap silme talebinizden sonra en geç 30 gün içinde silinir veya anonim hâle getirilir.</li>
            <li>İletişim yazışmaları: talebin sonuçlanmasından itibaren 2 yıl.</li>
            <li>Sunucu ve güvenlik kayıtları: en fazla 2 yıl.</li>
            <li>Google Analytics verileri: Google Analytics hesabında tanımlı saklama süresi (en fazla 14 ay).</li>
          </ul>
          <p className="mt-3">Yasal bir uyuşmazlık veya resmî talep hâlinde ilgili kayıtlar, süreç sonuçlanana kadar saklanabilir.</p>
        </section>

        <section>
          <h2 className={H2}>6. KVKK md.11 kapsamındaki haklarınız</h2>
          <p className="mb-3">Veri sorumlusuna başvurarak;</p>
          <ul className="ml-6 list-disc space-y-2">
            <li>kişisel verilerinizin işlenip işlenmediğini öğrenme,</li>
            <li>işlenmişse buna ilişkin bilgi talep etme,</li>
            <li>işlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme,</li>
            <li>yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme,</li>
            <li>eksik veya yanlış işlenmişse düzeltilmesini isteme,</li>
            <li>KVKK md.7&apos;deki şartlar çerçevesinde silinmesini veya yok edilmesini isteme,</li>
            <li>düzeltme, silme veya yok etme işlemlerinin verilerin aktarıldığı üçüncü kişilere bildirilmesini isteme,</li>
            <li>münhasıran otomatik sistemlerle analiz edilmesi sonucu aleyhinize bir sonucun ortaya çıkmasına itiraz etme,</li>
            <li>kanuna aykırı işlenmesi sebebiyle zarara uğramanız hâlinde zararın giderilmesini talep etme</li>
          </ul>
          <p className="mt-3">haklarına sahipsiniz.</p>
        </section>

        <section>
          <h2 className={H2}>7. Başvuru</h2>
          <p>
            Taleplerinizi, kimliğinizi tespit etmeye yarayan bilgilerle birlikte{' '}
            <a href={`mailto:${LEGAL.kvkkEmail}`} className="text-primary hover:underline">
              {LEGAL.kvkkEmail}
            </a>{' '}
            adresine, Site&apos;ye kayıtlı e-posta adresinizden yazarak iletebilirsiniz
            {LEGAL.address && <> veya yazılı olarak {LEGAL.address} adresine gönderebilirsiniz</>}. Başvurular en geç 30 gün
            içinde ücretsiz olarak sonuçlandırılır. Başvurunuzun reddedilmesi, cevabın yetersiz bulunması veya süresinde
            cevap verilmemesi hâlinde Kişisel Verileri Koruma Kurulu&apos;na şikâyette bulunabilirsiniz.
          </p>
        </section>

        <section>
          <h2 className={H2}>8. Veri güvenliği</h2>
          <p>
            Bağlantılar HTTPS ile şifrelenir, şifreler geri döndürülemez biçimde saklanır ve yönetim erişimi yetkili
            kişilerle sınırlandırılır. İnternet üzerinden yapılan hiçbir aktarımın tamamen güvenli olduğu garanti
            edilemez; bir veri ihlali fark edilirse KVKK md.12 uyarınca Kurul&apos;a ve ilgili kişilere bildirim yapılır.
          </p>
        </section>

        <section>
          <h2 className={H2}>9. Değişiklikler</h2>
          <p>
            Bu metin, veri işleme faaliyetlerimiz değiştiğinde güncellenir; güncel sürüm her zaman bu sayfadadır. Esaslı
            değişikliklerde kayıtlı kullanıcılara e-posta ile bilgi verilir.
          </p>
        </section>
      </div>
    </div>
  );
}
