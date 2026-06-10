import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { format, subDays, addDays, differenceInDays } from 'date-fns';

import { SipanganHttpService, SipanganKotaData } from './sipangan-http.service';
import { SipanganPriceRecord } from './entities/sipangan-price-record.entity';
import { SipanganScraperRun } from './entities/sipangan-scraper-run.entity';
import {
  SIPANGAN_LEVEL_HARGA,
  SIPANGAN_COMMODITIES_ECERAN,
  SIPANGAN_COMMODITIES_PRODUSEN,
} from '../common/constants/sipangan-api.constants';

export interface SipanganScrapeOptions {
  levelHargaIds?: number[];   // default: [3, 1] (Eceran + Produsen)
  startDate?: Date;           // default: hari ini - 7 hari
  endDate?: Date;             // default: hari ini
  jobId?: string;
}

export interface SipanganScrapeResult {
  inserted: number;
  updated: number;
  skipped: number;
  errors: number;
  durationMs: number;
}

@Injectable()
export class SipanganScraperService implements OnModuleInit {
  private readonly logger = new Logger(SipanganScraperService.name);

  constructor(
    private readonly sipanganHttp: SipanganHttpService,
    @InjectRepository(SipanganPriceRecord)
    private readonly priceRepo: Repository<SipanganPriceRecord>,
    @InjectRepository(SipanganScraperRun)
    private readonly runRepo: Repository<SipanganScraperRun>,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.sipanganHttp.initSession();
  }

  /**
   * Entry point utama: scrape data harga dari SiPangan Lampung.
   */
  async scrapeAll(
    options: SipanganScrapeOptions = {},
  ): Promise<SipanganScrapeResult> {
    const startTime = Date.now();
    const {
      levelHargaIds = [3, 1],
      startDate = subDays(new Date(), 7),
      endDate = new Date(),
      jobId,
    } = options;

    // Catat log
    const run = await this.runRepo.save(
      this.runRepo.create({
        jobId: jobId ?? 'manual',
        status: 'running',
        dateRangeStart: startDate,
        dateRangeEnd: endDate,
      }),
    );

    const result: SipanganScrapeResult = {
      inserted: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
      durationMs: 0,
    };

    try {
      // Refresh session & CSRF
      await this.sipanganHttp.initSession();

      // Daftar tanggal
      const dates = this.buildDateList(startDate, endDate);
      this.logger.log(
        `Total tanggal: ${dates.length} (${format(startDate, 'yyyy-MM-dd')} → ${format(endDate, 'yyyy-MM-dd')})`,
      );

      // Loop per level harga
      for (const level of SIPANGAN_LEVEL_HARGA) {
        if (!levelHargaIds.includes(level.id)) continue;

        const commodities =
          level.id === 3
            ? SIPANGAN_COMMODITIES_ECERAN
            : SIPANGAN_COMMODITIES_PRODUSEN;

        this.logger.log(
          `Mulai scraping: ${level.name} (Level ${level.id}) — ${commodities.length} komoditas`,
        );

        // Loop per komoditas
        for (const commodity of commodities) {
          try {
            // -- Pemecahan Request per 90 Hari (Mencegah Server SiPangan 502 Bad Gateway) --
            const CHUNK_DAYS = 90;
            let currentStart = new Date(startDate);
            const finalEnd = new Date(endDate);
            let totalRecordsForCommodity: import('./entities/sipangan-price-record.entity').SipanganPriceRecord[] = [];

            while (currentStart <= finalEnd) {
              let currentEnd = addDays(currentStart, CHUNK_DAYS);
              if (currentEnd > finalEnd) {
                currentEnd = finalEnd;
              }

              const kotaDataList = await this.sipanganHttp.fetchPriceMap({
                levelHarga: level.id,
                commodityId: commodity.id,
                commodityName: commodity.name,
                startDate: format(currentStart, 'yyyy-MM-dd'),
                endDate: format(currentEnd, 'yyyy-MM-dd'),
              });

              if (kotaDataList && kotaDataList.length > 0) {
                // Parse segera dan kumpulkan
                const records = this.parseMapResponse(
                  kotaDataList,
                  commodity.id,
                  commodity.name,
                  level.id,
                  level.name,
                );
                totalRecordsForCommodity = totalRecordsForCommodity.concat(records);
              }

              // Lanjut ke rentang berikutnya
              currentStart = addDays(currentEnd, 1);
              
              // Delay antar chunk agar server mereka bernapas
              await this.delay(1000);
            }

            if (totalRecordsForCommodity.length === 0) {
              result.skipped++;
              continue;
            }

            // Batch Upsert semua data yang sudah dikumpulkan untuk komoditas ini
            const upsertResult = await this.batchUpsert(totalRecordsForCommodity);
            result.inserted += upsertResult.inserted;
            result.updated += upsertResult.updated;

          } catch (err) {
            result.errors++;
            this.logger.error(
              `Error: ${commodity.name} @ ${format(startDate, 'yyyy-MM-dd')} to ${format(endDate, 'yyyy-MM-dd')}: ${(err as Error).message}`,
            );
          }

          // Delay 1.5 detik antar request
          await this.delay(1500);
          this.logger.debug(`✓ ${commodity.name} (${level.name}) selesai`);
        }

        this.logger.log(
          `Selesai ${level.name}: +${result.inserted} inserted`,
        );
      }

      // Update run → success
      result.durationMs = Date.now() - startTime;
      await this.runRepo.update(run.id, {
        status: 'success',
        recordsInserted: result.inserted,
        recordsUpdated: result.updated,
        recordsSkipped: result.skipped,
        durationMs: result.durationMs,
        completedAt: new Date(),
      });

      this.logger.log(
        `✅ SiPangan scraping selesai! Total: ${result.inserted} inserted ` +
          `dalam ${(result.durationMs / 1000).toFixed(1)}s`,
      );
    } catch (err) {
      result.durationMs = Date.now() - startTime;
      await this.runRepo.update(run.id, {
        status: 'failed',
        errorMessage: (err as Error).message,
        durationMs: result.durationMs,
        completedAt: new Date(),
      });
      this.logger.error(
        `❌ SiPangan scraping gagal: ${(err as Error).message}`,
        (err as Error).stack,
      );
      throw err;
    }

    return result;
  }

