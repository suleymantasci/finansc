import fs from 'node:fs';
import path from 'node:path';
import { getImageProps } from 'next/image';
import { HeroSearch, QuickChips } from '@/components/search/CommandSearch';
import { cn } from '@/lib/utils';
import { BORSA_ENABLED } from '@/lib/features';

/**
 * Hero — H1 hem anahtar kelimeyi (SEO) hem editoryal sloganı taşır.
 * Sağdaki sanat alanı: public/atlas/hero.webp varsa o, yoksa SVG kompozisyon.
 */

const HERO_IMAGE = '/atlas/hero.webp';
const HERO_IMAGE_LIGHT = '/atlas/hero-light.webp';

function publicFileExists(file: string): boolean {
  try {
    return fs.existsSync(path.join(process.cwd(), 'public', file));
  } catch {
    return false;
  }
}

function HeroArt() {
  // Yükselen piyasa: mumlar + altın eğri + ışık halkası
  const candles = [
    [40, 62, 58, 70], [52, 60, 54, 66], [64, 54, 50, 60], [76, 57, 52, 64], [88, 50, 44, 56],
    [100, 46, 42, 53], [112, 49, 44, 55], [124, 41, 36, 47], [136, 38, 32, 44], [148, 42, 36, 47],
    [160, 33, 28, 39], [172, 29, 24, 35], [184, 31, 26, 36], [196, 24, 19, 30], [208, 20, 15, 26],
  ];
  return (
    <svg viewBox="0 0 240 100" className="h-full w-full" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id="hero-glow" cx="70%" cy="35%" r="60%">
          <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.35" />
          <stop offset="60%" stopColor="var(--color-primary)" stopOpacity="0.05" />
          <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="hero-line" x1="0" x2="1">
          <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0" />
          <stop offset="40%" stopColor="var(--color-primary)" stopOpacity="0.6" />
          <stop offset="100%" stopColor="var(--color-gold-soft)" />
        </linearGradient>
        <pattern id="hero-grid" width="12" height="12" patternUnits="userSpaceOnUse">
          <path d="M12 0H0V12" fill="none" stroke="var(--color-border)" strokeWidth="0.25" />
        </pattern>
      </defs>
      <rect width="240" height="100" fill="url(#hero-grid)" opacity="0.7" />
      <rect width="240" height="100" fill="url(#hero-glow)" />
      <circle cx="176" cy="34" r="30" fill="none" stroke="var(--color-primary)" strokeOpacity="0.25" strokeWidth="0.3" />
      <circle cx="176" cy="34" r="42" fill="none" stroke="var(--color-primary)" strokeOpacity="0.12" strokeWidth="0.3" strokeDasharray="1 2" />
      {candles.map(([x, o, h, l], i) => {
        const up = i % 4 !== 2;
        const c = up ? o - 5 : o + 3;
        return (
          <g key={x} opacity={0.35 + i * 0.04}>
            <line x1={x} x2={x} y1={h - 3} y2={l + 3} stroke={up ? 'var(--color-up)' : 'var(--color-down)'} strokeWidth="0.4" />
            <rect x={x - 2} y={Math.min(o, c)} width="4" height={Math.abs(o - c)} fill={up ? 'var(--color-up)' : 'var(--color-down)'} rx="0.4" />
          </g>
        );
      })}
      <path
        d="M0,88 C30,84 40,74 60,72 S95,62 110,55 S150,40 170,30 S210,14 240,8"
        fill="none"
        stroke="url(#hero-line)"
        strokeWidth="1.1"
      />
      <circle cx="208" cy="16.5" r="1.8" fill="var(--color-gold-soft)" />
      <circle cx="208" cy="16.5" r="4" fill="none" stroke="var(--color-gold-soft)" strokeOpacity="0.5" strokeWidth="0.4" />
    </svg>
  );
}

// 1x1 saydam GIF: mobilde <img> bunu yükler, gerçek görsel yalnızca lg+ <source> ile gelir
const BLANK = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

function HeroPicture({ src, className }: { src: string; className?: string }) {
  const { props } = getImageProps({ src, alt: '', fill: true, sizes: '60vw', quality: 75 });
  return (
    <picture>
      <source media="(min-width: 1024px)" srcSet={props.srcSet} sizes="60vw" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={BLANK} alt="" fetchPriority="high" decoding="async" className={cn('absolute inset-0 h-full w-full', className)} />
    </picture>
  );
}

export function AtlasHero() {
  const hasImage = publicFileExists(HERO_IMAGE);
  // Açık tema görseli yoksa koyu görsel iki temada da kullanılır
  const hasLight = hasImage && publicFileExists(HERO_IMAGE_LIGHT);

  return (
    <section aria-labelledby="hero-title" className="relative z-10 border-b border-border">
      {/* Sanat alanı — büyük ekranda sağ yarı, küçükte arka plan */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden lg:left-[42%]" aria-hidden="true">
        {hasImage ? (
          <>
            {/* Görsel yalnızca lg+ yüklenir: mobilde metnin arkasında degrade altında kalıyor ama
                750px indirilip LCP'yi ~8 sn'ye çekiyordu (PSI). Mobilde yerine hafif CSS ışıltısı. */}
            <HeroPicture src={HERO_IMAGE} className={cn('object-cover object-right opacity-90', hasLight && 'theme-dark-only')} />
            {hasLight && <HeroPicture src={HERO_IMAGE_LIGHT} className="theme-light-only object-cover object-right" />}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_85%_15%,color-mix(in_srgb,var(--color-primary)_22%,transparent),transparent_60%)] lg:hidden" />
          </>
        ) : (
          <HeroArt />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent lg:via-background/20" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </div>

      <div className="relative mx-auto max-w-[1440px] px-4 pb-14 pt-12 sm:pt-16 lg:px-8 lg:pb-20 lg:pt-24">
        <div className="max-w-4xl">
          <h1 id="hero-title">
            <span className="eyebrow block text-primary">
              {BORSA_ENABLED ? 'Canlı altın, döviz, borsa & 40+ hesaplama aracı' : 'Canlı altın, döviz & 40+ hesaplama aracı'}
            </span>
            <span className="font-display mt-5 block text-[2.6rem] leading-[1.05] text-foreground sm:text-6xl lg:text-[4.75rem]">
              Tüm finansal cevaplar,{' '}
              <span className="text-primary sm:block">tek bir arama uzağında.</span>
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {BORSA_ENABLED
              ? 'Gram altından dolara, BIST hisselerinden kredi ve maaş hesaplamaya — aradığınızı yazın, doğrudan oraya gidin.'
              : 'Gram altından dolara, emtiadan kredi ve maaş hesaplamaya — aradığınızı yazın, doğrudan oraya gidin.'}
          </p>

          <div className="mt-8 max-w-2xl">
            <HeroSearch />
            <QuickChips className="mt-4" />
          </div>
        </div>

        <p
          className={cn(
            'eyebrow absolute right-8 top-10 hidden text-right leading-relaxed lg:block',
            // Tek (koyu) görsel varsa yazı her temada görselin üstünde — açık renk kalmalı
            hasImage && !hasLight ? 'text-[#ece8df]/80' : 'text-foreground/70',
          )}
        >
          Piyasalar hareket eder.
          <br />
          Siz önde kalın.
          <span className="mt-3 ml-auto block h-px w-10 bg-primary" aria-hidden="true" />
        </p>
      </div>
    </section>
  );
}
