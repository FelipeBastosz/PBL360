import { ApiProperty } from '@nestjs/swagger';
import { AdjustmentAuthorResponseDto } from './tutor-evaluation-response.dto';

export class SelfAssessmentAdjustmentDto {
  @ApiProperty() valorAnterior!: number;
  @ApiProperty() valorNovo!: number;
  @ApiProperty() justificativa!: string;
  @ApiProperty({ description: 'ID do autor do ajuste' }) autorId!: string;
  @ApiProperty({ type: String, format: 'date-time', description: 'Data e hora do ajuste' })
  criadoEm!: Date;
  @ApiProperty({ type: AdjustmentAuthorResponseDto }) autor!: AdjustmentAuthorResponseDto;
  @ApiProperty({ type: String, format: 'date-time' }) ajustadoEm!: Date;
}
export class SelfAssessmentAdjustmentHistoryResponseDto {
  @ApiProperty({
    type: Number,
    nullable: true,
    description: 'Nota calculada no envio da autoavaliação ou pares. Nunca é alterada.',
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
  @ApiProperty({ description: 'Nota original da avaliação' }) notaOriginal!: number;
  @ApiProperty({ description: 'Nota vigente da avaliação' }) notaVigente!: number;
  @ApiProperty({ type: SelfAssessmentAdjustmentDto }) ajuste!: SelfAssessmentAdjustmentDto;
}
