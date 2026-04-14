import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { ChatbotController } from './chatbot.controller';
import { ChatbotService } from './chatbot.service';
import { PriceModule } from '../price/price.module'; // To query actual prices

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'NLP_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: 'nlp',
          protoPath: join(process.cwd(), 'proto/nlp.proto'), // Path at /app/proto/nlp.proto in Docker
          url: process.env.NLP_GRPC_URL || 'siger-nlp-dev:50051',
        },
      },
    ]),
    PriceModule, // Import so we can use PriceService
  ],
  controllers: [ChatbotController],
  providers: [ChatbotService],
})
export class ChatbotModule {}
