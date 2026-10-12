import { ApiProperty } from '@nestjs/swagger';

export class ProblemResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  salaId: string;

  @ApiProperty({ example: 'Problema 1 - Diagnóstico Clínico' })
  titulo: string;

  @ApiProperty({ nullable: true, type: String, example: 'Caso clínico detalhado para tutorial.' })
  descricao: string | null;

  @ApiProperty({ example: 1, description: 'Posição sequencial do problema na sala.' })
  ordem: number;

  @ApiProperty({ nullable: true, type: String, format: 'date', example: '2026-03-01' })
  dataInicio: string | null;

  @ApiProperty({ nullable: true, type: String, format: 'date', example: '2026-03-15' })
  dataFim: string | null;

  @ApiProperty({ example: false })
  autoavaliacaoLiberada: boolean;

  @ApiProperty({ example: false })
  avaliacaoEntreParesLiberada: boolean;

  @ApiProperty({ nullable: true, type: Date, format: 'date-time' })
  liberadoEm: Date | null;

  @ApiProperty({ nullable: true, type: Date, format: 'date-time' })
  prazoAutoavaliacao: Date | null;

  @ApiProperty({ format: 'uuid' })
  criadoPor: string;

  @ApiProperty({ format: 'date-time' })
  criadoEm: Date;

  @ApiProperty({ format: 'date-time' })
  atualizadoEm: Date;
}
