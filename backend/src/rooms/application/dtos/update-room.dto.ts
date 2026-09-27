import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateRoomDto {
  @ApiPropertyOptional({ example: 'Engenharia de Software II', maxLength: 120 })
  @IsOptional()
  @IsString({ message: 'O nome da sala deve ser um texto.' })
  @IsNotEmpty({ message: 'O nome da sala não pode ser vazio.' })
  @MaxLength(120, { message: 'O nome da sala deve ter no máximo 120 caracteres.' })
  nome?: string;

  @ApiPropertyOptional({ example: '2026.2', maxLength: 10 })
  @IsOptional()
  @IsString({ message: 'O semestre deve ser um texto.' })
  @IsNotEmpty({ message: 'O semestre não pode ser vazio.' })
  @MaxLength(10, { message: 'O semestre deve ter no máximo 10 caracteres.' })
  semestre?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean({ message: 'O campo "ativo" deve ser verdadeiro ou falso.' })
  ativo?: boolean;
}
