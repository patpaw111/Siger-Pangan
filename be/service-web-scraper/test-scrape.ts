import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { ScraperService } from './src/scraper/scraper.service';
import { subDays } from 'date-fns';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const scraper = app.get(ScraperService);
  
  console.log("Triggering manual scrape for last 7 days...");
  const result = await scraper.scrapeAll({
    marketTypeIds: [1], // Pasar Tradisional saja untuk tes
    startDate: subDays(new Date(), 7),
    endDate: new Date(),
    jobId: 'manual-test-run',
  });
  
  console.log("Scrape result:", result);
  await app.close();
}
bootstrap();
