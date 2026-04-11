import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { ScraperService, ScrapeOptions } from './scraper.service';

export const SCRAPER_QUEUE = 'scraper-queue';

export interface ScrapeJobPayload {
  marketTypeIds?: number[];
  startDate?: string; // ISO string
  endDate?: string;   // ISO string
  chunkDays?: number;
  triggeredBy?: 'cron' | 'manual' | 'api';
}

@Processor(SCRAPER_QUEUE)
export class ScraperProcessor extends WorkerHost {
  private readonly logger = new Logger(ScraperProcessor.name);

  constructor(private readonly scraperService: ScraperService) {
    super();
  }

  async process(job: Job<ScrapeJobPayload>): Promise<void> {
    this.logger.log(
      `📥 Mulai memproses job [${job.id}] | Triggered: ${job.data.triggeredBy ?? 'unknown'}`,
    );

    const options: ScrapeOptions = {
      jobId: String(job.id),
      marketTypeIds: job.data.marketTypeIds ?? [1, 2, 3],
      chunkDays: job.data.chunkDays ?? 90,
    };

    if (job.data.startDate) options.startDate = new Date(job.data.startDate);
    if (job.data.endDate) options.endDate = new Date(job.data.endDate);

    await job.updateProgress(5);

    const result = await this.scraperService.scrapeAll(options);

    await job.updateProgress(100);
    this.logger.log(
      `✅ Job [${job.id}] selesai: ${result.inserted} inserted, ` +
        `${result.updated} updated, ${result.errors} errors ` +
        `dalam ${(result.durationMs / 1000).toFixed(1)}s`,
    );
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(
      `❌ Job [${job?.id}] gagal setelah ${job?.attemptsMade} percobaan: ${error.message}`,
      error.stack,
    );
  }

  @OnWorkerEvent('stalled')
  onStalled(jobId: string) {
    this.logger.warn(`⚠️ Job [${jobId}] stalled — akan di-reschedule oleh BullMQ`);
  }
}
