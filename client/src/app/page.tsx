import Link from 'next/link';
import { HeroSection } from './_landing/HeroSection';
import { BorsaOzetSection } from './_landing/BorsaOzetSection';
import { AltinSection } from './_landing/AltinSection';
import { AraclarSection } from './_landing/AraclarSection';
import { BlogSection } from './_landing/BlogSection';
import { AdBanner } from '@/components/ads/AdBanner';

export default function Home() {
  return (
    <>
      {/* ── Server-render H1 (SEO kritik) ── */}
      <section className="border-b border-border bg-gradient-to-b from-card to-background">
        <div className="mx-auto max-w-7xl px-4 py-10 text-center lg:px-8 lg:py-14">
          <h1 className="text-3xl font-extrabold tracking-tight lg:text-5xl">
            Canlı Altın, Borsa, Döviz ve{' '}
            <span className="text-primary">Finansal Hesaplama Araçları</span>
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-base text-muted-foreground lg:text-lg">
            Türkiye&apos;nin en kapsamlı finans bilgi platformu. Anlık altın fiyatları, Borsa İstanbul
            endeksleri, döviz kurları, hisse senetleri ve 40+ ücretsiz finansal hesaplama aracı tek
            çatı altında.
          </p>
          {/* Görünmez ama SEO için değerli anahtar kelime zengin içerik */}
          <p className="sr-only">
            FinansÇözüm, gram altın, çeyrek altın, tam altın, cumhuriyet altını, 22 ayar bilezik, ons
            altın, gümüş fiyatları; BIST 100, BIST 30, BIST 50 endeksleri; USD, EUR, GBP, CHF
            döviz kurları; THYAO, GARAN, AKBNK, EREGL, TUPRS, SISE, KCHOL, SAHOL başta olmak üzere
            Borsa İstanbul hisseleri; kredi hesaplama, vadeli mevduat, enflasyon, reel getiri,
            bileşik faiz, NPV, IRR hesaplama araçları sunar.
          </p>
        </div>
      </section>

      {/* ── Canlı fiyat kartları (client, animasyonlu) ── */}
      <HeroSection />

      <div className="mx-auto max-w-7xl space-y-12 px-4 py-8 lg:px-8 pb-20 md:pb-8">
        <section aria-labelledby="borsa-section">
          <h2 id="borsa-section" className="sr-only">Borsa İstanbul Anlık Verileri</h2>
          <BorsaOzetSection />
          <AdBanner page="landing" position="top" slotIndex={1} />
        </section>
        <section aria-labelledby="altin-section">
          <h2 id="altin-section" className="sr-only">Altın Fiyatları</h2>
          <AltinSection />
        </section>
        <section aria-labelledby="araclar-section">
          <h2 id="araclar-section" className="sr-only">Finansal Hesaplama Araçları</h2>
          <AraclarSection />
        </section>
        <section aria-labelledby="blog-section">
          <h2 id="blog-section" className="sr-only">Finans Bilgi Merkezi</h2>
          <BlogSection />
          <AdBanner page="landing" position="bottom" slotIndex={2} />
        </section>
      </div>

      {/* ── SEO için ek içerik (görünür, anahtar kelime zengin) ── */}
      <section className="border-t border-border bg-card/50">
        <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
          <h2 className="text-xl font-semibold mb-4">Finansal Piyasalar Tek Platformda</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-muted-foreground">
            <div>
              <h3 className="font-semibold text-foreground mb-2">Altın Piyasası</h3>
              <ul className="space-y-1">
                <li><Link href="/altin/gram-altin" className="hover:text-primary">Gram altın fiyatı</Link></li>
                <li><Link href="/altin/ceyrek-altin" className="hover:text-primary">Çeyrek altın</Link></li>
                <li><Link href="/altin/yarim-altin" className="hover:text-primary">Yarım altın</Link></li>
                <li><Link href="/altin/tam-altin" className="hover:text-primary">Tam altın</Link></li>
                <li><Link href="/altin/cumhuriyet-altini" className="hover:text-primary">Cumhuriyet altını</Link></li>
                <li><Link href="/altin/ata-altin" className="hover:text-primary">Ata altın</Link></li>
                <li><Link href="/altin/ons-altin" className="hover:text-primary">Ons altın</Link></li>
                <li><Link href="/altin/bilezik" className="hover:text-primary">Altın bilezik</Link></li>
                <li><Link href="/altin/gumus" className="hover:text-primary">Gümüş</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">Borsa İstanbul</h3>
              <ul className="space-y-1">
                <li><Link href="/borsa" className="hover:text-primary">BIST anlık veriler</Link></li>
                <li><Link href="/borsa?tab=hisseler" className="hover:text-primary">Hisse senetleri</Link></li>
                <li><Link href="/borsa?tab=endeksler" className="hover:text-primary">Borsa endeksleri</Link></li>
                <li><Link href="/borsa/hisseler/THYAO" className="hover:text-primary">THYAO hissesi</Link></li>
                <li><Link href="/borsa/hisseler/GARAN" className="hover:text-primary">Garanti BBVA</Link></li>
                <li><Link href="/borsa/hisseler/AKBNK" className="hover:text-primary">Akbank hissesi</Link></li>
                <li><Link href="/borsa/hisseler/EREGL" className="hover:text-primary">Ereğli Demir Çelik</Link></li>
                <li><Link href="/borsa/hisseler/TUPRS" className="hover:text-primary">Tüpraş</Link></li>
                <li><Link href="/borsa/endeksler/XU100" className="hover:text-primary">BIST 100</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">Döviz Kurları</h3>
              <ul className="space-y-1">
                <li><Link href="/doviz" className="hover:text-primary">Döviz kurları</Link></li>
                <li><Link href="/doviz/dolar" className="hover:text-primary">Dolar kuru</Link></li>
                <li><Link href="/doviz/euro" className="hover:text-primary">Euro kuru</Link></li>
                <li><Link href="/doviz/sterlin" className="hover:text-primary">Sterlin</Link></li>
                <li><Link href="/doviz/frang" className="hover:text-primary">İsviçre Frangı</Link></li>
                <li><Link href="/doviz/yen" className="hover:text-primary">Japon Yeni</Link></li>
                <li><Link href="/doviz/yuan" className="hover:text-primary">Çin Yuanı</Link></li>
                <li><Link href="/doviz/ruble" className="hover:text-primary">Rus Rublesi</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">Hesaplama Araçları</h3>
              <ul className="space-y-1">
                <li><Link href="/araclar/ihtiyac-kredisi" className="hover:text-primary">İhtiyaç kredisi</Link></li>
                <li><Link href="/araclar/konut-kredisi" className="hover:text-primary">Konut kredisi</Link></li>
                <li><Link href="/araclar/vadeli-mevduat" className="hover:text-primary">Vadeli mevduat</Link></li>
                <li><Link href="/araclar/reel-getiri" className="hover:text-primary">Reel getiri</Link></li>
                <li><Link href="/araclar/enflasyon-hesaplama" className="hover:text-primary">Enflasyon</Link></li>
                <li><Link href="/araclar/faiz-hesaplama" className="hover:text-primary">Faiz hesaplama</Link></li>
                <li><Link href="/araclar/doviz-hesaplama" className="hover:text-primary">Döviz çeviri</Link></li>
                <li><Link href="/araclar/altin-hesaplama" className="hover:text-primary">Altın çeviri</Link></li>
                <li><Link href="/araclar" className="hover:text-primary font-semibold">Tüm araçlar →</Link></li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
