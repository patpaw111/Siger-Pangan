import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { format, subDays, parse, isValid } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

import { BiHttpService, BiRawRow } from './bi-http.service';
import { PriceRecord } from '../price/entities/price-record.entity';
import { ScraperRun } from './entities/scraper-run.entity';
import {
  BI_MARKET_TYPES,
  BI_COMMODITIES,
  BI_CATEGORIES,
  BI_PROVINCE_LAMPUNG_ID,
} from '../common/constants/bi-api.constants';

export interface ScrapeOptions {
  marketTypeIds?: number[];      // default: [1,2,3] (semua)
  startDate?: Date;              // default: hari ini - 730 hari (2 tahun)
  endDate?: Date;                // default: hari ini
  jobId?: string;
  chunkDays?: number;            // default: 90 (chunk per 90 hari agar tidak timeout)
}

export interface ScrapeResult {
  inserted: number;
  updated: number;
  skipped: number;
  errors: number;
  durationMs: number;
}

@Injectable()
export class ScraperService implements OnModuleInit {
  private readonly logger = new Logger(ScraperService.name);

  constructor(
    private readonly biHttp: BiHttpService,
    @InjectRepository(PriceRecord)
    private readonly priceRepo: Repository<PriceRecord>,
    @InjectRepository(ScraperRun)
    private readonly runRepo: Repository<ScraperRun>,
  ) {}

  async onModuleInit() {
    // Inisialisasi session saat service pertama kali start
    await this.biHttp.initSession();
  }

  /**
   * Entry point utama: scrape semua data harga pangan Lampung dari BI.
   * Dipanggil oleh BullMQ processor.
   */
  async scrapeAll(options: ScrapeOptions = {}): Promise<ScrapeResult> {
    const startTime = Date.now();
    const {
      marketTypeIds = [1, 2, 3],
      startDate = subDays(new Date(), 730),
      endDate = new Date(),
      jobId,
      chunkDays = 90,
    } = options;

    // Catat start log
    const run = await this.runRepo.save(
      this.runRepo.create({
        jobId: jobId ?? 'manual',
        status: 'running',
        dateRangeStart: startDate,
        dateRangeEnd: endDate,
      }),
    );

    const result: ScrapeResult = { inserted: 0, updated: 0, skipped: 0, errors: 0, durationMs: 0 };

    try {
      // Refresh session
      await this.biHttp.initSession();

      // Loop per jenis pasar
      for (const marketType of BI_MARKET_TYPES) {
        if (!marketTypeIds.includes(marketType.id)) continue;

        this.logger.log(`Mulai scraping: ${marketType.name} (ID: ${marketType.id})`);

        // Scrape dalam chunk agar tidak timeout (90 hari per request)
        const chunks = this.buildDateChunks(startDate, endDate, chunkDays);
        this.logger.log(`Total chunk tanggal: ${chunks.length} untuk ${marketType.name}`);

        for (const [chunkStart, chunkEnd] of chunks) {
          const chunkResult = await this.scrapeChunk({
            marketTypeId: marketType.id,
            marketTypeName: marketType.name,
            startDate: chunkStart,
            endDate: chunkEnd,
          });

          result.inserted += chunkResult.inserted;
          result.updated += chunkResult.updated;
          result.skipped += chunkResult.skipped;
          result.errors += chunkResult.errors;

          // Delay antar chunk untuk menghindari rate limiting
          await this.delay(1500);
        }

        this.logger.log(
          `Selesai ${marketType.name}: +${result.inserted} inserted, ~${result.updated} updated`,
        );
      }

      // Update run log → success
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
        `✅ Scraping selesai! Total: ${result.inserted} inserted, ${result.updated} updated ` +
          `dalam ${(result.durationMs / 1000).toFixed(1)}s`,
      );
    } catch (err) {
      result.durationMs = Date.now() - startTime;
      await this.runRepo.update(run.id, {
        status: 'failed',
        errorMessage: err.message,
        durationMs: result.durationMs,
        completedAt: new Date(),
      });
      this.logger.error(`❌ Scraping gagal: ${err.message}`, err.stack);
      throw err;
    }

