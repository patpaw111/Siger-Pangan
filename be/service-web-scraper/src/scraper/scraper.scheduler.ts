import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { SCRAPER_QUEUE, ScrapeJobPayload } from './scraper.processor';
import { subDays } from 'date-fns';

@Injectable()
export class ScraperScheduler {
  private readonly logger = new Logger(ScraperScheduler.name);

  constructor(
    @InjectQueue(SCRAPER_QUEUE)
    private readonly scraperQueue: Queue<ScrapeJobPayload>,
  ) {}

  /**
   * Cron harian: setiap hari pukul 06:00 WIB (23:00 UTC)
   * Ambil data 7 hari terakhir saja (data terbaru)
   */
  @Cron('0 23 * * *', { name: 'daily-scrape', timeZone: 'UTC' })
  async scheduleDailyScrape() {
    this.logger.log('🕐 Cron harian: memulai scrape data 7 hari terakhir...');

    await this.scraperQueue.add(
      'daily-scrape',
      {
        marketTypeIds: [1, 2, 3],
        startDate: subDays(new Date(), 7).toISOString(),
        endDate: new Date().toISOString(),
        chunkDays: 7,
        triggeredBy: 'cron',
      },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 10_000 },
        removeOnComplete: { count: 30 },
        removeOnFail: { count: 10 },
        jobId: `daily-${new Date().toISOString().slice(0, 10)}`, // idempoten: 1 job per hari
      },
    );
  }

  /**
   * Cron mingguan: setiap Senin pukul 01:00 WIB (Minggu 18:00 UTC)
   * Ambil data 90 hari terakhir (untuk mengisi gap jika ada yang terlewat)
   */
  @Cron('0 18 * * 0', { name: 'weekly-backfill', timeZone: 'UTC' })
  async scheduleWeeklyBackfill() {
    this.logger.log('🗓️ Cron mingguan: backfill data 90 hari terakhir...');

    await this.scraperQueue.add(
      'weekly-backfill',
      {
        marketTypeIds: [1, 2, 3],
        startDate: subDays(new Date(), 90).toISOString(),
        endDate: new Date().toISOString(),
        chunkDays: 30,
        triggeredBy: 'cron',
      },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 30_000 },
        removeOnComplete: { count: 10 },
        removeOnFail: { count: 5 },
        jobId: `weekly-${new Date().toISOString().slice(0, 7)}`, // 1 job per bulan
        priority: 10, // prioritas lebih rendah dari daily
      },
    );
  }

  /**
   * Trigger scrape manual dari luar (API endpoint admin).
   */
  async triggerManualScrape(options: {
    startDate?: string;
    endDate?: string;
    marketTypeIds?: number[];
  }): Promise<string> {
    const job = await this.scraperQueue.add(
      'manual-scrape',
      {
        marketTypeIds: options.marketTypeIds ?? [1, 2, 3],
        startDate: options.startDate,
        endDate: options.endDate,
        chunkDays: 30,
        triggeredBy: 'api',
      },
      {
        attempts: 2,
        removeOnComplete: { count: 20 },
        removeOnFail: { count: 10 },
        priority: 1, // prioritas tertinggi
      },
    );

    this.logger.log(`✋ Manual scrape dijadwalkan. Job ID: ${job.id}`);
    return String(job.id);
  }
}
