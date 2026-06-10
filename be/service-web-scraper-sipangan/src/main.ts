import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT ?? 3003;

  // CORS — izinkan semua port dev lokal yang umum dipakai FE
  const defaultOrigins = [
    'https://www.sigerpangan.my.id',
    'https://sigerpangan.my.id',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
    'http://localhost:8080',
    'http://127.0.0.1:5500',
  ];
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') ?? defaultOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
  });

  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Service Web Scraper SiPangan berjalan di: http://0.0.0.0:${port}/api/v1`);
}
bootstrap();
