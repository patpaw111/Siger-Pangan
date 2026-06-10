import { IsEmail, IsEnum, IsNotEmpty, IsOptional, MinLength, IsString } from 'class-validator';
import { Role } from '../../users/entities/user.entity';

export class RegisterDto {
  @IsOptional()
  @IsString({ message: 'Nama harus berupa teks' })
  name?: string;

  @IsEmail({}, { message: 'Format email tidak valid' })
  @IsNotEmpty({ message: 'Email tidak boleh kosong' })
  email: string;

  @IsNotEmpty({ message: 'Password tidak boleh kosong' })
  @MinLength(6, { message: 'Password minimal 6 karakter' })
  password: string;

}

export class AdminCreateUserDto {
  @IsOptional()
  @IsString({ message: 'Nama harus berupa teks' })
  name?: string;

  @IsEmail({}, { message: 'Format email tidak valid' })
  @IsNotEmpty({ message: 'Email tidak boleh kosong' })
  email: string;

  @IsNotEmpty({ message: 'Password tidak boleh kosong' })
  @MinLength(6, { message: 'Password minimal 6 karakter' })
  password: string;

  @IsNotEmpty({ message: 'Role tidak boleh kosong' })
  @IsEnum(Role, { message: 'Role tidak valid' })
  role: Role;
}

export class LoginDto {
  @IsEmail({}, { message: 'Format email tidak valid' })
  @IsNotEmpty({ message: 'Email tidak boleh kosong' })
  email: string;

  @IsNotEmpty({ message: 'Password tidak boleh kosong' })
  password: string;
}
