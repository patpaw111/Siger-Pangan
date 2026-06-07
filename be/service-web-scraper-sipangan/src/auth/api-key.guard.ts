import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];

    const validApiKey = this.configService.get<string>('API_KEY');

    if (!validApiKey) {
      // Jika environment belum di-set, kita tolak semua akses sebagai pengamanan
      throw new UnauthorizedException('Server configuration error: API_KEY is missing.');
    }

    if (apiKey !== validApiKey) {
      throw new UnauthorizedException('Invalid API Key provided.');
    }

    return true;
  }
}
