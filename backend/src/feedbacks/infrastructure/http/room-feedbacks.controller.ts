import { Body, Controller, Get, HttpCode, HttpStatus, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthenticatedUserId } from '@/shared/decorators/authenticated-user-id.decorator';
import { Roles } from '@/shared/decorators/roles.decorator';
import { UuidParam } from '@/shared/decorators/uuid-param.decorator';
import { UserType } from '@/users/domain/enums/user-type.enum';
import { SaveStudentProblemFeedbackDto } from '../../application/dtos/save-student-problem-feedback.dto';
import { SaveGeneralFeedbackDto } from '../../application/dtos/save-general-feedback.dto';
import type { StudentProblemFeedbackResponseDto } from '../../application/dtos/student-problem-feedback-response.dto';
import type { GeneralFeedbackResponseDto } from '../../application/dtos/general-feedback-response.dto';
import type { ProblemFeedbacksResponseDto } from '../../application/dtos/problem-feedbacks-response.dto';
import { SaveStudentProblemFeedbackUseCase } from '../../application/use-cases/save-student-problem-feedback.use-case';
import { SaveGeneralProblemFeedbackUseCase } from '../../application/use-cases/save-general-problem-feedback.use-case';
import { GetProblemFeedbacksUseCase } from '../../application/use-cases/get-problem-feedbacks.use-case';
import {
  toGeneralFeedbackResponse,
  toProblemFeedbacksResponse,
  toStudentProblemFeedbackResponse,
} from './feedback.mapper';
import {
  GetProblemFeedbacksSwaggerDocs,
  SaveGeneralProblemFeedbackSwaggerDocs,
  SaveStudentProblemFeedbackSwaggerDocs,
} from './feedbacks.swagger';

@ApiTags('Feedbacks')
@Controller('salas/:salaId/problemas/:problemaId/feedbacks')
@Roles(UserType.TUTOR)
export class RoomFeedbacksController {
  constructor(
    private readonly saveStudentFeedback: SaveStudentProblemFeedbackUseCase,
    private readonly saveGeneralFeedback: SaveGeneralProblemFeedbackUseCase,
    private readonly getProblemFeedbacks: GetProblemFeedbacksUseCase,
  ) {}

  @Put('alunos/:alunoId')
  @HttpCode(HttpStatus.OK)
  @SaveStudentProblemFeedbackSwaggerDocs
  async saveStudent(
    @UuidParam('salaId') roomId: string,
    @UuidParam('problemaId') problemId: string,
    @UuidParam('alunoId') studentId: string,
    @Body() dto: SaveStudentProblemFeedbackDto,
    @AuthenticatedUserId() tutorId: string,
  ): Promise<StudentProblemFeedbackResponseDto> {
    const feedback = await this.saveStudentFeedback.execute({
      roomId,
      problemId,
      studentId,
      tutorId,
      score: dto.nota ?? null,
      text: dto.texto,
    });
    return toStudentProblemFeedbackResponse(feedback);
  }

  @Put('geral')
  @HttpCode(HttpStatus.OK)
  @SaveGeneralProblemFeedbackSwaggerDocs
  async saveGeneral(
    @UuidParam('salaId') roomId: string,
    @UuidParam('problemaId') problemId: string,
    @Body() dto: SaveGeneralFeedbackDto,
    @AuthenticatedUserId() tutorId: string,
  ): Promise<GeneralFeedbackResponseDto> {
    const feedback = await this.saveGeneralFeedback.execute({
      roomId,
      problemId,
      tutorId,
      text: dto.texto,
    });
    return toGeneralFeedbackResponse(feedback);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @GetProblemFeedbacksSwaggerDocs
  async getFeedbacks(
    @UuidParam('salaId') roomId: string,
    @UuidParam('problemaId') problemId: string,
    @AuthenticatedUserId() tutorId: string,
  ): Promise<ProblemFeedbacksResponseDto> {
    const result = await this.getProblemFeedbacks.execute({
      roomId,
      problemId,
      tutorId,
    });
    return toProblemFeedbacksResponse(result.general, result.students);
  }
}
