import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { BI_API_BASE, BI_BASE_URL } from '../common/constants/bi-api.constants';

export interface BiPriceRow {
  commodityId: string;
  commodityName: string;
  regionId: number | null;
  regionName: string | null;
  date: string;           // format: DD/MM/YYYY dari API
  price: number | null;
  priceType: string;
  marketTypeId: number;
}

export interface BiRawRow {
  // ── Field-field yang dikonfirmasi dari network inspection BI PIHPS ──
  komoditas?: string;
  kab_kota?: string;
  tgl?: string;          // format: YYYY-MM-DD atau DD/MM/YYYY
  harga?: string;
  harga_tertinggi?: string;
  harga_terendah?: string;
  harga_rata_rata?: string;
  // Field alternatif (tergantung versi endpoint)
  commodity_name?: string;
  regency_name?: string;
  price_date?: string;
  price?: string;
  [key: string]: string | undefined;
}

export interface BiApiResponse {
  data: BiRawRow[];
  recordsTotal?: number;
  recordsFiltered?: number;
}

@Injectable()
export class BiHttpService {
  private readonly logger = new Logger(BiHttpService.name);
  private readonly client: AxiosInstance;
  private sessionCookie: string = '';

  constructor() {
    this.client = axios.create({
      baseURL: BI_API_BASE,
      timeout: 30_000,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'application/json, text/javascript, */*; q=0.01',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8',
        'X-Requested-With': 'XMLHttpRequest',
        // Referer harus menunjuk ke halaman yang memuat grid tersebut
        Referer: `${BI_BASE_URL}/TabelHarga/PasarTradisionalDaerah`,
      },
    });
  }

  /**
   * Inisialisasi session cookie dengan mengunjungi halaman BI.
   * Non-fatal: jika gagal, scraping tetap dicoba tanpa session.
   * BI PIHPS menggunakan ASP.NET session — cookie diperoleh dari halaman HTML.
   */
  async initSession(): Promise<void> {
    // Coba beberapa kandidat URL halaman BI (urut dari yang paling mungkin valid)
    const candidateUrls = [
      `${BI_BASE_URL}/TabelHarga/PasarTradisionalDaerah`,
      `${BI_BASE_URL}/home/index`,
      BI_BASE_URL,
    ];

    for (const url of candidateUrls) {
      try {
        this.logger.log(`Mencoba init session dari: ${url}`);
        const response = await axios.get(url, {
          timeout: 30_000,
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          },
          maxRedirects: 5,
          validateStatus: (status) => status < 500, // terima 2xx dan 3xx
        });

        const setCookie = response.headers['set-cookie'];
        if (setCookie && setCookie.length > 0) {
          this.sessionCookie = setCookie
            .map((c: string) => c.split(';')[0])
            .join('; ');
          this.client.defaults.headers.common['Cookie'] = this.sessionCookie;
          this.logger.log(`✅ Session cookie berhasil dari: ${url}`);
          return; // Sukses, tidak perlu coba URL berikutnya
        }

        this.logger.debug(`Tidak ada Set-Cookie dari ${url} (status: ${response.status}), coba URL berikutnya...`);
      } catch (err) {
        this.logger.debug(`Gagal akses ${url}: ${err.message}`);
      }
    }

    // Semua URL gagal — lanjutkan tanpa session (BI mungkin tidak wajib session untuk data API)
    this.logger.warn(
      '⚠️  Tidak berhasil mendapat session cookie dari BI. ' +
      'Akan tetap mencoba fetch data (beberapa endpoint BI tidak wajib session).',
    );
  }

  /**
   * Ambil daftar kabupaten/kota Lampung dari API BI
   */
  async getRegencies(provinceId: number = 10): Promise<Array<{ id: number; name: string }>> {
    try {
      const res = await this.client.get('/GetRefRegency', {
        params: { ref_prov_id: provinceId },
      });
      return res.data?.data ?? [];
    } catch (err) {
      this.logger.error(`Gagal ambil daftar kabupaten: ${err.message}`);
      return [];
    }
  }

  /**
   * Ambil data harga dari API BI untuk range tanggal tertentu.
   *
   * Parameter dikonfirmasi valid dari browser network inspection:
   * - price_type_id : 1=Tradisional, 2=Modern, 3=Pedagang Besar
   * - province_id   : "10" untuk Lampung, ATAU string kosong "" untuk semua provinsi
   *                   ⚠️  angka 0 atau "0" = data kosong!
   * - comcat_id     : "" atau string kosong = semua komoditas
   *                   ⚠️  "0" atau angka 0 = data kosong!
   * - regency_id    : "" = semua kabupaten
   * - market_id     : "" = semua pasar
   * - tipe_laporan  : 1 = Laporan Harian
   * - start_date    : format YYYY-MM-DD
   * - end_date      : format YYYY-MM-DD
   */
  async fetchPriceData(params: {
    marketTypeId: number;
    startDate: string;   // format: YYYY-MM-DD
    endDate: string;     // format: YYYY-MM-DD
    provinceId?: number | string;  // 10 untuk Lampung, atau "" untuk semua
    commodityId?: string;          // "" untuk semua komoditas
    regencyId?: number | string;   // "" untuk semua kabupaten
  }): Promise<BiRawRow[]> {
    const {
      marketTypeId,
      startDate,
      endDate,
      provinceId = 10,
      commodityId = '',   // ← PENTING: string kosong untuk semua!
      regencyId = '',     // ← PENTING: string kosong untuk semua!
    } = params;

    try {
      // Params dikonfirmasi valid dari browser network inspection BI PIHPS
      const res = await this.client.get('/GetGridDataDaerah', {
        params: {
          price_type_id: marketTypeId,
          province_id: provinceId,   // 10 untuk Lampung
          comcat_id: commodityId,    // "" = semua komoditas
          regency_id: regencyId,     // "" = semua kabupaten
          market_id: '',             // "" = semua pasar
          tipe_laporan: 1,           // 1 = Laporan Harian
          start_date: startDate,     // format: YYYY-MM-DD ✔̲
          end_date: endDate,         // format: YYYY-MM-DD ✔̲
          draw: 1,
          start: 0,
          length: -1,
        },
      });

      const rows: BiRawRow[] = res.data?.data ?? [];
      this.logger.debug(`Berhasil ambil ${rows.length} baris (market_type=${marketTypeId}, ${startDate}→${endDate})`);
      return rows;
    } catch (err) {
      this.logger.error(
        `Gagal fetch data harga [market_type=${marketTypeId}, ${startDate}→${endDate}]: ${err.message}`,
      );
      return [];
    }
  }

}
