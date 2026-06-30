import { Controller, Get, Param, Query, Sse, BadRequestException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Observable, map } from 'rxjs';
import { MarketService } from './market.service';
import { Public } from '../../common/decorators';

@ApiTags('Market')
@Controller('market')
export class MarketController {
  constructor(private readonly marketService: MarketService) {}

  @Public()
  @Get('gold')
  getGoldPrices() {
    return this.marketService.getGoldPrices();
  }

  @Public()
  @Get('stocks')
  getStocks() {
    return this.marketService.getStocks();
  }

  // Search endpoint — frontend search overlay ve /arama sayfasi icin.
  // /api/market/stocks/search?q=A1CAP → { success, data: [{symbol, name}, ...] }
  @Public()
  @Get('stocks/search')
  async searchStocks(@Query('q') q?: string) {
    const results = await this.marketService.searchStocks(q);
    return { success: true, data: results, count: results.length };
  }

  @Public()
  @Get('indices')
  getIndices() {
    return this.marketService.getIndices();
  }

  @Public()
  @Get('indices/search')
  async searchIndices(@Query('q') q?: string) {
    const results = await this.marketService.searchIndices(q);
    return { success: true, data: results, count: results.length };
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
