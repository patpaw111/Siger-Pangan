import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT ?? 3003;

  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Service Web Scraper SiPangan berjalan di: http://0.0.0.0:${port}/api/v1`);
}
bootstrap();
