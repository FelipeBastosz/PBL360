import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PerformanceCriterionResponseDto } from './performance-criterion-response.dto';

export class PerformanceTableResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  professorId: string;

  @ApiProperty({ example: 'Barema PBL' })
  nome: string;

  @ApiPropertyOptional({ nullable: true })
  descricao: string | null;

  @ApiProperty({ type: PerformanceCriterionResponseDto, isArray: true })
  criterios: PerformanceCriterionResponseDto[];

  @ApiProperty({ format: 'date-time' })
  criadoEm: Date;

  @ApiProperty({ format: 'date-time' })
  atualizadoEm: Date;
}
