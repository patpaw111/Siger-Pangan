import { Controller, Post, Body, HttpCode, HttpStatus, Get, UseGuards, Request, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, AdminCreateUserDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { Role } from '../users/entities/user.entity';
import { IsString, IsNotEmpty } from 'class-validator';

class GoogleMobileDto {
  @IsString()
  @IsNotEmpty()
  idToken: string;
}

@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  async adminCreateUser(@Body() adminCreateUserDto: AdminCreateUserDto) {
    return this.authService.adminCreateUser(adminCreateUserDto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getProfile(@Request() req: any) {
    return req.user;
  }

  // ─── Google OAuth (Web — redirect flow) ───────────────────
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Guard akan menangani redirect ke halaman login Google
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(@Request() req: any, @Res() res: any) {
    const token = await this.authService.generateTokenForUser(req.user);
    // Redirect ke app dengan token via deeplink
    res.redirect(`sigerpangan://auth?token=${token.access_token}`);
  }

  // ─── Google OAuth (Mobile — native sign-in) ───────────────
  // Flutter mengirim idToken dari google_sign_in package,
  // backend verifikasi langsung ke Google tanpa browser redirect.
  @HttpCode(HttpStatus.OK)
  @Post('google/mobile')
  async googleMobileAuth(@Body() dto: GoogleMobileDto) {
    return this.authService.verifyGoogleIdToken(dto.idToken);
  }
}
