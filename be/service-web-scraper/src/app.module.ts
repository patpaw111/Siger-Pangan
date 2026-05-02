import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { ScheduleModule } from '@nestjs/schedule';
import { RedisModule } from '@nestjs-modules/ioredis';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ScraperModule } from './scraper/scraper.module';
import { PriceModule } from './price/price.module';
import { PriceRecord } from './price/entities/price-record.entity';
import { ScraperRun } from './scraper/entities/scraper-run.entity';
import { ChatbotModule } from './chatbot/chatbot.module';
import { AuthModule } from './auth/auth.module';
import { MasterDataModule } from './master-data/master-data.module';

@Module({
  imports: [
    // ── 1. Config (environment variables) ──────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // ── 2. PostgreSQL via TypeORM ───────────────────────────
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),
        entities: [PriceRecord, ScraperRun],
        synchronize: config.get<string>('NODE_ENV') !== 'production', // auto-migrate di dev
        logging: config.get<string>('NODE_ENV') === 'development',
        ssl:
          config.get<string>('NODE_ENV') === 'production'
            ? { rejectUnauthorized: false }
            : false,
      }),
    }),

    // ── 3. Redis via ioredis ────────────────────────────────
    RedisModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'single',
        url: config.get<string>('REDIS_URL'),
        options: {
          password: config.get<string>('REDIS_PASSWORD') || undefined,
          maxRetriesPerRequest: 3,
        },
      }),
    }),

    // ── 4. BullMQ (Redis-based job queue) ──────────────────
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('REDIS_HOST', 'localhost'),
          port: config.get<number>('REDIS_PORT', 6379),
          password: config.get<string>('REDIS_PASSWORD') || undefined,
        },
      }),
    }),

    // ── 5. Cron Scheduler ──────────────────────────────────
    ScheduleModule.forRoot(),

    // ── 6. Feature Modules ─────────────────────────────────
    ScraperModule,
    PriceModule,
    ChatbotModule,
    AuthModule,
    MasterDataModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
