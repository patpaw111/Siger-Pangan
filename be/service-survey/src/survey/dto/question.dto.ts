import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  ValidateNested,
  IsArray,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { QuestionType } from '../entities/survey-question.entity';

export class CreateOptionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  label: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  value?: string;

  @IsInt()
  @IsOptional()
  @Min(0)
  sortOrder?: number;
}

export class CreateQuestionDto {
  @IsString()
  @IsNotEmpty()
  questionText: string;

  @IsEnum(QuestionType)
  questionType: QuestionType;

  @IsInt()
  @IsOptional()
  @Min(0)
  sortOrder?: number;

  @IsBoolean()
  @IsOptional()
  isRequired?: boolean;

  @IsOptional()
  metadata?: Record<string, unknown>;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOptionDto)
  @IsOptional()
  options?: CreateOptionDto[];
}

export class UpdateQuestionDto {
  @IsString()
  @IsOptional()
  questionText?: string;

  @IsEnum(QuestionType)
  @IsOptional()
  questionType?: QuestionType;

  @IsInt()
  @IsOptional()
  @Min(0)
  sortOrder?: number;

  @IsBoolean()
  @IsOptional()
  isRequired?: boolean;

  @IsOptional()
  metadata?: Record<string, unknown>;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOptionDto)
  @IsOptional()
  options?: CreateOptionDto[];
}
