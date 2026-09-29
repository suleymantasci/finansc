'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { SkeletonTable } from '@/components/ui/Skeleton';
import type { Tool } from '@/types';
import { TOOL_CATALOG, TOOL_GROUPS } from '@/lib/tools/catalog';

// Frontend'de tanımlı tüm araçlar — katalogdan (lib/tools/catalog.ts). Senkron, eksikleri DB'ye ekler.
const CATEGORY_OF = Object.fromEntries(TOOL_GROUPS.map((g) => [g.id, g.category]));
const ALL_FRONTEND_TOOLS: { slug: string; title: string; category: string }[] = TOOL_CATALOG.map((t) => ({
  slug: t.slug,
  title: t.short,
  category: CATEGORY_OF[t.group],
}));

export default function AdminAraclarPage() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        // Önce frontend slug'larını DB ile senkronize et
        const syncResult = await api.post<{ created: number; existing: number }>('/api/tools/sync', {
          items: ALL_FRONTEND_TOOLS,
        });
        if (syncResult.created > 0) {
          setSyncMsg(`${syncResult.created} yeni araç eklendi`);
          setTimeout(() => setSyncMsg(null), 4000);
        }
      } catch { /* sync failed, continue with existing data */ }

      try {
        const data = await api.get<Tool[]>('/api/tools');
        setTools(data);
      } catch { /* */ }
      setLoading(false);
    })();
  }, []);

  const toggleVisibility = async (tool: Tool) => {
    await api.patch(`/api/tools/${tool.id}`, { isActive: !tool.isActive });
    setTools((prev) => prev.map((t) => t.id === tool.id ? { ...t, isActive: !t.isActive } : t));
  };

  return (
    <div>
      <h1 className="font-display text-balance text-4xl text-foreground sm:text-5xl">Araç Yönetimi</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Hesaplama araçlarının görünürlüğünü yönetin.
        Yeni araçlar frontend&apos;e eklendiğinde otomatik senkronize edilir.
      </p>

      {syncMsg && (
        <div className="mt-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 px-4 py-2 text-sm text-emerald-700 dark:text-emerald-400">
          ✓ {syncMsg}
        </div>
      )}

      <div className="mt-6">
        {loading ? (
          <SkeletonTable rows={8} cols={3} />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-elevated">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Araç</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Slug</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">Durum</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {tools.map((tool) => (
                  <tr key={tool.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium">{tool.title}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground num">{tool.slug}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={tool.isActive ? 'success' : 'secondary'}>
                        {tool.isActive ? 'Aktif' : 'Pasif'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => toggleVisibility(tool)}
                        className="text-sm text-primary hover:underline"
                      >
                        {tool.isActive ? 'Gizle' : 'Göster'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
