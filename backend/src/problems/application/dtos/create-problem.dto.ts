import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { IsBrazilianDate } from '@/shared/dates/brazilian-date';

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
    description: 'Data de início do problema (formato DD-MM-AAAA).',
    example: '01-03-2026',
    pattern: '^\\d{2}-\\d{2}-\\d{4}$',
  })
  @IsOptional()
  @IsBrazilianDate({ message: 'A data de início deve estar no formato DD-MM-AAAA e ser válida.' })
  dataInicio?: string;

  @ApiPropertyOptional({
    description: 'Data de término do problema (formato DD-MM-AAAA).',
    example: '15-03-2026',
    pattern: '^\\d{2}-\\d{2}-\\d{4}$',
  })
  @IsOptional()
  @IsBrazilianDate({ message: 'A data de término deve estar no formato DD-MM-AAAA e ser válida.' })
  dataFim?: string;
}
