import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PerformanceCriterionResponseDto } from './performance-criterion-response.dto';

export class PerformanceTableResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  professorId: string;

  @ApiProperty({ example: 'Barema PBL' })
  nome: string;

  @ApiProperty({ example: false, description: 'Indica se esta é a tabela padrão protegida.' })
  isDefault: boolean;

  @ApiPropertyOptional({ nullable: true })
  descricao: string | null;

  @ApiProperty({ type: PerformanceCriterionResponseDto, isArray: true })
  criterios: PerformanceCriterionResponseDto[];

  @ApiPropertyOptional({
    type: Number,
    example: 0,
    description: 'Quantidade de problemas que utilizam esta tabela de desempenho.',
  })
  quantidadeProblemas?: number;

  @ApiProperty({ format: 'date-time' })
  criadoEm: Date;

  @ApiProperty({ format: 'date-time' })
  atualizadoEm: Date;
}
