import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Favorite } from './entities/favorite.entity';
import { CreateFavoriteDto } from './dto/create-favorite.dto';

/** Kullanıcı başına üst sınır — kötüye kullanımı engeller */
const MAX_FAVORITES_PER_USER = 300;

export interface FavoriteView {
  id: string;
  type: string;
  symbol: string;
  createdAt: Date;
}

const toView = (f: Favorite): FavoriteView => ({ id: f.id, type: f.favoriteType, symbol: f.symbolCode, createdAt: f.createdAt });

@Injectable()
export class FavoritesService {
  constructor(@InjectRepository(Favorite) private readonly repo: Repository<Favorite>) {}

  async list(userId: string): Promise<FavoriteView[]> {
    const rows = await this.repo.find({ where: { userId }, order: { createdAt: 'DESC' } });
    return rows.map(toView);
  }

  /** İdempotent: aynı kayıt varsa onu döndürür */
  async add(userId: string, dto: CreateFavoriteDto): Promise<FavoriteView> {
    const existing = await this.repo.findOne({ where: { userId, favoriteType: dto.type, symbolCode: dto.symbol } });
    if (existing) return toView(existing);
    const count = await this.repo.count({ where: { userId } });
    if (count >= MAX_FAVORITES_PER_USER) {
      throw new BadRequestException(`En fazla ${MAX_FAVORITES_PER_USER} favori ekleyebilirsiniz`);
    }
    const saved = await this.repo.save(this.repo.create({ userId, favoriteType: dto.type, symbolCode: dto.symbol }));
    return toView(saved);
  }

  /** Yalnızca kendi kaydını silebilir (başka kullanıcının id'si → 404) */
  async remove(userId: string, id: string): Promise<{ ok: true }> {
    const res = await this.repo.delete({ id, userId });
    if (!res.affected) throw new NotFoundException('Favori bulunamadı');
    return { ok: true };
  }
}
