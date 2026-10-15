import { ApiProperty } from '@nestjs/swagger';
import { AdjustmentAuthorResponseDto } from './tutor-evaluation-response.dto';

export class SelfAssessmentAdjustmentDto {
  @ApiProperty() valorAnterior!: number;
  @ApiProperty() valorNovo!: number;
  @ApiProperty() justificativa!: string;
  @ApiProperty({ type: AdjustmentAuthorResponseDto }) autor!: AdjustmentAuthorResponseDto;
  @ApiProperty({ type: String, format: 'date-time' }) ajustadoEm!: Date;
}
export class SelfAssessmentAdjustmentHistoryResponseDto {
  @ApiProperty({
    type: Number,
    nullable: true,
    description: 'Nota calculada no envio da autoavaliação. Nunca é alterada.',
  })
  notaOriginal!: number | null;
  @ApiProperty({
    type: Number,
    nullable: true,
    description: 'Nota do ajuste mais recente ou, sem ajustes, a nota original.',
  })
  notaVigente!: number | null;
  @ApiProperty({
    type: [SelfAssessmentAdjustmentDto],
    description: 'Ajustes do mais recente para o mais antigo.',
  })
  ajustes!: SelfAssessmentAdjustmentDto[];
}
export class SelfAssessmentAdjustmentResponseDto {
  @ApiProperty({ format: 'uuid' }) alunoId!: string;
  @ApiProperty() notaOriginal!: number;
  @ApiProperty() notaVigente!: number;
  @ApiProperty({ type: SelfAssessmentAdjustmentDto }) ajuste!: SelfAssessmentAdjustmentDto;
}
