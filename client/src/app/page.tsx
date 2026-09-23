import { AtlasHero } from './_landing/AtlasHero';
import { MarketBento } from './_landing/MarketBento';
import { ToolBento } from './_landing/ToolBento';
import { MoversSection } from './_landing/MoversSection';
import { PriceBoards } from './_landing/PriceBoards';
import { LearnSection } from './_landing/LearnSection';
import { DirectorySection } from './_landing/DirectorySection';
import { AdBanner } from '@/components/ads/AdBanner';

/**
 * Ana sayfa — "Finansal Atlas"
 * Sıra: arama → canlı piyasa → araçlar → hareket edenler → fiyat panoları →
 * bilgi merkezi → hızlı erişim + SSS. Her bölüm kendi sayfasına tek tıkla bağlanır.
 */
export default function Home() {
  return (
    <>
      <AtlasHero />

      <div className="space-y-4 pt-6 lg:pt-8">
        <MarketBento />
        <ToolBento />
      </div>

      <div className="mx-auto max-w-[1440px] px-4 lg:px-8">
        <AdBanner page="landing" position="top" slotIndex={1} />
      </div>

      <div className="space-y-16 py-12 pb-24 md:pb-16 lg:space-y-20 lg:py-16">
        <MoversSection />
        <PriceBoards />
        <LearnSection />
        <div className="mx-auto max-w-[1440px] px-4 lg:px-8">
          <AdBanner page="landing" position="bottom" slotIndex={2} />
        </div>
        <DirectorySection />
      </div>
    </>
  );
}
