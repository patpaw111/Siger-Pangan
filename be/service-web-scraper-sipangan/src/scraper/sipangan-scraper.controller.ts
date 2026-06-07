import { Controller, Post, Get, Body, Logger, HttpCode, UseGuards } from '@nestjs/common';
import {
  SipanganScraperService,
  SipanganScrapeResult,
} from './sipangan-scraper.service';
import { SipanganScraperScheduler } from './sipangan-scraper.scheduler';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SipanganScraperRun } from './entities/sipangan-scraper-run.entity';
import { SipanganPriceRecord } from './entities/sipangan-price-record.entity';
import { ApiKeyGuard } from '../auth/api-key.guard';

@Controller('api/v1/sipangan-scraper')
export class SipanganScraperController {
  private readonly logger = new Logger(SipanganScraperController.name);

  constructor(
    private readonly scheduler: SipanganScraperScheduler,
    @InjectRepository(SipanganScraperRun)
    private readonly runRepo: Repository<SipanganScraperRun>,
    @InjectRepository(SipanganPriceRecord)
    private readonly priceRepo: Repository<SipanganPriceRecord>,
  ) {}

  /**
   * Trigger scraping manual.
   * POST /api/v1/sipangan-scraper/trigger
   * Body opsional: { startDate?: string, endDate?: string, levelHargaIds?: number[] }
   */
  @Post('trigger')
  @UseGuards(ApiKeyGuard)
  @HttpCode(202) // 202 Accepted (Processing in background)
  async trigger(
    @Body() body?: {
      startDate?: string;
      endDate?: string;
      levelHargaIds?: number[];
    },
  ): Promise<{ message: string; jobId: string }> {
    this.logger.log('Manual trigger scraping SiPangan (BullMQ)...');

    const options: {
      startDate?: string;
      endDate?: string;
      levelHargaIds?: number[];
    } = {};
    if (body?.startDate) options.startDate = body.startDate;
    if (body?.endDate) options.endDate = body.endDate;
    if (body?.levelHargaIds) options.levelHargaIds = body.levelHargaIds;

    const jobId = await this.scheduler.triggerManualScrape(options);

    return {
      message: 'Scraping SiPangan ditambahkan ke antrean (BullMQ). Silakan cek status di endpoint /status atau database.',
      jobId,
    };
  }

  /**
   * Status scraper terakhir.
   * GET /api/v1/sipangan-scraper/status
   */
  @Get('status')
  async status(): Promise<{
    lastRun: SipanganScraperRun | null;
    totalRecords: number;
  }> {
    const lastRun = await this.runRepo.findOne({
      order: { startedAt: 'DESC' },
      where: {},
    });

    const totalRecords = await this.priceRepo.count();

    return { lastRun, totalRecords };
  }

}
