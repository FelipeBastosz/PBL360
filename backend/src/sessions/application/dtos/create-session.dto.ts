import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export class CreateSessionDto {
  @ApiProperty({ example: 'Introdução ao problema' })
  @IsString({ message: 'O título deve ser um texto.' })
  @IsNotEmpty({ message: 'O título é obrigatório.' })
  @Matches(/\S/, { message: 'O título é obrigatório.' })
  @MaxLength(120, { message: 'O título deve ter no máximo 120 caracteres.' })
  titulo: string;

  @ApiProperty({ example: 'Material e preparação da atividade.', nullable: true })
  @ValidateIf((_object, value) => value !== null)
  @IsString({ message: 'A descrição deve ser um texto ou nula.' })
  @MaxLength(1000, { message: 'A descrição deve ter no máximo 1000 caracteres.' })
  descricao: string | null;

  @ApiProperty({ example: '2026-10-15', format: 'date' })
  @IsDateString(
    { strict: true, strictSeparator: true },
    { message: 'A data deve estar no formato AAAA-MM-DD.' },
  )
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'A data deve estar no formato AAAA-MM-DD.' })
  data: string;
}
