'use client';

import { useAuthStore } from '@/stores/auth.store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Heart, Star, BarChart3, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function HesabimPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div>
      <h1 className="text-2xl font-bold">Hoş Geldiniz{user ? `, ${user.firstName}` : ''} 👋</h1>
      <p className="mt-1 text-sm text-muted-foreground">Hesap özetinize göz atın</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link href="/hesabim/favoriler">
          <Card className="cursor-pointer transition-colors hover:border-primary/30">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-danger" />
                <CardTitle>Favorilerim</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Favori hisse ve altınlarınızı takip edin</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/araclar">
          <Card className="cursor-pointer transition-colors hover:border-primary/30">
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <CardTitle>Araçlar</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Finansal hesaplama araçlarını kullanın</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/hesabim/ayarlar">
          <Card className="cursor-pointer transition-colors hover:border-primary/30">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-primary" />
                <CardTitle>Ayarlar</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Profil ve güvenlik ayarlarınızı yönetin</p>
            </CardContent>
          </Card>
        </Link>

        {user?.role === 'admin' && (
          <Link href="/admin">
            <Card className="cursor-pointer border-primary/20 bg-primary/5 transition-colors hover:border-primary/40">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  <CardTitle>Admin Panel</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Site yönetimi, bilgi merkezi, reklam ve kullanıcı işlemleri</p>
              </CardContent>
            </Card>
          </Link>
        )}
      </div>
    </div>
  );
}
