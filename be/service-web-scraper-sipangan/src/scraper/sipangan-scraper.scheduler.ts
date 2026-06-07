import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { SIPANGAN_SCRAPER_QUEUE, SipanganScrapeJobPayload } from './sipangan-scraper.processor';
import { subDays } from 'date-fns';

@Injectable()
export class SipanganScraperScheduler {
  private readonly logger = new Logger(SipanganScraperScheduler.name);

  constructor(
    @InjectQueue(SIPANGAN_SCRAPER_QUEUE)
    private readonly scraperQueue: Queue<SipanganScrapeJobPayload>,
  ) {}

  /**
   * Cron harian: setiap hari pukul 06:15 WIB (23:15 UTC)
   * Ambil data 7 hari terakhir.
   */
  @Cron('15 23 * * *', { name: 'daily-scrape-sipangan', timeZone: 'UTC' })
  async scheduleDailyScrape() {
    this.logger.log('🕐 Cron harian SiPangan: memulai scrape data 7 hari terakhir...');

    await this.scraperQueue.add(
      'daily-scrape-sipangan',
      {
        levelHargaIds: [3],
        startDate: subDays(new Date(), 7).toISOString(),
        endDate: new Date().toISOString(),
        triggeredBy: 'cron',
      },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 10_000 },
        removeOnComplete: { count: 30 },
        removeOnFail: { count: 10 },
        jobId: `sipangan-daily-${new Date().toISOString().slice(0, 10)}`, // idempoten: 1 job per hari
      },
    );
  }

  /**
   * Trigger scrape manual dari luar (API endpoint admin).
   */
  async triggerManualScrape(options: {
    startDate?: string;
    endDate?: string;
    levelHargaIds?: number[];
  }): Promise<string> {
    const job = await this.scraperQueue.add(
      'manual-scrape-sipangan',
      {
        levelHargaIds: options.levelHargaIds ?? [3],
        startDate: options.startDate,
        endDate: options.endDate,
        triggeredBy: 'api',
      },
      {
        attempts: 2,
        removeOnComplete: { count: 20 },
        removeOnFail: { count: 10 },
        priority: 1, // prioritas tertinggi
      },
    );

    this.logger.log(`✋ Manual scrape SiPangan dijadwalkan. Job ID: ${job.id}`);
    return String(job.id);
  }
}
