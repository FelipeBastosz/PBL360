import { ApiProperty } from '@nestjs/swagger';

export class PerformanceTableSummaryResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid', description: 'Professor proprietário da tabela.' })
  professorId: string;

  @ApiProperty({ example: 'Tabela de Desempenho 1' })
  nome: string;

  @ApiProperty({
    format: 'string',
    description: 'Descrição da tabela de desempenho.',
    nullable: true,
  })
  descricao: string | null;

  @ApiProperty({ format: 'integer', example: 3, description: 'Quantidade de critérios ativos.' })
  quantidadeCriterios: number;

  @ApiProperty({
    format: 'integer',
    example: 2,
    description: 'Quantidade de problemas ativos que usam a tabela.',
  })
  quantidadeProblemas: number;

  @ApiProperty({
    format: 'date-time',
    description: 'Data de criação da tabela de desempenho.',
    example: '2026-03-01T12:00:00Z',
  })
  criadoEm: Date;

  @ApiProperty({
    format: 'date-time',
    description: 'Data de atualização da tabela de desempenho.',
    example: '2026-03-01T12:00:00Z',
  })
  atualizadoEm: Date;
}
