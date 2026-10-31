import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import type { AdjustmentTarget } from '../../domain/repositories/self-assessment-adjustment.repository';

export class ListSelfAssessmentAdjustmentsQueryDto {
  @ApiPropertyOptional({
    enum: ['AUTOAVALIACAO', 'PARES'],
    description: 'Tipo de avaliação para consultar histórico. Opcional.',
  })
  @IsOptional()
  @IsIn(['AUTOAVALIACAO', 'PARES'], {
    message: 'O tipo deve ser AUTOAVALIACAO ou PARES.',
  })
  tipo?: AdjustmentTarget;
}
