import Link from 'next/link';
import { FOOTER_LINKS, SITE_NAME } from '@/lib/constants';
import { Logo } from './Logo';
import { CookiePrefsButton } from '@/components/consent/CookiePrefsButton';

function Footer() {
  return (
    <footer className="border-t border-border bg-background pb-20 md:pb-0">
      <div className="mx-auto max-w-[1440px] px-4 py-14 lg:px-8">
        {/* Top */}
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          {/* Brand */}
          <div className="space-y-4">
            <Logo />
            <p className="font-display max-w-xs text-2xl leading-snug text-foreground/90">
              Daha bilinçli finansal kararlar için.
            </p>
            <p className="text-sm text-muted-foreground">
              Canlı veri, bağımsız içerik, ücretsiz hesaplama araçları.
            </p>
          </div>

          {/* Piyasalar */}
          <div>
            <h2 className="eyebrow mb-4 text-muted-foreground">
              Piyasalar
            </h2>
            <ul className="space-y-2">
              {FOOTER_LINKS.piyasalar.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-foreground/75 transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Araçlar */}
          <div>
            <h2 className="eyebrow mb-4 text-muted-foreground">
              Araçlar
            </h2>
            <ul className="space-y-2">
              {FOOTER_LINKS.araclar.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-foreground/75 transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Kurumsal */}
          <div>
            <h2 className="eyebrow mb-4 text-muted-foreground">
              Kurumsal
            </h2>
            <ul className="space-y-2">
              {FOOTER_LINKS.kurumsal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-foreground/75 transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/editor-ekibi" className="text-sm text-foreground/75 transition-colors hover:text-primary">
                  Editör Ekibi
                </Link>
              </li>
              <li>
                <CookiePrefsButton className="text-left text-sm text-foreground/75 transition-colors hover:text-primary" />
              </li>
              <li>
                <Link href="/kaynak-politikasi" className="text-sm text-foreground/75 transition-colors hover:text-primary">
                  Kaynak Politikası
                </Link>
              </li>
              <li>
                <Link href="/duzeltme-politikasi" className="text-sm text-foreground/75 transition-colors hover:text-primary">
                  Düzeltme Politikası
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="my-8 border-t border-border" />

        {/* Bottom */}
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} {SITE_NAME}. Tüm hakları saklıdır.
          </p>
          <p className="text-xs text-muted-foreground">
            Veriler bilgi amaçlıdır, yatırım tavsiyesi değildir.
          </p>
        </div>

        {/* Veri kaynağı uyarısı — lisans/ortaklık iddiası içermez (bkz. docs/hukuk/RAPOR.md) */}
        <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
          Borsa İstanbul hisse ve endeks verileri kamuya açık kaynaklardan derlenir ve en az 15 dakika gecikmelidir.
          Altın fiyatları ilgili piyasaların (serbest piyasa, Kapalıçarşı, Harem Altın, Altınkaynak, Garanti BBVA,
          Akbank) kamuya açık fiyat yayınlarından; döviz kurları serbest piyasa yayınlarından ve Türkiye Cumhuriyet
          Merkez Bankası&apos;ndan derlenir. Adı geçen kurum ve markalarla {SITE_NAME} arasında herhangi bir ortaklık
          veya bağlantı yoktur; adlar yalnızca fiyatın ait olduğu piyasayı belirtmek için kullanılır. Veriler hatalı
          ya da gecikmeli olabilir, yalnızca bilgi amaçlıdır ve yatırım tavsiyesi değildir. İşlem kararları için
          resmî kaynakları esas alınız.
        </p>
      </div>
    </footer>
  );
}

export { Footer };
