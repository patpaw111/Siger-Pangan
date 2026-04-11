import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';

import { ScraperService } from './scraper.service';
import { ScraperProcessor, SCRAPER_QUEUE } from './scraper.processor';
import { ScraperScheduler } from './scraper.scheduler';
import { ScraperController } from './scraper.controller';
import { BiHttpService } from './bi-http.service';
import { PriceRecord } from '../price/entities/price-record.entity';
import { ScraperRun } from './entities/scraper-run.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([PriceRecord, ScraperRun]),
    BullModule.registerQueue({
      name: SCRAPER_QUEUE,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5_000 },
        removeOnComplete: { count: 50 },
        removeOnFail: { count: 20 },
      },
    }),
  ],
  controllers: [ScraperController],
  providers: [ScraperService, ScraperProcessor, ScraperScheduler, BiHttpService],
  exports: [ScraperScheduler, ScraperService],
})
export class ScraperModule {}
