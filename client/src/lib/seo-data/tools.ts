import { TOOL_CATALOG } from '@/lib/tools/catalog';

export interface ToolMeta {
  title: string;
  desc: string;
}

// Başlık ve açıklamalar tek kaynaktan (lib/tools/catalog.ts) gelir.
export const TOOL_META: Record<string, ToolMeta> = Object.fromEntries(
  TOOL_CATALOG.map((t) => [t.slug, { title: t.title, desc: t.desc }]),
);