    return result;
  }

  /**
   * Scrape satu chunk (satu jenis pasar, satu rentang tanggal).
   */
  private async scrapeChunk(params: {
    marketTypeId: number;
    marketTypeName: string;
    startDate: Date;
    endDate: Date;
  }): Promise<ScrapeResult> {
    const { marketTypeId, marketTypeName, startDate, endDate } = params;
    const result: ScrapeResult = { inserted: 0, updated: 0, skipped: 0, errors: 0, durationMs: 0 };

    const startStr = format(startDate, 'dd/MM/yyyy');
    const endStr = format(endDate, 'dd/MM/yyyy');

    this.logger.debug(`Chunk: ${marketTypeName} | ${startStr} → ${endStr}`);

    const rawRows = await this.biHttp.fetchPriceData({
      marketTypeId,
      startDate: startStr,
      endDate: endStr,
      provinceId: BI_PROVINCE_LAMPUNG_ID,
      commodityId: '0', // semua komoditas
      regencyId: 0,     // semua kabupaten
    });

    if (!rawRows || rawRows.length === 0) {
      this.logger.warn(`Tidak ada data untuk chunk: ${marketTypeName} ${startStr}→${endStr}`);
      return result;
    }

    this.logger.debug(`Raw rows diterima: ${rawRows.length}`);

    // Parse dan simpan setiap baris
    const recordsToUpsert: PriceRecord[] = [];
    for (const row of rawRows) {
      try {
        const parsed = this.parseRow(row, marketTypeId, marketTypeName);
        if (parsed) recordsToUpsert.push(parsed);
      } catch (e) {
        result.errors++;
        this.logger.warn(`Gagal parse row: ${JSON.stringify(row)} — ${e.message}`);
      }
    }

    // Batch upsert ke PostgreSQL
    if (recordsToUpsert.length > 0) {
      const upsertResult = await this.batchUpsert(recordsToUpsert);
      result.inserted += upsertResult.inserted;
      result.updated += upsertResult.updated;
    }

    return result;
  }

  /**
   * Parse satu baris raw data dari API BI ke entity PriceRecord.
   */
  private parseRow(
    row: BiRawRow,
    marketTypeId: number,
    marketTypeName: string,
  ): PriceRecord | null {
    // Normalisasi nama komoditas → temukan ID dari konstanta
    const commodityName = (row.komoditas ?? row.nama_komoditas ?? '').trim();
    const commodity = BI_COMMODITIES.find(
      (c) => c.name.toLowerCase() === commodityName.toLowerCase(),
    );
    const category = BI_CATEGORIES.find(
      (c) => c.name.toLowerCase() === commodityName.toLowerCase(),
    );

    const currentCommodity = commodity ?? null;
    const currentCategory = commodity
      ? BI_CATEGORIES.find((cat) => cat.id === commodity.cat_id) ?? null
      : category ?? null;

    // Parse tanggal: format bisa DD/MM/YYYY atau YYYY-MM-DD
    const rawDate = row.tgl ?? row.tanggal ?? '';
    const priceDate = this.parseDate(rawDate);
    if (!priceDate) return null;

    // Parse harga
    const rawPrice = row.harga ?? row.harga_rata_rata ?? '';
    const price = this.parsePrice(rawPrice);

    // Region
    const regionName = (row.kab_kota ?? row.kabupaten ?? '').trim() || null;

    const record = this.priceRepo.create({
      commodityBiId: currentCommodity?.id ?? 'unknown',
      commodityName: commodityName || 'Unknown',
      categoryBiId: currentCategory?.id ?? 'unknown',
      categoryName: currentCategory?.name ?? 'Unknown',
      denomination: currentCommodity?.denomination ?? 'kg',
      regionBiId: null,
      regionName: regionName,
      provinceBiId: BI_PROVINCE_LAMPUNG_ID,
      marketTypeId,
      marketTypeName,
      price,
      priceType: 'harga',
      priceDate,
      source: 'BI Harga Pangan',
    });

    return record;
  }

  /**
   * Upsert batch records ke PostgreSQL.
   * Menggunakan ON CONFLICT DO UPDATE agar data terbaru selalu tersimpan.
   */
  private async batchUpsert(
    records: PriceRecord[],
  ): Promise<{ inserted: number; updated: number }> {
    if (records.length === 0) return { inserted: 0, updated: 0 };

    // TypeORM upsert dengan conflict pada unique constraint
    await this.priceRepo
      .createQueryBuilder()
      .insert()
      .into(PriceRecord)
      .values(records)
      .orUpdate(
        ['price', 'region_name', 'scraped_at'],
        ['commodity_bi_id', 'market_type_id', 'region_bi_id', 'price_date', 'price_type'],
        { skipUpdateIfNoValuesChanged: true },
      )
      .execute();

    return { inserted: records.length, updated: 0 };
  }

  /**
   * Generate array pasangan [startDate, endDate] dengan interval chunkDays.
   */
  private buildDateChunks(from: Date, to: Date, chunkDays: number): [Date, Date][] {
    const chunks: [Date, Date][] = [];
    let current = new Date(from);

    while (current <= to) {
      const chunkEnd = new Date(current);
      chunkEnd.setDate(chunkEnd.getDate() + chunkDays - 1);
      if (chunkEnd > to) chunkEnd.setTime(to.getTime());
      chunks.push([new Date(current), new Date(chunkEnd)]);
      current.setDate(current.getDate() + chunkDays);
    }

    return chunks;
  }

  private parseDate(rawDate: string): Date | null {
    if (!rawDate) return null;
    // Format DD/MM/YYYY
    const d1 = parse(rawDate.trim(), 'dd/MM/yyyy', new Date());
    if (isValid(d1)) return d1;
    // Format YYYY-MM-DD
    const d2 = parse(rawDate.trim(), 'yyyy-MM-dd', new Date());
    if (isValid(d2)) return d2;
    return null;
  }

  private parsePrice(rawPrice: string): number | null {
    if (!rawPrice || rawPrice === '-' || rawPrice === '') return null;
    const cleaned = rawPrice.replace(/\./g, '').replace(',', '.').replace(/[^0-9.]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
