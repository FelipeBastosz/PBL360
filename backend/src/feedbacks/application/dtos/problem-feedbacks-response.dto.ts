import { ApiProperty } from '@nestjs/swagger';
import { GeneralFeedbackResponseDto } from './general-feedback-response.dto';
import { StudentProblemFeedbackResponseDto } from './student-problem-feedback-response.dto';

export class StudentWithFeedbackDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174001' })
  alunoId: string;

  @ApiProperty({ example: 'João Discente' })
  nome: string;

  @ApiProperty({ type: StudentProblemFeedbackResponseDto, nullable: true })
  feedback: StudentProblemFeedbackResponseDto | null;
}

export class ProblemFeedbacksResponseDto {
  @ApiProperty({ type: GeneralFeedbackResponseDto, nullable: true })
  geral: GeneralFeedbackResponseDto | null;

  @ApiProperty({ type: [StudentWithFeedbackDto] })
  alunos: StudentWithFeedbackDto[];
}
