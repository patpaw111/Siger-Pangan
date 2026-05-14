import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID') || 'placeholder',
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET') || 'placeholder',
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL') || 'http://localhost:3001/api/v1/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: (err: any, user: any, info?: any) => void,
  ): Promise<any> {
    const { id, name, emails, photos } = profile;

    // Untuk Web CMS, kita set allowCreate = false
    const user = await this.usersService.findOrCreateByGoogle({
      google_id: id,
      email: emails[0].value,
      name: `${name.givenName} ${name.familyName}`,
      avatar_url: photos[0]?.value || null,
    }, false);

    if (!user) {
      // Return false agar Passport menganggap autentikasi gagal
      return done(null, false, { message: 'Akun belum terdaftar. Hubungi Super Admin.' } as any);
    }

    done(null, user);
  }
}
