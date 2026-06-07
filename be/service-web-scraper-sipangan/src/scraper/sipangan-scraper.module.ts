import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';

import { SipanganPriceRecord } from './entities/sipangan-price-record.entity';
import { SipanganScraperRun } from './entities/sipangan-scraper-run.entity';
import { SipanganHttpService } from './sipangan-http.service';
import { SipanganScraperService } from './sipangan-scraper.service';
import { SipanganScraperController } from './sipangan-scraper.controller';
import { SipanganScraperScheduler } from './sipangan-scraper.scheduler';
import { SipanganScraperProcessor, SIPANGAN_SCRAPER_QUEUE } from './sipangan-scraper.processor';

@Module({
  imports: [
    TypeOrmModule.forFeature([SipanganPriceRecord, SipanganScraperRun]),
    BullModule.registerQueue({
      name: SIPANGAN_SCRAPER_QUEUE,
    }),
  ],
  controllers: [SipanganScraperController],
  providers: [
    SipanganHttpService,
    SipanganScraperService,
    SipanganScraperProcessor,
    SipanganScraperScheduler,
  ],
  exports: [SipanganScraperService],
})
export class SipanganScraperModule {}
