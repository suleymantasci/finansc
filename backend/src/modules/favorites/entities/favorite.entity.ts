import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum FavoriteType {
  GOLD = 'gold',
  STOCK = 'stock',
  INDEX = 'index',
  CURRENCY = 'currency',
  COMMODITY = 'commodity',
  TOOL = 'tool',
}

@Entity('favorites')
@Unique(['userId', 'favoriteType', 'symbolCode'])
export class Favorite {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column('uuid')
  userId!: string;

  @Column({ type: 'enum', enum: FavoriteType, enumName: 'favorites_favoritetype_enum' })
  favoriteType!: FavoriteType;

  @Column({ length: 50 })
  symbolCode!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
