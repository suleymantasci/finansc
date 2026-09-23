import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators';
import { FavoritesService } from './favorites.service';
import { CreateFavoriteDto } from './dto/create-favorite.dto';

/** Tüm uçlar oturum ister (global JwtAuthGuard; @Public yok). */
@ApiTags('Favorites')
@ApiBearerAuth()
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favorites: FavoritesService) {}

  @Get()
  list(@CurrentUser('id') userId: string) {
    return this.favorites.list(userId);
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  add(@CurrentUser('id') userId: string, @Body() dto: CreateFavoriteDto) {
    return this.favorites.add(userId, dto);
  }

  @Delete(':id')
  remove(@CurrentUser('id') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.favorites.remove(userId, id);
  }
}
