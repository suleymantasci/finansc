import { IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * TÜFE endeks hesaplama isteği — tasci-api POST /api/tufe/endeks/calculate proxy.
 * Frontend'den 4 dönem + opsiyonel tutar gelir.
 *
 * Validate edilmezse 400 → frontend error banner gösterir.
 */
export class CalculateTufeDto {
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  @Max(2100)
  baseYear!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  baseMonth!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1900)
  @Max(2100)
  targetYear!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  targetMonth!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount?: number;
}