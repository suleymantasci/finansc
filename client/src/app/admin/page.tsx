'use client';

import { useEffect, useState } from 'react';
import { Users, FileText, Eye, TrendingUp } from 'lucide-react';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

interface Stats {
  totalUsers: number;
  totalPosts: number;
  totalViews: number;
  activeToday: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    api.get<Stats>('/api/admin/stats').then(setStats).catch(() => {});
  }, []);

  const cards = [
    { label: 'Toplam Kullanıcı', value: stats?.totalUsers ?? '—', icon: Users, color: 'text-blue-500' },
    { label: 'Bilgi Merkezi', value: stats?.totalPosts ?? '—', icon: FileText, color: 'text-primary' },
    { label: 'Toplam Görüntüleme', value: stats?.totalViews ?? '—', icon: Eye, color: 'text-emerald-500' },
    { label: 'Bugün Aktif', value: stats?.activeToday ?? '—', icon: TrendingUp, color: 'text-purple-500' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="mt-1 text-sm text-muted-foreground">Genel site istatistikleri</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.label}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
                  <Icon className={`h-5 w-5 ${c.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{c.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
