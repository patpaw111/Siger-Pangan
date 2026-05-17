import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { BiHttpService } from './src/scraper/bi-http.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const biHttp = app.get(BiHttpService);
  await biHttp.initSession();
  const regions = await biHttp.getRegencies(10);
  console.log("REGIONS_RESULT:", JSON.stringify(regions));
  await app.close();
}
bootstrap();
