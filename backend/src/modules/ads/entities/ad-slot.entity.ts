import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('ad_slots')
export class AdSlot {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 100 })
  page!: string;

  @Column({ length: 50 })
  position!: string;

  @Column({ type: 'int', default: 0 })
  slotIndex!: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  adsenseUnit!: string | null;

  @Column({ default: false })
  isActive!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
