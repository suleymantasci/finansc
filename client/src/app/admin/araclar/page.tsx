'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { SkeletonTable } from '@/components/ui/Skeleton';
import type { Tool } from '@/types';

// Frontend'de tanımlı tüm araçlar — slug + title + category
// Bu liste ToolClient TOOL_MAP ve page.tsx TOOL_META ile uyumlu olmalı.
const ALL_FRONTEND_TOOLS: { slug: string; title: string; category: string }[] = [
  // Maaş & Bordro
  { slug: 'maas-hesaplama', title: 'Maaş Hesaplama', category: 'vergi' },
  // Kredi
  { slug: 'ihtiyac-kredisi', title: 'İhtiyaç Kredisi', category: 'kredi' },
  { slug: 'konut-kredisi', title: 'Konut Kredisi', category: 'kredi' },
  { slug: 'tasit-kredisi', title: 'Taşıt Kredisi', category: 'kredi' },
  { slug: 'is-yeri-kredisi', title: 'İş Yeri Kredisi', category: 'kredi' },
  { slug: 'ticari-kredi', title: 'Ticari Kredi', category: 'kredi' },
  { slug: 'ticari-ihtiyac-kredisi', title: 'Ticari İhtiyaç Kredisi', category: 'kredi' },
  { slug: 'ticari-arac-kredisi', title: 'Ticari Araç Kredisi', category: 'kredi' },
  { slug: 'kredi-hesaplama', title: 'Kredi Hesaplama', category: 'kredi' },
  { slug: 'ne-kadar-kredi-alabilirim', title: 'Ne Kadar Kredi Alabilirim?', category: 'kredi' },
  { slug: 'kredi-dosya-masrafi', title: 'Kredi Dosya Masrafı', category: 'kredi' },
  { slug: 'kredi-erken-kapatma', title: 'Kredi Erken Kapatma', category: 'kredi' },
  { slug: 'kredi-gecikme-faizi', title: 'Kredi Gecikme Faizi', category: 'kredi' },
  { slug: 'kredi-yapilandirma', title: 'Kredi Yapılandırma', category: 'kredi' },
  { slug: 'kredi-yillik-maliyet-orani', title: 'Yıllık Maliyet Oranı', category: 'kredi' },
  { slug: 'kredi-karti-asgari-odeme', title: 'Asgari Ödeme', category: 'kredi' },
  { slug: 'kredi-karti-ek-taksit', title: 'Ek Taksit', category: 'kredi' },
  { slug: 'kredi-karti-gecikme-faizi', title: 'Kart Gecikme Faizi', category: 'kredi' },
  { slug: 'kredi-karti-islem-taksitlendirme', title: 'İşlem Taksitlendirme', category: 'kredi' },
  { slug: 'kredi-karti-taksitli-nakit-avans', title: 'Nakit Avans', category: 'kredi' },
  // Finans
  { slug: 'altin-hesaplama', title: 'Altın Hesaplama', category: 'yatirim' },
  { slug: 'doviz-hesaplama', title: 'Döviz Hesaplama', category: 'yatirim' },
  { slug: 'faiz-hesaplama', title: 'Faiz Hesaplama', category: 'yatirim' },
  { slug: 'vadeli-mevduat', title: 'Vadeli Mevduat', category: 'tasarruf' },
  { slug: 'bono-hesaplama', title: 'Bono Hesaplama', category: 'yatirim' },
  { slug: 'tahvil-hesaplama', title: 'Tahvil Hesaplama', category: 'yatirim' },
  { slug: 'repo-hesaplama', title: 'Repo Hesaplama', category: 'yatirim' },
  { slug: 'eurobond-hesaplama', title: 'Eurobond Hesaplama', category: 'yatirim' },
  { slug: 'birikim-hesaplama', title: 'Birikim Hesaplama', category: 'tasarruf' },
  { slug: 'enflasyon-hesaplama', title: 'Enflasyon Hesaplama', category: 'diger' },
  { slug: 'bilesik-buyume', title: 'Bileşik Büyüme (CAGR)', category: 'yatirim' },
  { slug: 'reel-getiri', title: 'Reel Getiri', category: 'yatirim' },
  { slug: 'kira-artis-orani', title: 'Kira Artış Oranı', category: 'diger' },
  { slug: 'parasal-deger', title: 'Parasal Değer', category: 'diger' },
  { slug: 'net-bugunku-deger', title: 'Net Bugünkü Değer (NPV)', category: 'yatirim' },
  { slug: 'ic-verim-orani', title: 'İç Verim Oranı (IRR)', category: 'yatirim' },
  { slug: 'ic-dis-iskonto', title: 'İç ve Dış İskonto', category: 'yatirim' },
  { slug: 'ortalama-vade', title: 'Ortalama Vade', category: 'yatirim' },
  { slug: 'vadeli-islem-fiyati', title: 'Vadeli İşlem Fiyatı', category: 'yatirim' },
  { slug: 'sermaye-temettu', title: 'Sermaye ve Temettü', category: 'yatirim' },
  { slug: 'gecmis-altin-fiyatlari', title: 'Geçmiş Altın Fiyatları', category: 'yatirim' },
  { slug: 'gecmis-doviz-kurlari', title: 'Geçmiş Döviz Kurları', category: 'yatirim' },
  { slug: 'iban-dogrulama', title: 'IBAN Doğrulama', category: 'diger' },
];

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
      <h1 className="text-2xl font-bold">Araç Yönetimi</h1>
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
                <tr className="border-b border-border bg-muted">
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
