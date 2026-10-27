import { ApiProperty } from '@nestjs/swagger';
import { AdjustmentAuthorResponseDto } from './tutor-evaluation-response.dto';

export class ComparisonStudentDto {
  @ApiProperty({ format: 'uuid', description: 'ID do aluno.' })
  alunoId!: string;

  @ApiProperty({ description: 'Nome completo do aluno.' })
  nome!: string;
}

export class ComparisonCriterionItemDto {
  @ApiProperty({ format: 'uuid', description: 'ID do critério.' })
  criterioId!: string;

  @ApiProperty({ description: 'Nome do critério avaliado.' })
  nome!: string;

  @ApiProperty({
    type: Number,
    nullable: true,
    description: 'Nota autoatribuída pelo aluno neste critério. Null se não enviada.',
  })
  notaAluno!: number | null;

  @ApiProperty({
    type: Number,
    nullable: true,
    description: 'Nota atribuída pelo tutor neste critério. Null se ainda não avaliado.',
  })
  notaTutor!: number | null;
}

export class ComparisonSelfAssessmentDto {
  @ApiProperty({
    description:
      'Situação da autoavaliação (INDISPONIVEL, PENDENTE, RASCUNHO, ENVIADA, ENCERRADA, NAO_PARTICIPOU).',
  })
  status!: string;

  @ApiProperty({
    type: String,
    format: 'date-time',
    nullable: true,
    description: 'Data/hora de envio da autoavaliação.',
  })
  enviadaEm!: Date | null;

  @ApiProperty({
    type: Number,
    nullable: true,
    description: 'Nota consolidada original da autoavaliação do aluno. Null se não enviada.',
  })
  notaConsolidada!: number | null;

  @ApiProperty({
    type: [ComparisonCriterionItemDto],
    description: 'Comparativo critério a critério entre a autoavaliação e a nota do tutor.',
  })
  itens!: ComparisonCriterionItemDto[];
}

export class PeerEvaluationItemScoreDto {
  @ApiProperty({ format: 'uuid', description: 'ID do critério.' })
  criterioId!: string;

  @ApiProperty({ description: 'Nota atribuída pelo colega neste critério.' })
  nota!: number;
}

export class ComparisonPeerEvaluationDto {
  @ApiProperty({ format: 'uuid', description: 'ID do colega avaliador.' })
  avaliadorId!: string;

  @ApiProperty({ description: 'Nome do colega avaliador (não anônimo para o tutor).' })
  avaliadorNome!: string;

  @ApiProperty({
    type: String,
    format: 'date-time',
    description: 'Data/hora de envio da avaliação de pares.',
  })
  enviadaEm!: Date;

  @ApiProperty({
    type: Number,
    description: 'Nota consolidada atribuída por este colega.',
  })
  notaConsolidada!: number;

  @ApiProperty({
    type: [PeerEvaluationItemScoreDto],
    description: 'Notas dadas pelo colega para cada critério.',
  })
  itens!: PeerEvaluationItemScoreDto[];
}

export class ComparisonAdjustmentDto {
  @ApiProperty({ description: 'Valor anterior da nota da autoavaliação.' })
  valorAnterior!: number;

  @ApiProperty({ description: 'Novo valor atribuído à autoavaliação.' })
  valorNovo!: number;

  @ApiProperty({ description: 'Justificativa do ajuste dada pelo professor.' })
  justificativa!: string;

  @ApiProperty({
    type: AdjustmentAuthorResponseDto,
    description: 'Professor que realizou o ajuste.',
  })
  autor!: AdjustmentAuthorResponseDto;

  @ApiProperty({
    type: String,
    format: 'date-time',
    description: 'Data e hora em que o ajuste foi registrado.',
  })
  ajustadoEm!: Date;
}

export class StudentSessionEvaluationComparisonResponseDto {
  @ApiProperty({ type: ComparisonStudentDto, description: 'Dados do aluno.' })
  aluno!: ComparisonStudentDto;

  @ApiProperty({
    type: ComparisonSelfAssessmentDto,
    description: 'Detalhes da autoavaliação e comparação de critérios com o tutor.',
  })
  autoavaliacao!: ComparisonSelfAssessmentDto;

  @ApiProperty({
    type: [ComparisonPeerEvaluationDto],
    description: 'Avaliações recebidas de colegas na sessão.',
  })
  pares!: ComparisonPeerEvaluationDto[];

  @ApiProperty({
    type: [ComparisonAdjustmentDto],
    description: 'Histórico de ajustes da autoavaliação realizados pelo tutor.',
  })
  ajustes!: ComparisonAdjustmentDto[];
}
