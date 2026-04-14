import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('scraper_runs')
export class ScraperRun {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'job_id', length: 100, nullable: true })
  jobId: string;

  @Column({ name: 'status', length: 50 }) // 'running', 'success', 'failed', 'partial'
  status: string;

  @Column({ name: 'market_type_id', type: 'int', nullable: true })
  marketTypeId: number;

  @Column({ name: 'records_inserted', type: 'int', default: 0 })
  recordsInserted: number;

  @Column({ name: 'records_updated', type: 'int', default: 0 })
  recordsUpdated: number;

  @Column({ name: 'records_skipped', type: 'int', default: 0 })
  recordsSkipped: number;

  @Column({ name: 'date_range_start', type: 'date', nullable: true })
  dateRangeStart: Date;

  @Column({ name: 'date_range_end', type: 'date', nullable: true })
  dateRangeEnd: Date;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string;

  @Column({ name: 'duration_ms', type: 'int', nullable: true })
  durationMs: number;

  @CreateDateColumn({ name: 'started_at' })
  startedAt: Date;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt: Date;
}
