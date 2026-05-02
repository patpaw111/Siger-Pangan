import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { JwtStrategy } from './guards/jwt.strategy';

@Module({
  imports: [PassportModule, ConfigModule],
  providers: [JwtStrategy],
  exports: [JwtStrategy],
})
export class CommonAuthModule {}
