'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { SkeletonTable } from '@/components/ui/Skeleton';
import type { AuthUser } from '@/types';

export default function AdminKullanicilarPage() {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ data: AuthUser[] }>('/api/admin/users')
      .then((res) => setUsers(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold">Kullanıcılar</h1>
      <p className="mt-1 text-sm text-muted-foreground">Kayıtlı kullanıcıların listesi (salt okunur)</p>

      <div className="mt-6">
        {loading ? (
          <SkeletonTable rows={10} cols={5} />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Ad Soyad</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">E-posta</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">Rol</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">Durum</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Kayıt Tarihi</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium">{user.firstName} {user.lastName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={user.role === 'admin' ? 'default' : 'outline'}>
                        {user.role === 'admin' ? 'Admin' : 'Kullanıcı'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={user.isActive ? 'success' : 'danger'}>
                        {user.isActive ? 'Aktif' : 'Pasif'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString('tr-TR') : '—'}
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
