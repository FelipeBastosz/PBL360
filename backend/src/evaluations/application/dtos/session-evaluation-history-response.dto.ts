import { ApiProperty } from '@nestjs/swagger';
import {
  EvaluationAdjustmentSituation,
  EvaluationHistoryOrigin,
} from '../../domain/entities/evaluation-history.entity';

export class StudentEvaluationHistoryItemDto {
  @ApiProperty({ format: 'uuid', description: 'ID do aluno.' })
  alunoId!: string;

  @ApiProperty({ description: 'Nome completo do aluno.' })
  nome!: string;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Matrícula do aluno, se informada.',
  })
  matricula!: string | null;

  @ApiProperty({
    type: Number,
    nullable: true,
    description:
      'Nota da autoavaliação vigente do aluno (a original ou a ajustada pelo tutor, se houver). Null se não enviada.',
  })
  notaAluno!: number | null;

  @ApiProperty({
    type: Number,
    nullable: true,
    description:
      'Nota de referência antes da intervenção do tutor: autoavaliação original, média original dos pares ou média dos votos do planning poker. Null se não houve ajuste.',
  })
  notaAlunoOriginal!: number | null;

  @ApiProperty({
    type: Number,
    nullable: true,
    description: 'Nota de critérios da avaliação do tutor na sessão. Null se sem dado.',
  })
  notaTutor!: number | null;

  @ApiProperty({
    type: Number,
    nullable: true,
    description:
      'Nota vigente de pares: média do formulário (ou o ajuste do tutor) ou a nota decidida no planning poker (ou o ajuste mais recente). Null se ainda não avaliado.',
  })
  notaPares!: number | null;

  @ApiProperty({
    description:
      'Quantidade de avaliações de pares recebidas pelo aluno na sessão (no planning poker, a quantidade de votos da rodada).',
  })
  avaliacoesPares!: number;

  @ApiProperty({
    enum: EvaluationAdjustmentSituation,
    description:
      'Indica se a nota foi ajustada pelo tutor com justificativa (AJUSTADA) ou não (SEM_AJUSTE). No planning poker, o reajuste na mesa também conta.',
  })
  situacaoAjuste!: EvaluationAdjustmentSituation;

  @ApiProperty({
    enum: EvaluationHistoryOrigin,
    nullable: true,
    description:
      'Origem da nota exibida: AUTOAVALIACAO, PARES (formulário), PLANNING_POKER ou TUTOR (só a avaliação do tutor). Null se a avaliação está pendente.',
  })
  origem!: EvaluationHistoryOrigin | null;
}

export class SessionEvaluationHistoryResponseDto {
  @ApiProperty({
    type: [StudentEvaluationHistoryItemDto],
    description: 'Lista dos alunos participantes da sessão com o comparativo de notas.',
  })
  alunos!: StudentEvaluationHistoryItemDto[];
}