  /**
   * Parse response dari /get-data-map → array SipanganPriceRecord.
   */
  private parseMapResponse(
    kotaDataList: SipanganKotaData[],
    commodityId: number,
    commodityName: string,
    levelHarga: number,
    levelHargaName: string,
  ): SipanganPriceRecord[] {
    const records: SipanganPriceRecord[] = [];

    for (const kota of kotaDataList) {
      const regionName = kota.KOTA;
      
      // Abaikan kabupaten/kota di luar Lampung yang kadang nyasar dari SiPangan pusat
      if (regionName.toLowerCase().includes('cilacap') || regionName.toLowerCase().includes('wonogiri')) {
        continue;
      }

      const values = kota.DATA?.Value ?? [];

      for (const val of values) {
        if (val.Nilai === null || val.Nilai === undefined) continue;

        const priceDate = new Date(val.Tanggal);
        if (isNaN(priceDate.getTime())) continue;

        records.push(
          this.priceRepo.create({
            commodityId,
            commodityName,
            levelHarga,
            levelHargaName,
            regionName,
            price: val.Nilai,
            priceDate,
            source: 'SiPangan Lampung',
          }),
        );
      }
    }

    return records;
  }

  /**
   * Batch upsert ke PostgreSQL.
   */
  private async batchUpsert(
    records: SipanganPriceRecord[],
  ): Promise<{ inserted: number; updated: number }> {
    if (records.length === 0) return { inserted: 0, updated: 0 };

    const chunkSize = 2000; // Maksimal 2000 baris per query (karena ada 8 kolom, total ~16.000 parameter, sangat aman dari batas 65.535)
    let totalInserted = 0;

    for (let i = 0; i < records.length; i += chunkSize) {
      const chunk = records.slice(i, i + chunkSize);

      await this.priceRepo
        .createQueryBuilder()
        .insert()
        .into(SipanganPriceRecord)
        .values(chunk)
        .orUpdate(
          ['price', 'scraped_at'],
          ['commodity_id', 'level_harga', 'region_name', 'price_date'],
          { skipUpdateIfNoValuesChanged: true },
        )
        .execute();

      totalInserted += chunk.length;
    }

    return { inserted: totalInserted, updated: 0 };
  }

  /**
   * Generate daftar tanggal (YYYY-MM-DD) dari startDate sampai endDate.
   */
  private buildDateList(from: Date, to: Date): string[] {
    const dates: string[] = [];
    const totalDays = differenceInDays(to, from);

    for (let i = 0; i <= totalDays; i++) {
      dates.push(format(addDays(from, i), 'yyyy-MM-dd'));
    }

    return dates;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
