import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum BlogStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
}

@Entity('blogs')
export class Blog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 255 })
  title!: string;

  @Column({ unique: true, length: 255 })
  slug!: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'text', nullable: true })
  excerpt!: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  thumbnailUrl!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  category!: string | null;

  @Column({ type: 'enum', enum: BlogStatus, default: BlogStatus.DRAFT })
  status!: BlogStatus;

  @Column({ default: false })
  isFeatured!: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  seoTitle!: string | null;

  @Column({ type: 'text', nullable: true })
  seoDescription!: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  seoKeywords!: string | null;

  @Column({ type: 'int', default: 0 })
  viewCount!: number;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'authorId' })
  author!: User | null;

  @Column({ type: 'uuid', nullable: true })
  authorId!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  publishedAt!: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
