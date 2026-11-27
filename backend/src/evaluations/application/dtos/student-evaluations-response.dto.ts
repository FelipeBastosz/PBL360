import { ApiProperty } from '@nestjs/swagger';
import { EvaluationFormulaDto } from './evaluation-formula.dto';

const SELF_STATUSES = [
  'INDISPONIVEL',
  'PENDENTE',
  'RASCUNHO',
  'ENVIADA',
  'ENCERRADA',
  'NAO_PARTICIPOU',
];

export class StudentSelfAssessmentSummaryDto {
  @ApiProperty() liberada!: boolean;
  @ApiProperty({ nullable: true }) prazo!: Date | null;
  @ApiProperty({ enum: SELF_STATUSES }) status!: string;
}

export class StudentPeerAssessmentSummaryDto {
  @ApiProperty() liberada!: boolean;
  @ApiProperty({ nullable: true }) prazo!: Date | null;
  @ApiProperty() avaliados!: number;
  @ApiProperty() total!: number;
}

export class StudentFeedbackSummaryDto {
  @ApiProperty() disponivel!: boolean;
  @ApiProperty() novo!: boolean;
  @ApiProperty({
    description: 'Indica se o tutor já enviou a avaliação deste aluno para a sessão.',
  })
  avaliacaoTutorEnviada!: boolean;
}

export class StudentEvaluationSummaryResponseDto {
  @ApiProperty({ type: StudentSelfAssessmentSummaryDto })
  autoavaliacao!: StudentSelfAssessmentSummaryDto;
  @ApiProperty({ type: StudentPeerAssessmentSummaryDto }) pares!: StudentPeerAssessmentSummaryDto;
  @ApiProperty({ type: StudentFeedbackSummaryDto }) feedback!: StudentFeedbackSummaryDto;
  @ApiProperty({
    type: Boolean,
    nullable: true,
    description:
      'Se o aluno esteve presente ou atrasado na chamada. Null enquanto a chamada não foi salva.',
  })
  participou!: boolean | null;
}

export class SelfAssessmentCriterionDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() nome!: string;
  @ApiProperty() peso!: number;
  @ApiProperty({ example: 10, enum: [10] }) notaMaxima!: number;
  @ApiProperty({ example: 1, description: 'Posição do critério na fórmula.' }) ordem!: number;
}

export class SelfAssessmentItemDto {
  @ApiProperty({ format: 'uuid' }) criterioId!: string;
  @ApiProperty({ example: 8.5 }) nota!: number;
}

export class SelfAssessmentResponseDto {
  @ApiProperty({ enum: SELF_STATUSES }) status!: string;
  @ApiProperty({ nullable: true }) prazo!: Date | null;
  @ApiProperty({ nullable: true }) enviadaEm!: Date | null;
  @ApiProperty({ type: SelfAssessmentCriterionDto, isArray: true })
  criterios!: SelfAssessmentCriterionDto[];
  @ApiProperty({ type: SelfAssessmentItemDto, isArray: true }) itens!: SelfAssessmentItemDto[];
  @ApiProperty({ type: String, nullable: true }) papel?: string | null;
  @ApiProperty({ type: Number, nullable: true }) notaCargo?: number | null;
  @ApiProperty({ type: EvaluationFormulaDto, required: false })
  formula?: EvaluationFormulaDto;
  @ApiProperty({ required: false, example: 8.25 }) notaConsolidada?: number | null;
  @ApiProperty({
    type: Boolean,
    nullable: true,
    description:
      'Se o aluno esteve presente ou atrasado na chamada. Null enquanto a chamada não foi salva.',
  })
  participou!: boolean | null;
}
