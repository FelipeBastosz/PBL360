import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthenticatedUserId } from '@/shared/decorators/authenticated-user-id.decorator';
import { Roles } from '@/shared/decorators/roles.decorator';
import { UuidParam } from '@/shared/decorators/uuid-param.decorator';
import { UserType } from '@/users/domain/enums/user-type.enum';
import type { SessionFeedbackResponseDto } from '../../application/dtos/session-feedback-response.dto';
import { GetOwnSessionFeedbackUseCase } from '../../application/use-cases/get-own-session-feedback.use-case';
import { toSessionFeedbackResponse } from './feedback.mapper';
import { GetOwnSessionFeedbackSwaggerDocs } from './feedbacks.swagger';

@ApiTags('Feedbacks')
@Controller('sessoes/:sessaoId/meu-feedback')
@Roles(UserType.STUDENT)
export class StudentSessionFeedbacksController {
  constructor(private readonly getOwnSessionFeedback: GetOwnSessionFeedbackUseCase) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @GetOwnSessionFeedbackSwaggerDocs
  async get(
    @UuidParam('sessaoId') sessionId: string,
    @AuthenticatedUserId() studentId: string,
  ): Promise<SessionFeedbackResponseDto | null> {
    const feedback = await this.getOwnSessionFeedback.execute(sessionId, studentId);
    return feedback ? toSessionFeedbackResponse(feedback) : null;
  }
}
