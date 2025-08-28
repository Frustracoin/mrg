import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('mrg_records')
export class MrgRecordEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  pipeline: string;

  @Column({ type: 'varchar', length: 255 })
  mg: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  km: number;

  @Column({ type: 'date' })
  dateISO: Date;

  @Column({ type: 'varchar', length: 100 })
  dateLabel: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  loadLevel: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  avgDailyConsumption: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  tvps: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
