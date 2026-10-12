import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PerformanceCriterionResponseDto } from './performance-criterion-response.dto';
import { PerformanceTableOrigin } from '../../domain/repositories/performance-table.repository';

export class PerformanceTableAuthorDto {
  @ApiProperty({ format: 'uuid', example: 'd3b07384-d113-4944-9c80-e74f1784c6c2' })
  id: string;

  @ApiProperty({ example: 'Carlos Mendes' })
  nome: string;
}

export class RoomPerformanceTableItemResponseDto {
  @ApiProperty({ format: 'uuid', example: 'e5b07384-d113-4944-9c80-e74f1784c6c3' })
  id: string;

  @ApiProperty({ example: 'Barema da Turma' })
  nome: string;

  @ApiPropertyOptional({ example: 'Critérios avaliativos da turma.', nullable: true })
  descricao?: string | null;

  @ApiProperty({
    enum: PerformanceTableOrigin,
    example: PerformanceTableOrigin.TURMA,
    description: 'Origem da tabela: TURMA, PESSOAL ou PADRAO.',
  })
  origem: PerformanceTableOrigin;

  @ApiProperty({ type: PerformanceTableAuthorDto })
  autor: PerformanceTableAuthorDto;

  @ApiProperty({ type: PerformanceCriterionResponseDto, isArray: true })
  criterios: PerformanceCriterionResponseDto[];

  @ApiProperty({
    example: 2,
    description: 'Número de sessões que utilizam esta tabela de desempenho.',
  })
  emUso: number;
}
