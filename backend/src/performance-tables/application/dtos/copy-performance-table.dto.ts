import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, Matches, MaxLength } from 'class-validator';

export class CopyPerformanceTableDto {
  @ApiPropertyOptional({ example: 'Meu padrão', maxLength: 120 })
  @IsOptional()
  @IsString()
  @Matches(/\S/, { message: 'O nome da cópia não pode estar vazio.' })
  @MaxLength(120)
  nome?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Turma da cópia; omitido cria uma tabela pessoal.',
  })
  @IsOptional()
  @IsUUID('4')
  salaId?: string;
}
