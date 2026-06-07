import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bullmq';
import { RedisModule } from '@nestjs-modules/ioredis';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SipanganScraperModule } from './scraper/sipangan-scraper.module';
import { PriceModule } from './price/price.module';
import { SipanganPriceRecord } from './scraper/entities/sipangan-price-record.entity';
import { SipanganScraperRun } from './scraper/entities/sipangan-scraper-run.entity';

@Module({
  imports: [
    // ── 1. Config (.env) ─────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // ── 2. PostgreSQL via TypeORM ────────────────────────────
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        url: config.get<string>('DATABASE_URL'),
        entities: [SipanganPriceRecord, SipanganScraperRun],
        synchronize: config.get<string>('NODE_ENV') !== 'production',
        logging: config.get<string>('NODE_ENV') === 'development',
        ssl:
          config.get<string>('NODE_ENV') === 'production'
            ? { rejectUnauthorized: false }
            : false,
      }),
    }),

    // ── 3. Redis (Cache & Session) ─────────────────────────
    RedisModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'single',
        url: config.get<string>('REDIS_URL') || 'redis://redis:6379',
      }),
    }),

    // ── 4. BullMQ (Background Jobs) ────────────────────────
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('REDIS_HOST') || 'redis',
          port: config.get<number>('REDIS_PORT') || 6379,
        },
      }),
    }),

    // ── 5. Cron Scheduler ───────────────────────────────────
    ScheduleModule.forRoot(),

    // ── 6. Scraper Module ───────────────────────────────────
    SipanganScraperModule,

    // ── 7. Price Module ─────────────────────────────────────
    PriceModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
