import { Injectable, Logger, BadGatewayException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { Observable, ReplaySubject } from 'rxjs';
import { EventSource } from 'eventsource';
import { BORSA_ENABLED, isBorsaIstanbulInstrument } from '../../common/borsa';

/**
 * Geçmiş veri (grafik) proxy'si — upstream tasci-api'nin /api/history servisleri.
 *
 * İki iş yapar:
 *  1. Snapshot proxy (GET) — 5 yıllık seri tek istekte gelir, burada cache'lenir.
 *     Aynı seriyi 100 kullanıcı isterse upstream'e 1 istek gider.
 *  2. SSE fan-out — son mum güncellemeleri. Enstrüman başına upstream'e TEK
 *     bağlantı açılır, tüm istemcilere dağıtılır (market.service ile aynı desen).
 */

interface CacheEntry<T> {
  data: T;
  ts: number;
}

export interface HistoryPoint {
  t: string;
  o: number | null;
  h: number | null;
  l: number | null;
  c: number;
  v: number | null;
}

export interface HistorySeries {
  success: boolean;
  instrument: string;
  label: string;
  kind: string;
  source: string;
  interval: string;
  from: string;
  to: string;
  count: number;
  live: boolean;
  points: HistoryPoint[];
}

@Injectable()
export class HistoryService {
  private readonly logger = new Logger(HistoryService.name);
  private readonly baseUrl: string;

  private readonly cache = new Map<string, CacheEntry<HistorySeries>>();
  private readonly streams = new Map<string, { subject: ReplaySubject<MessageEvent>; active: boolean }>();

  /**
   * Cache TTL interval'a göre: gün içi seriler sık, uzun periyotlar seyrek değişir.
   * Son mum zaten SSE ile aktığı için snapshot'ın taze olması şart değil.
   */
  private static ttlFor(interval: string): number {
    switch (interval) {
      case '1h':
        return 60 * 1000;
      case '1d':
        return 5 * 60 * 1000;
      default:
        return 30 * 60 * 1000;
    }
  }

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {
    this.baseUrl = this.config.get<string>('EXTERNAL_API_BASE_URL')!;
  }

  async getSeries(
    instrument: string,
    query: { interval?: string; range?: string; from?: string; to?: string; source?: string },
  ): Promise<HistorySeries> {
    const interval = query.interval ?? '1d';
    const key = [instrument, interval, query.range ?? '', query.from ?? '', query.to ?? '', query.source ?? ''].join('|');

    const hit = this.cache.get(key);
    if (hit && Date.now() - hit.ts < HistoryService.ttlFor(interval)) return hit.data;

    const params = new URLSearchParams();
    params.set('interval', interval);
    if (query.range) params.set('range', query.range);
    if (query.from) params.set('from', query.from);
    if (query.to) params.set('to', query.to);
    if (query.source) params.set('source', query.source);

    try {
      const { data } = await firstValueFrom(
        this.http.get<HistorySeries>(
          `${this.baseUrl}/api/history/${encodeURIComponent(instrument)}?${params.toString()}`,
          { timeout: 20000 },
        ),
      );
      if (!data?.success) throw new Error('upstream success:false');

      // Cache boyutunu sınırla — 634 hisse × 5 interval birikebilir
      if (this.cache.size > 800) this.cache.clear();
      this.cache.set(key, { data, ts: Date.now() });
      return data;
    } catch (err) {
      // Stale-if-error: elde eski veri varsa boş dönmektense onu ver
      if (hit) {
        this.logger.warn(`history upstream hata, stale cache kullanıldı: ${instrument}`);
        return hit.data;
      }
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`history upstream başarısız (${instrument}): ${msg}`);
      throw new BadGatewayException('Geçmiş veri alınamadı');
    }
  }

  async getInstruments(kind?: string, q?: string) {
    const params = new URLSearchParams();
    if (kind) params.set('kind', kind);
    if (q) params.set('q', q);
    const { data } = await firstValueFrom(
      this.http.get(`${this.baseUrl}/api/history/instruments?${params.toString()}`, { timeout: 15000 }),
    );
    // Borsa kapalıyken BIST hisse/endeksleri listede yer almaz
    if (!BORSA_ENABLED && Array.isArray(data?.instruments)) {
      const instruments = (data.instruments as { key: string }[]).filter((i) => !isBorsaIstanbulInstrument(i.key));
      return { ...data, count: instruments.length, instruments };
    }
    return data;
  }

  async getSources(instrument: string) {
    const { data } = await firstValueFrom(
      this.http.get(`${this.baseUrl}/api/history/${encodeURIComponent(instrument)}/sources`, { timeout: 15000 }),
    );
    return data;
  }

  /** Son mum akışı — enstrüman başına upstream'e tek bağlantı, çoklu istemciye fan-out */
  getStream(instrument: string): Observable<MessageEvent> {
    this.ensureStream(instrument);
    return this.streams.get(instrument)!.subject.asObservable();
  }

  private ensureStream(instrument: string) {
    if (!this.streams.has(instrument)) {
      this.streams.set(instrument, { subject: new ReplaySubject<MessageEvent>(1), active: false });
    }
    const entry = this.streams.get(instrument)!;
    if (entry.active) return;
    entry.active = true;

    const url = `${this.baseUrl}/api/history/${encodeURIComponent(instrument)}/stream`;
    this.logger.log(`History SSE bağlanıyor: ${instrument}`);
    const es = new EventSource(url);

    es.onmessage = (event) => {
      entry.subject.next(event as unknown as MessageEvent);
    };

    es.onerror = () => {
      this.logger.warn(`History SSE hatası (${instrument}), yeniden bağlanılıyor...`);
      entry.active = false;
      es.close();
      setTimeout(() => this.ensureStream(instrument), 5000);
    };
  }
}
