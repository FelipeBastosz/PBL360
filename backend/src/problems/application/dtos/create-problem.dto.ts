import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

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
    description: 'Data de início do problema (formato ISO 8601).',
    example: '2026-03-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString(
    {},
    {
      message: 'A data de início deve ser uma data válida.',
    },
  )
  dataInicio?: string;

  @ApiPropertyOptional({
    description: 'Data de término do problema (formato ISO 8601).',
    example: '2026-03-15T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString(
    {},
    {
      message: 'A data de término deve ser uma data válida.',
    },
  )
  dataFim?: string;
}
