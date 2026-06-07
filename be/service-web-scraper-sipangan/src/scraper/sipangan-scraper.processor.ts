import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { SipanganScraperService } from './sipangan-scraper.service';

export const SIPANGAN_SCRAPER_QUEUE = 'sipangan-scraper-queue';

export interface SipanganScrapeJobPayload {
  levelHargaIds?: number[];
  startDate?: string; // ISO string
  endDate?: string;   // ISO string
  triggeredBy?: 'cron' | 'manual' | 'api';
}

@Processor(SIPANGAN_SCRAPER_QUEUE)
export class SipanganScraperProcessor extends WorkerHost {
  private readonly logger = new Logger(SipanganScraperProcessor.name);

  constructor(private readonly scraperService: SipanganScraperService) {
    super();
  }

  async process(job: Job<SipanganScrapeJobPayload>): Promise<void> {
    this.logger.log(
      `📥 Mulai memproses job SiPangan [${job.id}] | Triggered: ${job.data.triggeredBy ?? 'unknown'}`,
    );

    const options: Record<string, unknown> = {
      jobId: String(job.id),
      levelHargaIds: job.data.levelHargaIds ?? [3], // Default Eceran
    };

    if (job.data.startDate) options.startDate = new Date(job.data.startDate);
    if (job.data.endDate) options.endDate = new Date(job.data.endDate);

    await job.updateProgress(5);

    const result = await this.scraperService.scrapeAll(options);

    await job.updateProgress(100);
    this.logger.log(
      `✅ Job SiPangan [${job.id}] selesai: ${result.inserted} inserted, ` +
        `${result.updated} updated, ${result.errors} errors ` +
        `dalam ${(result.durationMs / 1000).toFixed(1)}s`,
    );
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(
      `❌ Job SiPangan [${job?.id}] gagal setelah ${job?.attemptsMade} percobaan: ${error.message}`,
      error.stack,
    );
  }

  @OnWorkerEvent('stalled')
  onStalled(jobId: string) {
    this.logger.warn(`⚠️ Job SiPangan [${jobId}] stalled — akan di-reschedule oleh BullMQ`);
  }
}
