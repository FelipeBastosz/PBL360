import { ApiProperty } from '@nestjs/swagger';
import { EvaluationStatusResponse } from './session-evaluation-summary-response.dto';

export class PeerStudentInfo {
  @ApiProperty({
    format: 'uuid',
    example: 'a0000000-0000-0000-0000-000000000001',
    description: 'Identificador do colega.',
  })
  alunoId!: string;

  @ApiProperty({
    example: 'João Silva',
    description: 'Nome do colega.',
  })
  nome!: string;
}

export class PeerEvaluationCriterionResponseDto {
  @ApiProperty({
    format: 'uuid',
    example: 'c0000000-0000-0000-0000-000000000001',
    description: 'Identificador do critério de avaliação.',
  })
  id!: string;

  @ApiProperty({
    example: 'Participação ativa',
    description: 'Nome do critério.',
  })
  nome!: string;

  @ApiProperty({
    example: 2,
    description: 'Peso do critério na avaliação.',
  })
  peso!: number;

  @ApiProperty({
    example: 10,
    description: 'Nota máxima permitida para o critério.',
  })
  notaMaxima!: number;
}

export class PeerEvaluationItemDto {
  @ApiProperty({
    format: 'uuid',
    example: 'c0000000-0000-0000-0000-000000000001',
    description: 'Identificador do critério avaliado.',
  })
  criterioId!: string;

  @ApiProperty({
    example: 8.5,
    description: 'Nota atribuída ao critério.',
  })
  nota!: number;
}

export class PeerEvaluationResponseDto {
  @ApiProperty({
    type: PeerStudentInfo,
    description: 'Dados do colega avaliado.',
  })
  colega!: PeerStudentInfo;

  @ApiProperty({
    enum: EvaluationStatusResponse,
    example: EvaluationStatusResponse.RASCUNHO,
    description: 'Status da avaliação.',
  })
  status!: EvaluationStatusResponse;

  @ApiProperty({
    nullable: true,
    example: '2026-10-15T14:30:00.000Z',
    description: 'Data e hora do envio definitivo da avaliação, se enviada.',
  })
  enviadaEm!: Date | null;

  @ApiProperty({
    type: PeerEvaluationCriterionResponseDto,
    isArray: true,
    description: 'Critérios de avaliação configurados para a sessão.',
  })
  criterios!: PeerEvaluationCriterionResponseDto[];

  @ApiProperty({
    type: PeerEvaluationItemDto,
    isArray: true,
    description: 'Itens com as notas atribuídas aos critérios.',
  })
  itens!: PeerEvaluationItemDto[];
}
