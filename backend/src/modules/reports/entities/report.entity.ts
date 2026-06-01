import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum ReportType {
  TOOL = 'tool',
  BLOG = 'blog',
}

export enum ReportStatus {
  PENDING = 'pending',
  REVIEWED = 'reviewed',
  RESOLVED = 'resolved',
}

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'enum', enum: ReportType })
  type!: ReportType;

  @Column({ length: 255 })
  slug!: string;

  @Column({ length: 255 })
  pageTitle!: string;

  @Column({ type: 'text', nullable: true })
  message!: string | null;

  @Column({ type: 'enum', enum: ReportStatus, default: ReportStatus.PENDING })
  status!: ReportStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
