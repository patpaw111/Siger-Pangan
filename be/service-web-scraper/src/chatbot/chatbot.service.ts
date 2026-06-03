import { Injectable, Inject, OnModuleInit, Logger } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { PriceService } from '../price/price.service';

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
    private readonly priceService: PriceService,
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

    // Default cari harga hari ini / terbaru melalui API Prices Endpoint
    // Catatan: Di priceService, kita punya findLatestPrices atau query melalui model.
    // getLatestPrices di PriceService menerima (marketTypeId?, regionName?)
    let queryResult = null;
    try {
      const resp = await this.priceService.getLatestPrices({ marketTypeId: 1, kabupaten: nlpResponse.kabupaten });
      // Filter result untuk mengambil SEMUA data yang cocok (multidata)
      const specificData = resp.filter(item => 
        item.commodityName.toLowerCase().includes(nlpResponse.commodity.toLowerCase())
      );
      
      if (specificData.length > 0) {
        // Gunakan replyText dari AI, jika kosong gunakan default
        const textAnswer = nlpResponse.replyText || `Berikut adalah daftar harga ${nlpResponse.commodity} yang saya temukan:`;
        return this.formatRichResponse(textAnswer, nlpResponse, specificData); // specificData sekarang berupa Array
      } else {
        const textAnswer = nlpResponse.replyText || `Mohon maaf, saat ini data harga untuk ${nlpResponse.commodity} ${nlpResponse.kabupaten ? 'di ' + nlpResponse.kabupaten : ''} belum tersedia di sistem kami.`;
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

    // Ambil data harga dari database, sama seperti handleQueryPrice
    try {
      const resp = await this.priceService.getLatestPrices({ marketTypeId: 1, kabupaten: nlpResponse.kabupaten });
      const specificData = resp.filter(item =>
        item.commodityName.toLowerCase().includes(nlpResponse.commodity.toLowerCase())
      );

      if (specificData.length > 0) {
        const textAnswer = nlpResponse.replyText || `Berikut perbandingan harga ${nlpResponse.commodity} yang saya temukan:`;
        return this.formatRichResponse(textAnswer, nlpResponse, specificData);
      } else {
        const textAnswer = nlpResponse.replyText || `Mohon maaf, data harga untuk ${nlpResponse.commodity} belum tersedia di sistem kami.`;
        return this.formatTextResponse(textAnswer, nlpResponse);
      }
    } catch (e) {
      return this.formatTextResponse(`Gagal mengambil data dari database harga.`, nlpResponse);
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
