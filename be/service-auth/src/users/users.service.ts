import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, Role } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async create(user: Partial<User>): Promise<User> {
    const newUser = this.usersRepository.create(user);
    return this.usersRepository.save(newUser);
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async findOrCreateByGoogle(googleProfile: {
    google_id: string;
    email: string;
    name: string;
    avatar_url: string;
  }, allowCreate: boolean = true): Promise<User | null> {
    // Cari berdasarkan google_id terlebih dahulu
    let user = await this.usersRepository.findOne({
      where: { google_id: googleProfile.google_id },
    });

    // Jika belum ada, cari berdasarkan email (mungkin sudah punya akun lokal)
    if (!user) {
      user = await this.usersRepository.findOne({
        where: { email: googleProfile.email },
      });

      if (user) {
        // Hubungkan akun lokal yang sudah ada dengan Google
        user.google_id = googleProfile.google_id;
        user.avatar_url = googleProfile.avatar_url;
        if (!user.name) user.name = googleProfile.name;
        return this.usersRepository.save(user);
      }
    }

    // Jika sama sekali belum ada
    if (!user) {
      // Tolak jika pembuatan akun tidak diizinkan (misal dari Web CMS)
      if (!allowCreate) {
        return null;
      }

      // Buat user baru dengan Role USER
      const newUser = this.usersRepository.create({
        email: googleProfile.email,
        name: googleProfile.name,
        avatar_url: googleProfile.avatar_url,
        google_id: googleProfile.google_id,
        role: Role.USER,
      });
      return this.usersRepository.save(newUser);
    }

    return user;
  }
}
