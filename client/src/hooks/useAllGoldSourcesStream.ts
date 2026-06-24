'use client';

import { useEffect, useRef } from 'react';
import { API_URL, GOLD_SOURCES, SSE_RECONNECT_DELAY } from '@/lib/constants';
import { useMarketStore } from '@/stores/market.store';
import type { GoldStreamData } from '@/stores/market.store';

/**
 * Tüm GOLD_SOURCES için /api/market/gold/stream/:source SSE bağlantısı açar.
 * Her kaynaktan gelen mesaj `updateFromGoldStream` üzerinden store'a yazılır.
 * Unmount'ta tüm EventSource'lar kapatılır; hata olursa SSE_RECONNECT_DELAY
 * sonra yeniden bağlanır.
 *
 * Davranış:
 * - 6 ayrı upstream bağlantısı açar; backend `ensureGoldSSEForSource` paylaşımlı
 *   ReplaySubject kullandığı için backend upstream bağlantı sayısı artmaz.
 * - 204/boş veri: backend SSE hata event'i gönderir → onerror → reconnect.
 *   Bu sırada store'da o source için kart görünmez (mevcut davranışla aynı).
 *
 * Pit notu: Hook kuralları — kaynak listesi GOLD_SOURCES sabit, dependency [].
 * updateFromGoldStream zustand selector döndürür, referansı stabil.
 */
export function useAllGoldSourcesStream() {
  const updateFromGoldStream = useMarketStore((s) => s.updateFromGoldStream);
  const sourcesRef = useRef<Array<{ key: string; es: EventSource | null }>>([]);

  useEffect(() => {
    // İlk mount'ta tüm kaynaklar için EventSource aç
    sourcesRef.current = GOLD_SOURCES.map((src) => {
      let es: EventSource | null = null;
      try {
        es = new EventSource(`${API_URL}/api/market/gold/stream/${src.key}`);
      } catch {
        // Constructor hatası (invalid URL vb.) → bu kaynak için bağlantı kurulamadı
        return { key: src.key, es: null };
      }

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as GoldStreamData;
          if (data.type === 'prices') {
            updateFromGoldStream(data);
          }
        } catch {
          // parse hatası → yoksay
        }
      };

      es.onerror = () => {
        // 204/boş stream veya network hatası: kapat, SSE_RECONNECT_DELAY sonra yeniden aç
        es?.close();
        const entry = sourcesRef.current.find((s) => s.key === src.key);
        if (entry) entry.es = null;
        setTimeout(() => {
          // Component hâlâ mount'luysa yeniden bağlan
          if (!sourcesRef.current.some((s) => s.key === src.key)) return;
          let newEs: EventSource | null = null;
          try {
            newEs = new EventSource(`${API_URL}/api/market/gold/stream/${src.key}`);
          } catch {
            return;
          }
          newEs.onmessage = es!.onmessage;
          newEs.onerror = es!.onerror;
          const e = sourcesRef.current.find((s) => s.key === src.key);
          if (e) e.es = newEs;
        }, SSE_RECONNECT_DELAY);
      };

      return { key: src.key, es };
    });

    // Unmount'ta hepsini kapat
    return () => {
      for (const s of sourcesRef.current) {
        try {
          s.es?.close();
        } catch {
          // yoksay
        }
      }
      sourcesRef.current = [];
    };
    // Bu hook sayfa mount süresince bir kez bağlanır.
    // updateFromGoldStream referansı stabil (zustand selector döndürür).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}