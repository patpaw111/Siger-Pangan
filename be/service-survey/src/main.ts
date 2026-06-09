import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.setGlobalPrefix('api/v1');
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  const port = process.env.PORT || 3004;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Service Survey is running on: http://0.0.0.0:${port}/api/v1`);
}
bootstrap();
