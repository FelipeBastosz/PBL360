import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, IsOptional, IsUUID } from 'class-validator';

export class UpdateProblemDto {
  @ApiProperty({
    description: 'Novo título do problema cadastrado na sala.',
    example: 'Problema 1 - Diagnóstico Clínico Revisado',
    maxLength: 120,
  })
  @IsString({ message: 'O título do problema deve ser um texto.' })
  @IsNotEmpty({ message: 'O título do problema não pode ser vazio.' })
  @MaxLength(120, { message: 'O título do problema deve ter no máximo 120 caracteres.' })
  title!: string;

  @ApiPropertyOptional({
    description:
      'Tabela de desempenho vinculada. Null remove o vínculo; omitir preserva o vínculo atual. Bloqueado após a primeira avaliação.',
    format: 'uuid',
    nullable: true,
    type: String,
  })
  @IsOptional()
  @IsUUID('4', { message: 'A tabela informada é inválida.' })
  tabelaId?: string | null;
}
