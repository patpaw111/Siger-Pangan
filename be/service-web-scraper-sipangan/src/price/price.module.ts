import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SipanganPriceRecord } from '../scraper/entities/sipangan-price-record.entity';
import { PriceController } from './price.controller';
import { PriceService } from './price.service';
import { CacheModule } from '@nestjs/cache-manager';
import { createKeyv } from '@keyv/redis';
import * as dotenv from 'dotenv';
dotenv.config();

const REDIS_HOST = process.env.REDIS_HOST || 'redis';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);

@Module({
  imports: [
    TypeOrmModule.forFeature([SipanganPriceRecord]),
    CacheModule.registerAsync({
      useFactory: () => ({
        stores: [
          createKeyv(`redis://${REDIS_HOST}:${REDIS_PORT}`),
        ],
      }),
    }),
  ],
  controllers: [PriceController],
  providers: [PriceService],
  exports: [PriceService],
})
export class PriceModule {}
