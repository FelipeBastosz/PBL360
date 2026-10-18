import { ApiProperty } from '@nestjs/swagger';
import { EvaluationAdjustmentSituation } from '../../domain/entities/evaluation-history.entity';

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
      'Nota original da autoavaliação quando houver ajuste. Null se não houve ajuste ou se não enviada.',
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
      'Média das notas de critérios recebidas dos pares na sessão. Null se não recebeu avaliações.',
  })
  notaPares!: number | null;

  @ApiProperty({
    description: 'Quantidade de avaliações de pares recebidas pelo aluno na sessão.',
  })
  avaliacoesPares!: number;

  @ApiProperty({
    enum: EvaluationAdjustmentSituation,
    description: 'Indica se a autoavaliação foi ajustada (AJUSTADA) ou não (SEM_AJUSTE).',
  })
  situacaoAjuste!: EvaluationAdjustmentSituation;
}

export class SessionEvaluationHistoryResponseDto {
  @ApiProperty({
    type: [StudentEvaluationHistoryItemDto],
    description: 'Lista dos alunos participantes da sessão com o comparativo de notas.',
  })
  alunos!: StudentEvaluationHistoryItemDto[];
}
