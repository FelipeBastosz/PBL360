import { Body, Controller, Get, HttpCode, HttpStatus, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthenticatedUserId } from '@/shared/decorators/authenticated-user-id.decorator';
import { Roles } from '@/shared/decorators/roles.decorator';
import { UuidParam } from '@/shared/decorators/uuid-param.decorator';
import { UserType } from '@/users/domain/enums/user-type.enum';
import { SaveSessionFeedbackDto } from '../../application/dtos/save-session-feedback.dto';
import type { SessionFeedbackResponseDto } from '../../application/dtos/session-feedback-response.dto';
import { SaveSessionFeedbackUseCase } from '../../application/use-cases/save-session-feedback.use-case';
import { GetSessionFeedbackUseCase } from '../../application/use-cases/get-session-feedback.use-case';
import { toSessionFeedbackResponse } from './feedback.mapper';
import { GetSessionFeedbackSwaggerDocs, SaveSessionFeedbackSwaggerDocs } from './feedbacks.swagger';

@ApiTags('Feedbacks')
@Controller('sessoes/:sessaoId/alunos/:alunoId/feedback')
@Roles(UserType.TUTOR)
export class SessionFeedbacksController {
  constructor(
    private readonly saveSessionFeedback: SaveSessionFeedbackUseCase,
    private readonly getSessionFeedback: GetSessionFeedbackUseCase,
  ) {}

  @Put()
  @HttpCode(HttpStatus.OK)
  @SaveSessionFeedbackSwaggerDocs
  async save(
    @UuidParam('sessaoId') sessionId: string,
    @UuidParam('alunoId') studentId: string,
    @Body() dto: SaveSessionFeedbackDto,
    @AuthenticatedUserId() tutorId: string,
  ): Promise<SessionFeedbackResponseDto> {
    const feedback = await this.saveSessionFeedback.execute({
      sessionId,
      studentId,
      tutorId,
      text: dto.texto,
    });
    return toSessionFeedbackResponse(feedback);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @GetSessionFeedbackSwaggerDocs
  async get(
    @UuidParam('sessaoId') sessionId: string,
    @UuidParam('alunoId') studentId: string,
    @AuthenticatedUserId() tutorId: string,
  ): Promise<SessionFeedbackResponseDto | null> {
    const feedback = await this.getSessionFeedback.execute({
      sessionId,
      studentId,
      tutorId,
    });
    return feedback ? toSessionFeedbackResponse(feedback) : null;
  }
}
