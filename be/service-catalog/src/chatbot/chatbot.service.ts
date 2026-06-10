import { Injectable, Inject, OnModuleInit, Logger } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';

// Interface sesuai dengan grpc message di nlp.proto
interface NlpRequest {
  sessionId: string;
  text: string;
  language: string;
}

interface NlpResponse {
  intent: string;
  confidence: number;
  commodity: string;
  kabupaten: string;
  timeExpression: string;
  rawEntities: string[];
  success: boolean;
  errorMessage: string;
  replyText?: string;
}

interface NlpServiceGrpc {
  AnalyzeMessage(data: NlpRequest): any; // RxJS Observable
}

@Injectable()
export class ChatbotService implements OnModuleInit {
  private readonly logger = new Logger(ChatbotService.name);
  private nlpServiceClient: NlpServiceGrpc;

  constructor(
    @Inject('NLP_PACKAGE') private readonly client: ClientGrpc,
    private readonly httpService: HttpService,
  ) {}

  onModuleInit() {
    this.nlpServiceClient = this.client.getService<NlpServiceGrpc>('NlpService');
  }

  async processChat(sessionId: string, text: string) {
    try {
      // 1. Panggil NLP Service rpc via gRPC
      const nlpResponse: NlpResponse = await firstValueFrom(
        this.nlpServiceClient.AnalyzeMessage({
          sessionId,
          text,
          language: 'id',
        }),
      );

      if (!nlpResponse.success) {
        return this.formatErrorResponse(`Kesalahan dari NLP: ${nlpResponse.errorMessage}`, nlpResponse);
      }

      this.logger.log(`Parsed intent: ${nlpResponse.intent}, confidence: ${nlpResponse.confidence}`);

      // 2. Berdasarkan Intent, Panggil Database / Service Lain
      switch (nlpResponse.intent) {
        case 'query_price':
          return await this.handleQueryPrice(nlpResponse);
        case 'compare_price':
          return await this.handleComparePrice(nlpResponse);
        case 'greet':
          return this.formatTextResponse(nlpResponse.replyText || 'Halo! Saya Siger Pangan Bot. Ada yang bisa saya bantu tentang harga bahan pokok di Lampung? Silakan sebutkan komoditas dan daerahnya.', nlpResponse);
        case 'help':
          return this.formatTextResponse(nlpResponse.replyText || 'Anda bisa bertanya seperti: "Berapa harga beras di Bandar Lampung?" atau "Bandingkan harga daging sapi antara Metro dan Pringsewu".', nlpResponse);
        case 'conversational':
          return this.formatTextResponse(nlpResponse.replyText || 'Maaf, saya tidak mengerti.', nlpResponse);
        default:
          // Jika intent tidak dikenali tapi ada replyText dari AI, gunakan itu
          if (nlpResponse.replyText) {
            return this.formatTextResponse(nlpResponse.replyText, nlpResponse);
          }
          return this.formatTextResponse(`Maaf, saya tidak mengerti pertanyaan Anda. Coba tanyakan harga bahan pokok dengan lebih spesifik.`, nlpResponse);
      }
    } catch (error) {
      this.logger.error(`Error processing chat: ${error.message}`);
      return this.formatErrorResponse('Maaf, service pemrosesan bahasa saat ini sedang gangguan.', null);
    }
  }

  // -------------------------------------------------------------
  // Intent Handlers
  // -------------------------------------------------------------

