import { ApiProperty } from '@nestjs/swagger';
import {
  ReceivedFeedbackResponseDto,
  ReceivedIndividualFeedbackResponseDto,
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
}

export class ReceivedProblemFeedbacksResponseDto {
  @ApiProperty({ type: ReceivedIndividualFeedbackResponseDto, nullable: true })
  individual!: ReceivedIndividualFeedbackResponseDto | null;

  @ApiProperty({ type: ReceivedFeedbackResponseDto, nullable: true })
  geral!: ReceivedFeedbackResponseDto | null;

  @ApiProperty({
    type: [ReceivedSessionFeedbackDto],
    description:
      'Sessões em ordem cronológica, inclusive quando o feedback ainda não está disponível.',
  })
  sessoes!: ReceivedSessionFeedbackDto[];
}
