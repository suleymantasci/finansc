import type { Metadata } from 'next';
import Link from 'next/link';
import { CookiePrefsButton } from '@/components/consent/CookiePrefsButton';

export const metadata: Metadata = {
  title: 'Çerez Politikası',
  description: 'FinansÇözüm hangi çerezleri ve tarayıcı depolamasını, hangi amaçla kullanır; tercihinizi nasıl değiştirirsiniz.',
  alternates: { canonical: 'https://finanscozum.net/cerez-politikasi' },
};

const H2 = 'font-display mb-3 text-2xl text-foreground sm:text-3xl';

/** Tablo, sitenin gerçekte kullandığı çerez/depolama anahtarlarını listeler; yenisi eklenirse güncelleyin. */
const ROWS: { name: string; type: string; purpose: string; duration: string }[] = [
  { name: 'finanscozum-token, finanscozum-role', type: 'Zorunlu (çerez)', purpose: 'Giriş yaptığınızda oturumunuzu ve yetkinizi tanımak', duration: 'Tarayıcı oturumu / çıkış yapana kadar' },
  { name: 'finanscozum-auth', type: 'Zorunlu (yerel depolama)', purpose: 'Oturum bilgisinin sayfa yenilemede korunması', duration: 'Çıkış yapana kadar' },
  { name: 'theme', type: 'İşlevsel (yerel depolama)', purpose: 'Açık/koyu tema tercihinizi hatırlamak', duration: 'Siz silene kadar' },
  { name: 'fc-consent', type: 'Zorunlu (yerel depolama)', purpose: 'Çerez tercihinizi hatırlamak', duration: 'Siz silene kadar' },
  { name: '_ga, _ga_*', type: 'Analitik (çerez) — yalnızca onayla', purpose: 'Google Analytics ile anonim ziyaret istatistikleri', duration: 'En fazla 2 yıl' },
];

export default function CerezPolitikasiPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 lg:px-8">
      <h1 className="font-display mb-2 text-balance text-4xl text-foreground sm:text-5xl">Çerez Politikası</h1>
      <p className="mb-8 text-sm text-muted-foreground">Son güncelleme: 24 Eylül 2026</p>

      <div className="space-y-8 leading-relaxed text-muted-foreground">
        <section>
          <h2 className={H2}>Çerez nedir?</h2>
          <p>
            Çerezler ve tarayıcı depolaması, ziyaret ettiğiniz sitenin cihazınıza kaydettiği küçük bilgilerdir.
            FinansÇözüm bunları yalnızca aşağıdaki amaçlarla kullanır. Sitenin çalışması için zorunlu olanlar dışındaki
            çerezler (analitik) <strong className="text-foreground">yalnızca açık onayınızla</strong> yüklenir.
          </p>
        </section>

        <section>
          <h2 className={H2}>Kullandığımız çerezler</h2>
          <div className="atlas-card overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[12px] text-muted-foreground">
                  <th scope="col" className="px-4 py-3 font-normal">Ad</th>
                  <th scope="col" className="px-4 py-3 font-normal">Tür</th>
                  <th scope="col" className="px-4 py-3 font-normal">Amaç</th>
                  <th scope="col" className="px-4 py-3 font-normal">Süre</th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map((r) => (
                  <tr key={r.name} className="border-b border-border/60 align-top last:border-0">
                    <th scope="row" className="num px-4 py-3 text-left font-normal text-foreground">{r.name}</th>
                    <td className="px-4 py-3">{r.type}</td>
                    <td className="px-4 py-3">{r.purpose}</td>
                    <td className="px-4 py-3">{r.duration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-sm">Sitede reklam veya pazarlama amaçlı çerez kullanılmamaktadır.</p>
        </section>

        <section>
          <h2 className={H2}>Tercihinizi değiştirme</h2>
          <p>
            Analitik çerezlere verdiğiniz onayı istediğiniz zaman geri alabilir veya yeniden verebilirsiniz:{' '}
            <CookiePrefsButton className="text-primary hover:underline" />. Onayı geri aldığınızda Google Analytics
            çerezleri silinir ve ölçüm durur. Ayrıca tarayıcınızın ayarlarından tüm çerezleri silebilir veya
            engelleyebilirsiniz; zorunlu çerezleri engellerseniz giriş gibi bazı özellikler çalışmayabilir.
          </p>
        </section>

        <section>
          <h2 className={H2}>Kişisel verileriniz</h2>
          <p>
            Çerezlerle işlenen kişisel verilere ilişkin ayrıntılar ve haklarınız için{' '}
            <Link href="/gizlilik" className="text-primary hover:underline">
              Gizlilik Politikası ve KVKK Aydınlatma Metni
            </Link>
            &apos;ne bakabilirsiniz.
          </p>
        </section>
      </div>
    </div>
  );
}
