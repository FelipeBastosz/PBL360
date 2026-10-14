import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PerformanceCriterionResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Domínio do tema' })
  nome: string;

  @ApiPropertyOptional({ nullable: true, example: 'Demonstra domínio sobre o tema estudado.' })
  descricao: string | null;

  @ApiProperty({ example: 1 })
  ordem: number;

  @ApiProperty({ example: 3 })
  peso: number;

  @ApiProperty({ example: 10, enum: [10], description: 'Limite fixo das notas dos critérios.' })
  notaMaxima: number;
}
