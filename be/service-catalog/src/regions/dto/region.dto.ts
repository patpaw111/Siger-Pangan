import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { RegionType } from '../entities/region.entity';

export class CreateRegionDto {
  @IsNotEmpty({ message: 'Nama wilayah tidak boleh kosong' })
  @IsString()
  name: string;

  @IsEnum(RegionType, { message: 'Tipe wilayah tidak valid' })
  type: RegionType;

  @IsOptional()
  @IsNumber({}, { message: 'Latitude harus berupa angka' })
  latitude?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Longitude harus berupa angka' })
  longitude?: number;
}

export class UpdateRegionDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(RegionType)
  type?: RegionType;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;
}
