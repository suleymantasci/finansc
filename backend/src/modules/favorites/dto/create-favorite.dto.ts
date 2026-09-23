import { IsEnum, IsString, Matches, MaxLength } from 'class-validator';
import { FavoriteType } from '../entities/favorite.entity';

export class CreateFavoriteDto {
  @IsEnum(FavoriteType)
  type!: FavoriteType;

  /** slug (altın/döviz kodu/emtia/araç) veya sembol (hisse/endeks) */
  @IsString()
  @MaxLength(50)
  @Matches(/^[A-Za-z0-9][A-Za-z0-9._-]{0,49}$/, { message: 'Geçersiz sembol' })
  symbol!: string;
}
