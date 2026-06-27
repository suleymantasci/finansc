import { AdBanner } from '@/components/ads/AdBanner';
import { AdInFeed } from '@/components/ads/AdInFeed';

/**
 * Server-side ad slot wrapper.
 * Ad components are 'use client' but they don't break server rendering —
 * they render empty/placeholder HTML on the server, then hydrate to the
 * real ad creative client-side. This preserves SEO cleanliness.
 *
 * `position` mirrors the original BlogListClient layout:
 *   - position >= 3 → render an in-feed ad as the 4th grid item
 *   - position === -1 → bottom banner ad
 */
export function BlogListAdSlot({ position }: { position: number }) {
  if (position >= 3) {
    return <AdInFeed page="blog" />;
  }
  if (position === -1) {
    return <AdBanner page="blog" position="bottom" />;
  }
  return null;
}