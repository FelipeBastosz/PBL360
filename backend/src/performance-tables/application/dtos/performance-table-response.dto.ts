import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PerformanceCriterionResponseDto } from './performance-criterion-response.dto';

export class PerformanceTableResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ type: String, format: 'uuid', nullable: true })
  professorId: string | null;

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

  @ApiPropertyOptional({ type: Number, example: 2 })
  quantidadeSessoes?: number;

  @ApiPropertyOptional({
    type: Number,
    example: 1,
    description: 'Sessões cuja data já passou; nesse caso somente os pesos podem ser alterados.',
  })
  quantidadeSessoesPassadas?: number;

  @ApiProperty({ format: 'date-time' })
  criadoEm: Date;

  @ApiProperty({ format: 'date-time' })
  atualizadoEm: Date;
}
