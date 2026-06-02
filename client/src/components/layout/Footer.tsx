import Link from 'next/link';
import { FOOTER_LINKS, SITE_NAME } from '@/lib/constants';

function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
        {/* Top */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-1">
              <span className="text-lg font-extrabold text-primary">Finans</span>
              <span className="text-lg font-extrabold text-foreground">Çözüm</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Piyasaların nabzı burada. Anlık veri, doğru karar.
            </p>
          </div>

          {/* Piyasalar */}
          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-foreground">
              Piyasalar
            </h4>
            <ul className="space-y-2">
              {FOOTER_LINKS.piyasalar.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Araçlar */}
          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-foreground">
              Araçlar
            </h4>
            <ul className="space-y-2">
              {FOOTER_LINKS.araclar.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Kurumsal */}
          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-foreground">
              Kurumsal
            </h4>
            <ul className="space-y-2">
              {FOOTER_LINKS.kurumsal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/editor-ekibi" className="text-sm text-muted-foreground transition-colors hover:text-primary">
                  Editör Ekibi
                </Link>
              </li>
              <li>
                <Link href="/kaynak-politikasi" className="text-sm text-muted-foreground transition-colors hover:text-primary">
                  Kaynak Politikası
                </Link>
              </li>
              <li>
                <Link href="/duzeltme-politikasi" className="text-sm text-muted-foreground transition-colors hover:text-primary">
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
      </div>
    </footer>
  );
}

export { Footer };
