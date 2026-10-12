import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

const CALENDAR_DATE = /^\d{4}-\d{2}-\d{2}$/;

export class CreateProblemDto {
  @ApiProperty({
    description: 'Título do problema cadastrado na sala.',
    example: 'Problema 1 - Diagnóstico Clínico',
    maxLength: 120,
  })
  @IsString({
    message: 'O título do problema deve ser um texto.',
  })
  @IsNotEmpty({
    message: 'O título do problema é obrigatório.',
  })
  @MaxLength(120, {
    message: 'O título do problema deve ter no máximo 120 caracteres.',
  })
  titulo: string;

  @ApiPropertyOptional({
    description: 'Descrição detalhada do problema.',
    example: 'Caso clínico detalhado para tutorial.',
  })
  @IsOptional()
  @IsString({
    message: 'A descrição do problema deve ser um texto.',
  })
  descricao?: string;

  @ApiPropertyOptional({
    description: 'Data de início do problema (formato AAAA-MM-DD).',
    example: '2026-03-01',
    format: 'date',
  })
  @IsOptional()
  @Matches(CALENDAR_DATE, { message: 'A data de início deve estar no formato AAAA-MM-DD.' })
  @IsDateString({ strict: true }, { message: 'A data de início deve ser uma data válida.' })
  dataInicio?: string;

  @ApiPropertyOptional({
    description: 'Data de término do problema (formato AAAA-MM-DD).',
    example: '2026-03-15',
    format: 'date',
  })
  @IsOptional()
  @Matches(CALENDAR_DATE, { message: 'A data de término deve estar no formato AAAA-MM-DD.' })
  @IsDateString({ strict: true }, { message: 'A data de término deve ser uma data válida.' })
  dataFim?: string;
}
