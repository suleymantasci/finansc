'use client';

import { specs } from '@/lib/tools/specs/kredi-faiz';
import { GenericTool } from './GenericTool';

export default function Group({ slug, title, today }: { slug: string; title: string; today: string }) {
  return <GenericTool spec={specs[slug]} title={title} today={today} />;
}
