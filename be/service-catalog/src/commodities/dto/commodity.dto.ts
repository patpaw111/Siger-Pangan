import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCommodityDto {
  @IsNotEmpty({ message: 'Nama komoditas tidak boleh kosong' })
  @IsString()
  name: string;

  @IsNotEmpty({ message: 'Satuan tidak boleh kosong' })
  @IsString()
  unit: string;

  @IsOptional()
  @IsString()
  image_url?: string;
}

export class UpdateCommodityDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsString()
  image_url?: string;
}
