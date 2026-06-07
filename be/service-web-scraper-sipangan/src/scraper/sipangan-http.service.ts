import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import {
  SIPANGAN_BASE_URL,
  SIPANGAN_PANEL_HARGA_URL,
} from '../common/constants/sipangan-api.constants';

// ── Response Types ─────────────────────────────────────────
export interface SipanganPriceValue {
  Nilai: number;      // Harga dalam Rupiah (misal 14917)
  Tanggal: string;    // Format YYYY-MM-DD
}

export interface SipanganKotaData {
  KOTA_ID: string;
  KOTA: string;       // Nama wilayah (misal "Kabupaten Lampung Selatan")
  DATA: {
    Komoditas: string;
    Value: SipanganPriceValue[];
  };
}

export interface SipanganMapResponse {
  status: boolean;
  message_code: string;
  message: string;
  data: {
    LEVEL: string;
    HEADER: string[];
    HAPS: unknown;
    DATA: SipanganKotaData[];
  };
}

@Injectable()
export class SipanganHttpService {
  private readonly logger = new Logger(SipanganHttpService.name);
  private readonly client: AxiosInstance;
  private csrfToken = '';
  private sessionCookie = '';

  constructor() {
    this.client = axios.create({
      baseURL: SIPANGAN_PANEL_HARGA_URL,
      timeout: 120_000,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'application/json, text/plain, */*',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8',
        'X-Requested-With': 'XMLHttpRequest',
        Referer: SIPANGAN_PANEL_HARGA_URL,
      },
    });
  }

  /**
   * Inisialisasi session: GET halaman HTML untuk mengambil CSRF token
   * dan session cookie (Laravel).
   */
  async initSession(): Promise<void> {
    try {
      this.logger.log('Inisialisasi session SiPangan...');
      const response = await axios.get(SIPANGAN_PANEL_HARGA_URL, {
        timeout: 30_000,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        maxRedirects: 5,
      });

      // 1. Ambil CSRF token dari <meta name="csrf-token" content="...">
      const html: string = response.data;
      const csrfMatch = html.match(
        /<meta\s+name="csrf-token"\s+content="([^"]+)"/,
      );
      if (csrfMatch) {
        this.csrfToken = csrfMatch[1];
        this.logger.log(
          `✅ CSRF token diperoleh: ${this.csrfToken.slice(0, 20)}...`,
        );
      } else {
        this.logger.warn('⚠️ CSRF token tidak ditemukan di HTML');
      }

      // 2. Ambil session cookies
      const setCookie = response.headers['set-cookie'];
      if (setCookie && setCookie.length > 0) {
        this.sessionCookie = setCookie
          .map((c: string) => c.split(';')[0])
          .join('; ');
        this.logger.log('✅ Session cookie diperoleh');
      }

      // 3. Set ke default headers client
      this.client.defaults.headers.common['X-CSRF-TOKEN'] = this.csrfToken;
      if (this.sessionCookie) {
        this.client.defaults.headers.common['Cookie'] = this.sessionCookie;
      }
    } catch (err) {
      this.logger.error(
        `Gagal inisialisasi session SiPangan: ${(err as Error).message}`,
      );
      throw err;
    }
  }

  /**
   * Ambil data harga per Kab/Kota (map view).
   * POST /get-data-map
   *
   * Mengembalikan data harga untuk SEMUA Kab/Kota Lampung
   * pada satu tanggal tertentu.
   */
  async fetchPriceMap(params: {
    levelHarga: number;
    commodityId: number;
    commodityName: string;
    startDate: string; // format YYYY-MM-DD
    endDate: string;   // format YYYY-MM-DD
  }): Promise<SipanganKotaData[]> {
    const { levelHarga, commodityId, commodityName, startDate, endDate } = params;

    try {
      const res = await this.client.post<SipanganMapResponse>(
        '/get-data-map',
        {
          LEVEL_HARGA: String(levelHarga),
          KOMODITAS_VALUE: commodityName,
          START_DATE: startDate,
          END_DATE: endDate,
          KOMODITAS_ID_MAP: String(commodityId),
          _token: this.csrfToken,
        },
      );

      if (res.data?.status && res.data.data?.DATA) {
        return res.data.data.DATA;
      }

      this.logger.warn(
        `Response map kosong: ${commodityName} @ ${startDate} to ${endDate} — ${res.data?.message}`,
      );
      return [];
    } catch (err) {
      this.logger.error(
        `Gagal fetch map [${commodityName}, ${startDate} to ${endDate}]: ${(err as Error).message}`,
      );
      return [];
    }
  }
}
