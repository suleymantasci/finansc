import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function EnflasyonExplainer() {
  return (
    <section className="prose prose-sm dark:prose-invert max-w-none border-t border-border pt-6 pb-6">
      <h2 className="font-display text-2xl text-foreground sm:text-3xl">TÜFE ve ÜFE Nedir?</h2>
      <p>
        <strong>TÜFE (Tüketici Fiyat Endeksi)</strong>, hanehalkının tükettiği mal ve hizmetlerin
        fiyat değişimini ölçer. Aylık ve yıllık yüzde değişim, tüketicinin satın alma gücündeki
        değişimi gösterir ve en yaygın kullanılan enflasyon göstergesidir.
      </p>
      <p>
        <strong>ÜFE (Yurt İçi Üretici Fiyat Endeksi / Yİ-ÜFE)</strong>, Türkiye&apos;de üretilen
        ürünlerin üreticiden çıkış fiyatlarındaki değişimi ölçer. Üretici maliyetlerindeki
        artışı önceden yansıttığı için öncü bir gösterge olarak kabul edilir.
      </p>
      <p className="text-xs text-muted-foreground">
        Veriler Türkiye Cumhuriyet Merkez Bankası (TCMB) tarafından yayımlanan Türkiye İstatistik
        Kurumu (TÜİK) endekslerine dayanır.
      </p>

      <div className="not-prose mt-4 flex flex-wrap gap-3">
        <Link
          href="/blog/enflasyon-nedir-bireyler-uzerindeki-etkisi-ve-korunma-yollari"
          className="inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:underline"
        >
          Enflasyonun bireylere etkisi (blog yazısı)
          <ArrowRight className="h-4 w-4" />
        </Link>
        <span className="text-muted-foreground">•</span>
        <Link
          href="/araclar/enflasyon-hesaplama"
          className="inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:underline"
        >
          Enflasyon hesaplama aracı
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}