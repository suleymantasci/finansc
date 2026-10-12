import type { Metadata } from 'next';
import { SITE_NAME } from '@/lib/constants';

/** Google arama sonucunda kesilmeden görünen yaklaşık üst sınır (karakter) */
export const TITLE_MAX = 60;
const SUFFIX = ` | ${SITE_NAME}`;

/**
 * Adaylardan, layout'un " | SITE_NAME" ekiyle birlikte TITLE_MAX'a sığan ilkini seçer.
 * Hiçbiri ekle sığmıyorsa eksiz (absolute) sığan ilk aday; o da yoksa son aday eksiz kullanılır.
 * `text` OG/Twitter başlığı için düz metindir.
 */
export function fitTitle(...candidates: string[]): { title: Metadata['title']; text: string } {
  const withSuffix = candidates.find((c) => c.length + SUFFIX.length <= TITLE_MAX);
  if (withSuffix) return { title: withSuffix, text: withSuffix };
  const bare = candidates.find((c) => c.length <= TITLE_MAX) ?? candidates[candidates.length - 1];
  return { title: { absolute: bare }, text: bare };
}

/** Meta açıklamayı Google'ın kestiği uzunluğa (~160) kelime sınırında kısaltır */
export function fitDescription(text: string | null | undefined, max = 160): string | undefined {
  const t = text?.replace(/\s+/g, ' ').trim();
  if (!t) return undefined;
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), max - 30)).replace(/[\s,.;:—-]+$/, '')}…`;
}
