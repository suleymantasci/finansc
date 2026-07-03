import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

interface CacheEntry<T> {
  data: T;
  ts: number;
}

interface TufeEndeksCalculateRequest {
  baseYear: number;
  baseMonth: number;
  targetYear: number;
  targetMonth: number;
  amount?: number;
}

@Injectable()
export class InflationService {
  private readonly logger = new Logger(InflationService.name);
  private readonly baseUrl: string;

  // Cache: tasci-api zaten DB cache'liyor. Biz sadece burst koruma yapıyoruz
  // (aynı anda birden fazla sayfa istek atmasın).
  // TÜFE ayda 1 güncellenir — cache 1 saat tutmak yeterli (Süleyman kararı).
  // ÜFE için aynı TTL (yine aylık güncelleme).
  private tufeAllCache: CacheEntry<unknown> | null = null;
  private tufeLatestCache: CacheEntry<unknown> | null = null;
  private ufeAllCache: CacheEntry<unknown> | null = null;
  private ufeLatestCache: CacheEntry<unknown> | null = null;
  private tufeEndeksAllCache: CacheEntry<unknown> | null = null;
  private tufeEndeksLatestCache: CacheEntry<unknown> | null = null;
  // calculate için son başarılı isteği cache'le — kullanıcı aynı ayı seçerse sunucuyu yorma.
  private tufeEndeksCalcCache: CacheEntry<unknown> | null = null;
  private static readonly CACHE_TTL_MS = 60 * 60 * 1000; // 1 saat

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {
    this.baseUrl = this.config.get<string>('EXTERNAL_API_BASE_URL')!;
  }

  // ── TÜFE (aylık değişim oranları) ─────────────────────────

  async getTufeAll(): Promise<unknown> {
    const result = await this.fetchWithCache(
      this.tufeAllCache,
      () => firstValueFrom(this.http.get(`${this.baseUrl}/api/tufe`)),
    );
    this.tufeAllCache = { data: result, ts: Date.now() };
    return result;
  }

  async getTufeLatest(): Promise<unknown> {
    const result = await this.fetchWithCache(
      this.tufeLatestCache,
      () => firstValueFrom(this.http.get(`${this.baseUrl}/api/tufe/latest`)),
    );
    this.tufeLatestCache = { data: result, ts: Date.now() };
    return result;
  }

  // ── ÜFE (aylık değişim oranları) ──────────────────────────

  async getUfeAll(): Promise<unknown> {
    const result = await this.fetchWithCache(
      this.ufeAllCache,
      () => firstValueFrom(this.http.get(`${this.baseUrl}/api/ufe`)),
    );
    this.ufeAllCache = { data: result, ts: Date.now() };
    return result;
  }

  async getUfeLatest(): Promise<unknown> {
    const result = await this.fetchWithCache(
      this.ufeLatestCache,
      () => firstValueFrom(this.http.get(`${this.baseUrl}/api/ufe/latest`)),
    );
    this.ufeLatestCache = { data: result, ts: Date.now() };
    return result;
  }

  // ── TÜFE Endeks (2003=100 bazlı tam seri, parasal değer hesabı) ──

  async getTufeEndeksAll(): Promise<unknown> {
    const result = await this.fetchWithCache(
      this.tufeEndeksAllCache,
      () => firstValueFrom(this.http.get(`${this.baseUrl}/api/tufe/endeks`)),
    );
    this.tufeEndeksAllCache = { data: result, ts: Date.now() };
    return result;
  }

  async getTufeEndeksLatest(): Promise<unknown> {
    const result = await this.fetchWithCache(
      this.tufeEndeksLatestCache,
      () => firstValueFrom(this.http.get(`${this.baseUrl}/api/tufe/endeks/latest`)),
    );
    this.tufeEndeksLatestCache = { data: result, ts: Date.now() };
    return result;
  }

  /**
   * TÜFE endeks hesaplama proxy — tasci-api POST /api/tufe/endeks/calculate.
   * Dönüş: { base:{period,value}, target:{period,value}, input:{amount},
   *          result:{value,change,changePercent}, duration:{years,months} }
   */
  async calculateTufeEndeks(req: TufeEndeksCalculateRequest): Promise<unknown> {
    const result = await this.fetchWithCache(
      this.tufeEndeksCalcCache,
      () =>
        firstValueFrom(
          this.http.post(`${this.baseUrl}/api/tufe/endeks/calculate`, req),
        ),
    );
    this.tufeEndeksCalcCache = { data: result, ts: Date.now() };
    return result;
  }

  // ── Cache helper ──────────────────────────────────────────

  private async fetchWithCache(
    cache: CacheEntry<unknown> | null,
    fetcher: () => Promise<{ data: any }>,
  ): Promise<unknown> {
    const now = Date.now();
    if (cache && now - cache.ts < InflationService.CACHE_TTL_MS) {
      return cache.data;
    }
    try {
      const { data } = await fetcher();
      // Hard-fail: tasci-api her response'da {success: bool} döner.
      // success:false ise DB boş / sorgu bulunamadı / upstream hatası — stale cache YOK, throw.
      if (data && typeof data === 'object' && data.success === false) {
        const msg = data.error || 'upstream returned success:false';
        this.logger.error(`upstream fetch failed: ${msg}`);
        if (cache) return cache.data;
        throw new Error(msg);
      }
      return data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`upstream fetch failed: ${msg}`);
      // Hard-fail: Süleyman kararı — DB boş / upstream 5xx ise stale cache YOK, throw.
      if (cache) return cache.data;
      throw err;
    }
  }
}