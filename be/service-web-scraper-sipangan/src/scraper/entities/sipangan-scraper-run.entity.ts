import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('sipangan_scraper_runs')
export class SipanganScraperRun {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'job_id', length: 100, default: 'manual' })
  jobId: string;

  @Column({ name: 'status', length: 30, default: 'running' })
  status: string; // 'running' | 'success' | 'failed'

  @Column({ name: 'date_range_start', type: 'date', nullable: true })
  dateRangeStart: Date;

  @Column({ name: 'date_range_end', type: 'date', nullable: true })
  dateRangeEnd: Date;

  @Column({ name: 'records_inserted', type: 'int', default: 0 })
  recordsInserted: number;

  @Column({ name: 'records_updated', type: 'int', default: 0 })
  recordsUpdated: number;

  @Column({ name: 'records_skipped', type: 'int', default: 0 })
  recordsSkipped: number;

  @Column({ name: 'duration_ms', type: 'int', nullable: true })
  durationMs: number;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt: Date;

  @CreateDateColumn({ name: 'started_at' })
  startedAt: Date;
}
