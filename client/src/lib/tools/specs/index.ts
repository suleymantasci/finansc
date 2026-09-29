// Sunucu tarafı: tüm araç tanımları (SSS, açıklama metni, JSON-LD için).

import type { ToolSpec } from '../types';
import { TOOL_CATALOG } from '../catalog';
import { SPEC_MODULE_OF } from './modules';
import { specs as maas } from './maas';
import { specs as emeklilik } from './emeklilik';
import { specs as vergi } from './vergi';
import { specs as krediFaiz } from './kredi-faiz';
import { specs as yatirimEmlak } from './yatirim-emlak';
import { specs as ticaretGunluk } from './ticaret-gunluk';

export const ALL_SPECS: Record<string, ToolSpec> = { ...maas, ...emeklilik, ...vergi, ...krediFaiz, ...yatirimEmlak, ...ticaretGunluk };

/** Katalog, tanımlar ve modül haritası birbirini tutmazsa derlemeyi durdurur. */
export function assertSpecRegistry(): void {
  const problems: string[] = [];
  for (const e of TOOL_CATALOG) {
    if (e.generic && !ALL_SPECS[e.slug]) problems.push(`tanımı yok: ${e.slug}`);
    if (e.generic && !SPEC_MODULE_OF[e.slug]) problems.push(`modül haritasında yok: ${e.slug}`);
  }
  for (const slug of Object.keys(ALL_SPECS)) {
    if (!TOOL_CATALOG.some((e) => e.slug === slug && e.generic)) problems.push(`katalogda generic değil: ${slug}`);
    if (ALL_SPECS[slug].slug !== slug) problems.push(`slug uyuşmuyor: ${slug}`);
  }
  const slugs = TOOL_CATALOG.map((e) => e.slug);
  const dup = slugs.filter((s, i) => slugs.indexOf(s) !== i);
  if (dup.length) problems.push(`tekrar eden slug: ${dup.join(', ')}`);
  if (problems.length) throw new Error(`Araç kaydı tutarsız:\n${problems.join('\n')}`);
}
