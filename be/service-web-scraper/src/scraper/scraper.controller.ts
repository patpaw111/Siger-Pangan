import { Controller, Post, Body, Get, UseGuards, Logger } from '@nestjs/common';
import { ScraperScheduler } from './scraper.scheduler';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { SCRAPER_QUEUE } from './scraper.processor';

import { IsOptional, IsString, IsArray, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

class ManualScrapeDto {
  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Max(3, { each: true })
  @Type(() => Number)
  marketTypeIds?: number[];
}

@Controller('scraper')
export class ScraperController {
  private readonly logger = new Logger(ScraperController.name);

  constructor(
    private readonly scheduler: ScraperScheduler,
    @InjectQueue(SCRAPER_QUEUE)
    private readonly scraperQueue: Queue,
  ) {}

  /**
   * POST /api/v1/scraper/trigger
   * Trigger scraping manual — hanya untuk admin
   */
  @Post('trigger')
  async triggerManual(@Body() dto: ManualScrapeDto) {
    const jobId = await this.scheduler.triggerManualScrape({
      startDate: dto.startDate,
      endDate: dto.endDate,
      marketTypeIds: dto.marketTypeIds,
    });

    return {
      success: true,
      message: 'Scraping dijadwalkan. Cek status di /scraper/status',
      jobId,
    };
  }

  /**
   * GET /api/v1/scraper/status
   * Cek status antrian scraping
   */
  @Get('status')
  async getQueueStatus() {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.scraperQueue.getWaitingCount(),
      this.scraperQueue.getActiveCount(),
      this.scraperQueue.getCompletedCount(),
      this.scraperQueue.getFailedCount(),
      this.scraperQueue.getDelayedCount(),
    ]);

    const activeJobs = await this.scraperQueue.getActive();
    const lastJob = await this.scraperQueue.getCompleted(0, 0);

    return {
      queue: {
        waiting,
        active,
        completed,
        failed,
        delayed,
      },
      activeJobs: activeJobs.map((j) => ({
        id: j.id,
        name: j.name,
        progress: j.progress,
        data: j.data,
        processedOn: j.processedOn,
      })),
      lastCompletedJob: lastJob[0]
        ? {
            id: lastJob[0].id,
            finishedOn: lastJob[0].finishedOn,
            returnValue: lastJob[0].returnvalue,
          }
        : null,
    };
  }
}
