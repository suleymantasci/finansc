'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { SkeletonTable } from '@/components/ui/Skeleton';
import type { Tool } from '@/types';

export default function AdminAraclarPage() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Tool[]>('/api/tools')
      .then(setTools)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggleVisibility = async (tool: Tool) => {
    await api.patch(`/api/tools/${tool.id}`, { isActive: !tool.isActive });
    setTools((prev) => prev.map((t) => t.id === tool.id ? { ...t, isActive: !t.isActive } : t));
  };

  return (
    <div>
      <h1 className="text-2xl font-bold">Araç Yönetimi</h1>
      <p className="mt-1 text-sm text-muted-foreground">Hesaplama araçlarının görünürlüğünü yönetin</p>

      <div className="mt-6">
        {loading ? (
          <SkeletonTable rows={8} cols={3} />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Araç</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">Durum</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {tools.map((tool) => (
                  <tr key={tool.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium">{tool.title}</td>
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
