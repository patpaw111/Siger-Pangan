import { Injectable, Inject, OnModuleInit, Logger } from '@nestjs/common';
import { ClientGrpc, RpcException } from '@nestjs/microservices';
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
          return this.formatTextResponse('Halo! Saya Siger Pangan Bot. Ada yang bisa saya bantu tentang harga bahan pokok di Lampung? Silakan sebutkan komoditas dan daerahnya.', nlpResponse);
        case 'help':
          return this.formatTextResponse('Anda bisa bertanya seperti: "Berapa harga beras di Bandar Lampung?" atau "Bandingkan harga daging sapi antara Metro dan Pringsewu".', nlpResponse);
        default:
          return this.formatTextResponse(`Maaf, saya tidak mengerti pertanyaan Anda (Intent: ${nlpResponse.intent}). Coba tanyakan harga bahan pokok dengan lebih spesifik.`, nlpResponse);
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
      // Filter result
      const specificData = resp.find(item => item.commodityName.toLowerCase().includes(nlpResponse.commodity.toLowerCase()));
      
      if (specificData) {
        const textAnswer = `Harga ${specificData.commodityName} di ${specificData.regionName || 'Provinsi Lampung'} pada tanggal ${specificData.priceDate} adalah Rp${specificData.price} per ${specificData.denomination}.`;
        return this.formatRichResponse(textAnswer, nlpResponse, specificData);
      } else {
        return this.formatTextResponse(`Mohon maaf, saat ini data harga untuk ${nlpResponse.commodity} ${nlpResponse.kabupaten ? 'di ' + nlpResponse.kabupaten : ''} belum tersedia di sistem kami.`, nlpResponse);
      }
    } catch (e) {
      return this.formatTextResponse(`Gagal mengambil data dari database harga.`, nlpResponse);
    }
  }

  private async handleComparePrice(nlpResponse: NlpResponse) {
    if (!nlpResponse.commodity) {
      return this.formatTextResponse('Komoditas apa yang ingin Anda bandingkan?', nlpResponse);
    }
    // TODO: implement logic perbandingan antara 2 kab.
    // Di NLP Result, kabupaten hanya mengembalikan teks yang termatch.
    // Kita harus ekstrak 2 kabupaten. Saat ini NLP hanya simpan satu string kabupaten utama.
    // Untuk pengembangan awal, balas dengan instruksi cek menu Heatmap:
    return this.formatTextResponse(`Untuk membandingkan harga ${nlpResponse.commodity} antar wilayah secara lengkap, silakan cek menu "Perbandingan Harga" di aplikasi ini. Fitur chatbot untuk analisis komparatif dalam tahap pengembangan.`, nlpResponse);
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
