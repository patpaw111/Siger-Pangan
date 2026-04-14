import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global API prefix
  app.setGlobalPrefix('api/v1');

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // CORS — izinkan semua port dev lokal yang umum dipakai FE
  // Override via env: ALLOWED_ORIGINS=http://domain1.com,http://domain2.com
  const defaultOrigins = [
    'http://localhost:3000',  // Next.js (default)
    'http://localhost:3001',  // Next.js (alt) / CRA
    'http://localhost:5173',  // Vite
    'http://localhost:5174',  // Vite (alt)
    'http://localhost:4200',  // Angular
    'http://localhost:8081',  // Flutter web (alt)
    'http://localhost:8080',  // Adminer / Flutter web
    'http://127.0.0.1:5500', // VS Code Live Server
  ];
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') ?? defaultOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 Service Web Scraper berjalan di: http://localhost:${port}/api/v1`);
}
bootstrap();
