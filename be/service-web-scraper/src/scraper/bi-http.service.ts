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
  komoditas: string;
  kab_kota: string;
  tgl: string;
  harga: string;
  harga_tertinggi?: string;
  harga_terendah?: string;
  harga_rata_rata?: string;
  // field lain mungkin ada tergantung response
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
        Referer: BI_BASE_URL + '/hargapangan',
      },
    });
  }

  /**
   * Inisialisasi session cookie dengan mengunjungi halaman utama.
   * Diperlukan karena API BI membutuhkan session yang valid.
   */
  async initSession(): Promise<void> {
    try {
      this.logger.log('Menginisialisasi session ke BI Harga Pangan...');
      const response = await axios.get(BI_BASE_URL + '/hargapangan', {
        timeout: 30_000,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        },
        maxRedirects: 5,
      });

      // Ambil Set-Cookie dari response
      const setCookie = response.headers['set-cookie'];
      if (setCookie && setCookie.length > 0) {
        this.sessionCookie = setCookie
          .map((c: string) => c.split(';')[0])
          .join('; ');
        this.client.defaults.headers.common['Cookie'] = this.sessionCookie;
        this.logger.log(`Session cookie berhasil diambil`);
      } else {
        this.logger.warn('Tidak ada Set-Cookie diterima dari BI, akan coba tanpa session');
      }
    } catch (err) {
      this.logger.error(`Gagal inisialisasi session: ${err.message}`);
    }
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
   * @param marketTypeId  1=Tradisional, 2=Modern, 3=Pedagang Besar
   * @param startDate     format 'DD/MM/YYYY'
   * @param endDate       format 'DD/MM/YYYY'
   * @param provinceId    10 = Lampung
   * @param commodityId   'com_1'|'cat_1'|'0' (0 = semua)
   * @param regencyId     0 = semua kabupaten
   */
  async fetchPriceData(params: {
    marketTypeId: number;
    startDate: string;
    endDate: string;
    provinceId?: number;
    commodityId?: string;
    regencyId?: number;
  }): Promise<BiRawRow[]> {
    const {
      marketTypeId,
      startDate,
      endDate,
      provinceId = 10,
      commodityId = '0',
      regencyId = 0,
    } = params;

    try {
      // Coba endpoint GetGridDataDaerah (Berdasarkan Daerah)
      const res = await this.client.post('/GetGridDataDaerah', null, {
        params: {
          prov_id: provinceId,
          market_type: marketTypeId,
          start_date: startDate,
          end_date: endDate,
          comcat_id: commodityId,
          kab_kota_id: regencyId,
          draw: 1,
          start: 0,
          length: -1, // ambil semua data
        },
      });

      const rows: BiRawRow[] = res.data?.data ?? [];
      this.logger.debug(`Berhasil ambil ${rows.length} baris (market_type=${marketTypeId}, ${startDate}→${endDate})`);
      return rows;
    } catch (err) {
      this.logger.error(
        `Gagal fetch data harga [market_type=${marketTypeId}, ${startDate}→${endDate}]: ${err.message}`,
      );

      // Fallback ke endpoint alternatif
      return this.fetchPriceDataFallback(params);
    }
  }

  /**
   * Fallback endpoint jika GetGridDataDaerah gagal.
   */
  private async fetchPriceDataFallback(params: {
    marketTypeId: number;
    startDate: string;
    endDate: string;
    provinceId?: number;
    commodityId?: string;
    regencyId?: number;
  }): Promise<BiRawRow[]> {
    const { marketTypeId, startDate, endDate, provinceId = 10, commodityId = '0', regencyId = 0 } = params;

    try {
      const res = await this.client.get('/GetGridDataDaerah', {
        params: {
          prov_id: provinceId,
          market_type: marketTypeId,
          start_date: startDate,
          end_date: endDate,
          comcat_id: commodityId,
          kab_kota_id: regencyId,
        },
      });
      return res.data?.data ?? [];
    } catch (fallbackErr) {
      this.logger.error(`Fallback juga gagal: ${fallbackErr.message}`);
      return [];
    }
  }
}
