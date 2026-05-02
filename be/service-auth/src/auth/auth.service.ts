import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import { UsersService } from '../users/users.service';
import { RegisterDto, LoginDto, AdminCreateUserDto } from './dto/auth.dto';
import { Role } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    this.googleClient = new OAuth2Client(
      this.configService.get<string>('GOOGLE_CLIENT_ID'),
    );
  }

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('Email sudah terdaftar');
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(registerDto.password, salt);

    const user = await this.usersService.create({
      email: registerDto.email,
      password_hash,
      role: Role.USER, // Selalu paksa menjadi USER untuk registrasi publik
    });

    const { password_hash: _, ...result } = user;
    return result;
  }

  async adminCreateUser(adminCreateUserDto: AdminCreateUserDto) {
    const existingUser = await this.usersService.findByEmail(adminCreateUserDto.email);
    if (existingUser) {
      throw new ConflictException('Email sudah terdaftar');
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(adminCreateUserDto.password, salt);

    const user = await this.usersService.create({
      email: adminCreateUserDto.email,
      password_hash,
      role: adminCreateUserDto.role,
    });

    const { password_hash: _, ...result } = user;
    return result;
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Kredensial tidak valid');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Kredensial tidak valid');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      }
    };
  }

  // ─── Google OAuth: Verifikasi idToken dari Flutter ────────
  async verifyGoogleIdToken(idToken: string) {
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: this.configService.get<string>('GOOGLE_CLIENT_ID'),
      });

      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        throw new UnauthorizedException('Token Google tidak valid');
      }

      // Cari atau buat user berdasarkan data Google
      const user = await this.usersService.findOrCreateByGoogle({
        google_id: payload.sub,
        email: payload.email,
        name: payload.name || payload.email.split('@')[0],
        avatar_url: payload.picture || '',
      });

      return this.generateTokenForUser(user);
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Token Google tidak valid atau kadaluarsa');
    }
  }

  async generateTokenForUser(user: any) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar_url: user.avatar_url,
        role: user.role,
      }
    };
  }
}