  private async handleQueryPrice(nlpResponse: NlpResponse) {
    if (!nlpResponse.commodity) {
      return this.formatTextResponse('Komoditas apa yang ingin Anda cari harganya? Mohon sebutkan jenisnya (misal: Beras Medium, Daging Sapi).', nlpResponse);
    }

    try {
      // 1. Fetch data dari SiPangan
      let sipanganData = [];
      try {
        const urlSipangan = `http://service-sipangan:3003/api/v1/sipangan-scraper/prices/latest?levelHargaId=3${nlpResponse.kabupaten ? '&kabupaten=' + encodeURIComponent(nlpResponse.kabupaten) : ''}`;
        const resSipangan = await firstValueFrom(this.httpService.get(urlSipangan));
        if (resSipangan.data?.success) {
          sipanganData = resSipangan.data.data;
        }
      } catch (e) {
        this.logger.error('Failed to fetch from SiPangan: ' + e.message);
      }

      // 2. Fetch data dari Bank Indonesia
      let biData = [];
      try {
        const urlBi = `http://service-web-scraper:3000/api/v1/prices/latest?marketTypeId=1${nlpResponse.kabupaten ? '&regionName=' + encodeURIComponent(nlpResponse.kabupaten) : ''}`;
        const resBi = await firstValueFrom(this.httpService.get(urlBi));
        if (resBi.data?.success) {
          biData = resBi.data.data;
        }
      } catch (e) {
        this.logger.error('Failed to fetch from BI: ' + e.message);
      }

      // 3. Filter berdasarkan komoditas (dari NLP)
      const keyword = nlpResponse.commodity.toLowerCase();
      
      let sipanganKeyword = keyword;
      if (keyword.includes('beras kualitas medium')) sipanganKeyword = 'beras medium';
      else if (keyword.includes('beras kualitas super')) sipanganKeyword = 'beras premium';
      else if (keyword.includes('minyak goreng')) sipanganKeyword = 'minyak';
      else if (keyword.includes('gula pasir')) sipanganKeyword = 'gula konsumsi';
      else if (keyword.includes('tepung terigu')) sipanganKeyword = 'tepung terigu';
      else if (keyword.includes('daging sapi')) sipanganKeyword = 'daging sapi';
      
      const filteredSipangan = sipanganData.filter((item: any) => 
        item.commodityName && item.commodityName.toLowerCase().includes(sipanganKeyword)
      ).map((item: any) => ({
        id: item.id,
        commodityName: item.commodityName,
        price: Number(item.price),
        regionName: item.regionName,
        source: 'SiPangan (Pemda)'
      }));

      console.log('Sipangan Data Total:', sipanganData.length);
      console.log('Sipangan Keyword:', sipanganKeyword);
      console.log('Filtered Sipangan Total:', filteredSipangan.length);

      const filteredBi = biData.filter((item: any) => 
        item.commodityName && item.commodityName.toLowerCase().includes(keyword)
      ).map((item: any) => ({
        id: item.id,
        commodityName: item.commodityName,
        price: Number(item.price),
        regionName: item.regionName,
        source: 'Bank Indonesia'
      }));

      const combinedData = [...filteredSipangan, ...filteredBi];

      if (combinedData.length > 0) {
        const textAnswer = nlpResponse.replyText || `Berikut adalah daftar harga ${nlpResponse.commodity} yang saya temukan dari berbagai sumber:`;
        return this.formatRichResponse(textAnswer, nlpResponse, combinedData);
      } else {
        const wilayah = nlpResponse.kabupaten ? `di ${nlpResponse.kabupaten}` : 'untuk wilayah tersebut';
        const textAnswer = `Mohon maaf, saat ini data harga ${nlpResponse.commodity} ${wilayah} belum tersedia di sistem kami. Silakan coba cari komoditas atau daerah lain ya!`;
        return this.formatTextResponse(textAnswer, nlpResponse);
      }
    } catch (e) {
      return this.formatTextResponse(`Gagal mengambil data dari database harga.`, nlpResponse);
    }
  }

  private async handleComparePrice(nlpResponse: NlpResponse) {
    if (!nlpResponse.commodity) {
      return this.formatTextResponse(nlpResponse.replyText || 'Komoditas apa yang ingin Anda bandingkan? Sebutkan jenisnya (misal: minyak, bawang).', nlpResponse);
    }

    try {
      // Sama seperti query_price, kita kumpulkan semua dan return rich response
      const res = await this.handleQueryPrice(nlpResponse);
      if (res.type === 'rich_data') {
        res.response = nlpResponse.replyText || `Berikut perbandingan harga ${nlpResponse.commodity} dari beberapa wilayah/sumber:`;
      }
      return res;
    } catch (e) {
      return this.formatTextResponse(`Gagal mengambil perbandingan data dari database harga.`, nlpResponse);
    }
  }

  // -------------------------------------------------------------
  // Response Formatters
  // -------------------------------------------------------------

  private formatTextResponse(text: string, nlpResponse: any) {
    return {
      type: 'text',
      response: text,
      nlpContext: nlpResponse,
      data: null,
    };
  }

  private formatRichResponse(text: string, nlpResponse: any, data: any) {
    return {
      type: 'rich_data',
      response: text,
      nlpContext: nlpResponse,
      data: data,
    };
  }

  private formatErrorResponse(text: string, nlpResponse: any) {
    return {
      type: 'error',
      response: text,
      nlpContext: nlpResponse,
      data: null,
    };
  }
}
