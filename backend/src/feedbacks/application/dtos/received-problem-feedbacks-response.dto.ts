import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ReceivedFeedbackResponseDto,
  ReceivedSessionComponentsDto,
} from './received-feedback-response.dto';

export class ReceivedSessionFeedbackDto {
  @ApiProperty({ format: 'uuid' })
  sessaoId!: string;

  @ApiProperty({ description: 'Título da sessão.' })
  rotulo!: string;

  @ApiProperty({ format: 'date' })
  data!: string;

  @ApiProperty({ type: ReceivedFeedbackResponseDto, nullable: true })
  feedback!: ReceivedFeedbackResponseDto | null;

  @ApiPropertyOptional({
    type: Number,
    nullable: true,
    description: 'Nota da sessão quando a modalidade ativa é autoavaliação ou pares.',
  })
  nota?: number | null;

  @ApiPropertyOptional({ type: ReceivedSessionComponentsDto })
  avaliacoes?: ReceivedSessionComponentsDto;
}

export class ReceivedProblemFeedbacksResponseDto {
  @ApiProperty({
    type: Number,
    nullable: true,
    description:
      'Nota final calculada somente com as sessões já enviadas pelo tutor para o aluno; nula quando nenhuma nota estiver disponível.',
  })
  notaFinal!: number | null;

  @ApiProperty({ type: () => [AssociatedFeedbackResponseDto] })
  feedbacks!: AssociatedFeedbackResponseDto[];

  @ApiProperty({ type: ReceivedFeedbackResponseDto, nullable: true })
  geral!: ReceivedFeedbackResponseDto | null;

  @ApiProperty({
    type: [ReceivedSessionFeedbackDto],
    description:
      'Sessões em ordem cronológica, inclusive quando o feedback ainda não está disponível.',
  })
  sessoes!: ReceivedSessionFeedbackDto[];
}

export class AssociatedFeedbackResponseDto extends ReceivedFeedbackResponseDto {
  @ApiProperty({ enum: ['GERAL', 'SESSAO'] })
  tipo!: 'GERAL' | 'SESSAO';

  @ApiPropertyOptional({ format: 'uuid', description: 'Presente apenas em feedback de sessão.' })
  sessaoId?: string;
}
