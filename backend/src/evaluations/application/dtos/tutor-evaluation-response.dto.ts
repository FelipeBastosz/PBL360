import { ApiProperty } from '@nestjs/swagger';
import { EvaluationStatusResponse } from './session-evaluation-summary-response.dto';
import { ProblemEvaluationCriteriaResponseDto } from './problem-evaluation-criteria-response.dto';

export class EvaluationScoreResponseDto {
  @ApiProperty({ format: 'uuid' }) criterioId!: string;
  @ApiProperty({ minimum: 0, maximum: 10 }) nota!: number;
}
export class AdjustmentAuthorResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() nome!: string;
}
export class GradeAdjustmentResponseDto {
  @ApiProperty({ format: 'uuid' }) criterioId!: string;
  @ApiProperty() valorAnterior!: number;
  @ApiProperty() valorNovo!: number;
  @ApiProperty() justificativa!: string;
  @ApiProperty({ type: AdjustmentAuthorResponseDto }) autor!: AdjustmentAuthorResponseDto;
  @ApiProperty({ type: String, format: 'date-time' }) ajustadoEm!: Date;
}
export class TutorEvaluationResponseDto extends ProblemEvaluationCriteriaResponseDto {
  @ApiProperty({ enum: EvaluationStatusResponse }) status!: EvaluationStatusResponse;
  @ApiProperty({ type: String, format: 'date-time', nullable: true }) enviadaEm!: Date | null;
  @ApiProperty({ type: [EvaluationScoreResponseDto] }) itens!: EvaluationScoreResponseDto[];
  @ApiProperty({ type: [GradeAdjustmentResponseDto] }) ajustes!: GradeAdjustmentResponseDto[];
  @ApiProperty({ type: Number, nullable: true }) notaSessao!: number | null;
  @ApiProperty({
    description: 'False indica prévia; a configuração será fixada no primeiro salvamento.',
  })
  configuracaoFixada!: boolean;
  @ApiProperty({
    type: Number,
    nullable: true,
    description: 'Adicional preservado no primeiro envio.',
  })
  adicionalAplicado!: number | null;
}
