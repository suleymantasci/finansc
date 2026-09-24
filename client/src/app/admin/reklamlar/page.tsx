'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { Plus, Trash2 } from 'lucide-react';
import type { AdSlotConfig } from '@/types';

const PAGES = ['anasayfa', 'altin', 'borsa', 'borsa-hisseler', 'blog', 'blog-detail', 'araclar'];
const POSITIONS = ['top', 'middle', 'bottom', 'sidebar'];

export default function AdminReklamlarPage() {
  const [slots, setSlots] = useState<AdSlotConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newPage, setNewPage] = useState(PAGES[0]);
  const [newPosition, setNewPosition] = useState(POSITIONS[0]);

  const fetchSlots = () => {
    setLoading(true);
    api.get<AdSlotConfig[]>('/api/ads')
      .then(setSlots)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchSlots(); }, []);

  const toggleSlot = async (slot: AdSlotConfig) => {
    await api.patch(`/api/ads/${slot.id}`, { isActive: !slot.isActive });
    setSlots((prev) => prev.map((s) => s.id === slot.id ? { ...s, isActive: !s.isActive } : s));
  };

  const createSlot = async () => {
    await api.post('/api/ads', { page: newPage, position: newPosition });
    setShowForm(false);
    fetchSlots();
  };

  const deleteSlot = async (id: string) => {
    if (!confirm('Bu slotu silmek istediğinize emin misiniz?')) return;
    await api.delete(`/api/ads/${id}`);
    fetchSlots();
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-balance text-4xl text-foreground sm:text-5xl">Reklam Yönetimi</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sayfa bazlı reklam slotlarını yönetin</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} size="sm">
          <Plus className="mr-1 h-4 w-4" /> Yeni Slot
        </Button>
      </div>

      {showForm && (
        <div className="mt-4 flex flex-wrap items-end gap-3 atlas-card p-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Sayfa</label>
            <select value={newPage} onChange={(e) => setNewPage(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
              {PAGES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Pozisyon</label>
            <select value={newPosition} onChange={(e) => setNewPosition(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
              {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <Button onClick={createSlot} size="sm">Oluştur</Button>
        </div>
      )}

      <div className="mt-6">
        {loading ? (
          <SkeletonTable rows={8} cols={4} />
        ) : slots.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Henüz reklam slotu tanımlanmamış. Yukarıdaki butonla yeni slot ekleyin.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-elevated">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Sayfa</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Pozisyon</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">Durum</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {slots.map((slot) => (
                  <tr key={slot.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium">{slot.page}</td>
                    <td className="px-4 py-3 text-muted-foreground">{slot.position}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={slot.isActive ? 'success' : 'secondary'}>
                        {slot.isActive ? 'Aktif' : 'Pasif'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => toggleSlot(slot)} className="text-sm text-primary hover:underline">
                          {slot.isActive ? 'Kapat' : 'Aç'}
                        </button>
                        <button onClick={() => deleteSlot(slot.id)} className="text-muted-foreground hover:text-down">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
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
