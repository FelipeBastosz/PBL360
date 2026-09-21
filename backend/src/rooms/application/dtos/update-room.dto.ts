import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateRoomDto {
  @IsString({ message: 'O campo "nome" deve ser um texto.' })
  @IsOptional()
  nome?: string;

  @IsString({ message: 'O campo "semestre" deve ser um texto (Ex: 2026.2).' })
  @IsOptional()
  semestre?: string;

  @IsBoolean({ message: 'O campo "ativo" deve ser um valor booleano (verdadeiro ou falso).' })
  @IsOptional()
  ativo?: boolean;
}
