import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ToolCategory {
  KREDI = 'kredi',
  YATIRIM = 'yatirim',
  VERGI = 'vergi',
  TASARRUF = 'tasarruf',
  DIGER = 'diger',
}

@Entity('tools')
export class Tool {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 255 })
  title!: string;

  @Column({ unique: true, length: 255 })
  slug!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'enum', enum: ToolCategory, default: ToolCategory.DIGER })
  category!: ToolCategory;

  @Column({ type: 'varchar', length: 100, nullable: true })
  icon!: string | null;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ type: 'int', default: 0 })
  sortOrder!: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
