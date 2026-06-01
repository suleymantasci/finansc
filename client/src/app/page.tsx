import { HeroSection } from './_landing/HeroSection';
import { BorsaOzetSection } from './_landing/BorsaOzetSection';
import { AltinSection } from './_landing/AltinSection';
import { AraclarSection } from './_landing/AraclarSection';
import { BlogSection } from './_landing/BlogSection';
import { AdBanner } from '@/components/ads/AdBanner';

export default function Home() {
  return (
    <>
      <HeroSection />
      <div className="mx-auto max-w-7xl space-y-12 px-4 py-8 lg:px-8 pb-20 md:pb-8">
        <section>
          <BorsaOzetSection />
          <AdBanner page="landing" position="top" slotIndex={1} />
        </section>
        <section>
          <AltinSection />
        </section>
        <section>
          <AraclarSection />
        </section>
        <section>
          <BlogSection />
          <AdBanner page="landing" position="bottom" slotIndex={2} />
        </section>
      </div>
    </>
  );
}
