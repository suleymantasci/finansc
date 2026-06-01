'use client';

import { useEffect, useState, useCallback } from 'react';
import { AlertTriangle, CheckCircle, Clock, Eye } from 'lucide-react';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

interface Report {
  id: string;
  type: 'tool' | 'blog';
  slug: string;
  pageTitle: string;
  message: string | null;
  status: 'pending' | 'reviewed' | 'resolved';
  createdAt: string;
}

const STATUS_MAP = {
  pending: { label: 'Beklemede', icon: Clock, color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400' },
  reviewed: { label: 'İncelendi', icon: Eye, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400' },
  resolved: { label: 'Çözüldü', icon: CheckCircle, color: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400' },
};

const NEXT_STATUS: Record<string, string> = {
  pending: 'reviewed',
  reviewed: 'resolved',
  resolved: 'pending',
};

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = useCallback(async () => {
    try {
      const data = await api.get<Report[]>('/api/reports');
      setReports(data);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const handleStatusChange = async (report: Report) => {
    const nextStatus = NEXT_STATUS[report.status];
    try {
      await api.patch(`/api/reports/${report.id}/status`, { status: nextStatus });
      setReports((prev) =>
        prev.map((r) => (r.id === report.id ? { ...r, status: nextStatus as Report['status'] } : r)),
      );
    } catch { /* ignore */ }
  };

  const pendingCount = reports.filter((r) => r.status === 'pending').length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Hata Bildirimleri</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Kullanıcılardan gelen hata bildirimleri
          {pendingCount > 0 && (
            <span className="ml-2 inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
              {pendingCount} beklemede
            </span>
          )}
        </p>
      </div>

      {loading ? (
        <p className="py-12 text-center text-muted-foreground">Yükleniyor...</p>
      ) : reports.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">Henüz bildirim bulunmuyor.</p>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => {
            const statusInfo = STATUS_MAP[report.status];
            const StatusIcon = statusInfo.icon;
            return (
              <div
                key={report.id}
                className="rounded-xl border border-border bg-card p-4 transition-colors"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={report.type === 'tool' ? 'default' : 'secondary'}>
                        {report.type === 'tool' ? 'Araç' : 'Yazı'}
                      </Badge>
                      <span className="text-sm font-semibold">{report.pageTitle}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      /{report.type === 'tool' ? 'araclar' : 'blog'}/{report.slug}
                    </p>
                    {report.message && (
                      <p className="mt-2 text-sm text-foreground">{report.message}</p>
                    )}
                    <p className="mt-2 text-xs text-muted-foreground">
                      {new Date(report.createdAt).toLocaleDateString('tr-TR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <button
                    onClick={() => handleStatusChange(report)}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-opacity hover:opacity-80',
                      statusInfo.color,
                    )}
                    title="Durumu değiştirmek için tıklayın"
                  >
                    <StatusIcon className="h-3.5 w-3.5" />
                    {statusInfo.label}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
