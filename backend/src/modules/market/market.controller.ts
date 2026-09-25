import { SkipThrottle } from '@nestjs/throttler';
import { Controller, Get, Param, Query, Sse, BadRequestException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { merge, Observable, map } from 'rxjs';
import { MarketService } from './market.service';
import { type BorsaStock, type BorsaIndex } from './market.types';
import { Public } from '../../common/decorators';

@ApiTags('Market')
// Salt okunur piyasa verisi: SSR/ISR tek IP'den çok sayıda istek atar; sınırlama
// sayfaların 429/404 vermesine yol açıyordu. Veri zaten upstream'de önbellekli.
@SkipThrottle()
@Controller('market')
export class MarketController {
  constructor(private readonly marketService: MarketService) {}

  @Public()
  @Get('gold')
  getGoldPrices() {
    return this.marketService.getGoldPrices();
  }

  @Public()
  @Get('currency/:source')
  getCurrencies(@Param('source') source: string) {
    if (source !== 'serbest-piyasa' && source !== 'merkez-bankasi') {
      throw new BadRequestException('Invalid source');
    }
    return this.marketService.getCurrencies(source);
  }

  @Public()
  @Get('stocks')
  getStocks(): Promise<BorsaStock[]> {
    return this.marketService.getStocks();
  }

  // Search endpoint — frontend search overlay ve /arama sayfasi icin.
  // /api/market/stocks/search?q=A1CAP → { success, data: [{symbol, name}, ...] }
  @Public()
  @Get('stocks/search')
  async searchStocks(@Query('q') q?: string): Promise<{ success: boolean; data: BorsaStock[]; count: number }> {
    const results = await this.marketService.searchStocks(q);
    return { success: true, data: results, count: results.length };
  }

  @Public()
  @Get('indices')
  getIndices(): Promise<BorsaIndex[]> {
    return this.marketService.getIndices();
  }

  @Public()
  @Get('indices/search')
  async searchIndices(@Query('q') q?: string): Promise<{ success: boolean; data: BorsaIndex[]; count: number }> {
    const results = await this.marketService.searchIndices(q);
    return { success: true, data: results, count: results.length };
  }

  /**
   * Birleşik piyasa akışı: borsa + altın + serbest piyasa + TCMB döviz tek bağlantıda.
   * Her mesaj { channel, payload } biçimindedir. Ayrı akışlar sayfa başına 3-4 kalıcı
   * bağlantı açıyordu; HTTP/1.1'de tarayıcının 6 bağlantı sınırı sayfa geçişlerini kilitliyordu.
   * Eski uçlar geriye dönük uyumluluk için duruyor.
   */
  @Public()
  @Sse('stream')
  combinedStream(): Observable<{ data: string }> {
    const tag = (channel: string) => (event: MessageEvent) => {
      const raw = event.data as unknown;
      let payload: unknown = raw;
      if (typeof raw === 'string') {
        try {
          payload = JSON.parse(raw);
        } catch {
          payload = raw;
        }
      }
      return { data: JSON.stringify({ channel, payload }) };
    };
    return merge(
      this.marketService.getBorsaStream().pipe(map(tag('borsa'))),
      this.marketService.getGoldStream().pipe(map(tag('gold'))),
      this.marketService.getCurrencyStream('serbest-piyasa').pipe(map(tag('currency:serbest-piyasa'))),
      this.marketService.getCurrencyStream('merkez-bankasi').pipe(map(tag('currency:merkez-bankasi'))),
    );
  }

  @Public()
  @Sse('gold/stream')
  goldStream(): Observable<{ data: string }> {
    return this.marketService.getGoldStream().pipe(
      map((event) => ({ data: typeof event.data === 'string' ? event.data : JSON.stringify(event.data) })),
    );
  }

  @Public()
  @Sse('gold/stream/:source')
  goldStreamBySource(@Param('source') source: string): Observable<{ data: string }> {
    if (!/^[a-z0-9-]+$/.test(source)) {
      throw new BadRequestException('Invalid source');
    }
    return this.marketService.getGoldStreamBySource(source).pipe(
      map((event) => ({ data: typeof event.data === 'string' ? event.data : JSON.stringify(event.data) })),
    );
  }

  @Public()
  @Sse('borsa/stream')
  borsaStream(): Observable<{ data: string }> {
    return this.marketService.getBorsaStream().pipe(
      map((event) => ({ data: typeof event.data === 'string' ? event.data : JSON.stringify(event.data) })),
    );
  }

  @Public()
  @Sse('currency/:source/stream')
  currencyStream(@Param('source') source: string): Observable<{ data: string }> {
    if (!/^[a-z0-9-]+$/.test(source)) {
      throw new BadRequestException('Invalid source');
    }
    return this.marketService.getCurrencyStream(source).pipe(
      map((event) => ({ data: typeof event.data === 'string' ? event.data : JSON.stringify(event.data) })),
    );
  }
}
