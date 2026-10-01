import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePerformanceCriterionDto {
  @ApiProperty({ example: 'Domínio do tema', maxLength: 120 })
  @IsString()
  @IsNotEmpty({ message: 'O nome do critério é obrigatório.' })
  @MaxLength(120)
  nome: string;

  @ApiPropertyOptional({ example: 'Demonstra domínio sobre o tema estudado.' })
  @IsOptional()
  @IsString()
  descricao?: string;

  @ApiPropertyOptional({ example: 1, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  ordem?: number;

  @ApiPropertyOptional({ example: 3, minimum: 0, maximum: 10 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(10)
  peso?: number;
}

export class CreatePerformanceTableDto {
  @ApiProperty({ example: 'Barema PBL', maxLength: 120 })
  @IsString()
  @IsNotEmpty({ message: 'O nome da tabela de desempenho é obrigatório.' })
  @MaxLength(120)
  nome: string;

  @ApiPropertyOptional({ example: 'Critérios padrão do módulo de Algoritmos.' })
  @IsOptional()
  @IsString()
  descricao?: string;

  @ApiProperty({ type: CreatePerformanceCriterionDto, isArray: true, minItems: 1 })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreatePerformanceCriterionDto)
  criterios: CreatePerformanceCriterionDto[];
}
