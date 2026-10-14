import { ApiProperty } from '@nestjs/swagger';

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
}

export class StudentEvaluationSummaryResponseDto {
  @ApiProperty({ type: StudentSelfAssessmentSummaryDto })
  autoavaliacao!: StudentSelfAssessmentSummaryDto;
  @ApiProperty({ type: StudentPeerAssessmentSummaryDto }) pares!: StudentPeerAssessmentSummaryDto;
  @ApiProperty({ type: StudentFeedbackSummaryDto }) feedback!: StudentFeedbackSummaryDto;
}

export class SelfAssessmentCriterionDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() nome!: string;
  @ApiProperty() peso!: number;
  @ApiProperty({ example: 10, enum: [10] }) notaMaxima!: number;
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
  @ApiProperty({ required: false, example: 8.25 }) notaConsolidada?: number | null;
}
