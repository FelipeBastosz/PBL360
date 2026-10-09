import { ApiProperty } from '@nestjs/swagger';
import { EvaluationStatusResponse } from './session-evaluation-summary-response.dto';

export class SessionPeerStudentDto {
  @ApiProperty({
    format: 'uuid',
    example: 'a0000000-0000-0000-0000-000000000001',
    description: 'Identificador do colega a ser avaliado.',
  })
  alunoId!: string;

  @ApiProperty({
    example: 'João Silva',
    description: 'Nome completo do colega.',
  })
  nome!: string;

  @ApiProperty({
    example: 'JS',
    description: 'Iniciais do nome do colega.',
  })
  iniciais!: string;

  @ApiProperty({
    enum: EvaluationStatusResponse,
    example: EvaluationStatusResponse.PENDENTE,
    description: 'Status da avaliação realizada pelo aluno autenticado para este colega.',
  })
  status!: EvaluationStatusResponse;
}

export class SessionPeersResponseDto {
  @ApiProperty({
    example: true,
    description: 'Indica se a avaliação entre pares da sessão está liberada.',
  })
  liberada!: boolean;

  @ApiProperty({
    nullable: true,
    example: '2026-10-15T23:59:59.000Z',
    description: 'Prazo limite para realização da avaliação entre pares.',
  })
  prazo!: Date | null;

  @ApiProperty({
    type: SessionPeerStudentDto,
    isArray: true,
    description: 'Lista de colegas que participaram da sessão.',
  })
  colegas!: SessionPeerStudentDto[];
}
