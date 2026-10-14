import type { Response } from 'express';
import { Controller, Get, Header, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthenticatedUserId } from '@/shared/decorators/authenticated-user-id.decorator';
import { Roles } from '@/shared/decorators/roles.decorator';
import { UuidParam } from '@/shared/decorators/uuid-param.decorator';
import { UserType } from '@/users/domain/enums/user-type.enum';
import { GetMySessionFeedbackUseCase } from '../../application/use-cases/get-my-session-feedback.use-case';
import { toReceivedFeedbackResponse } from './received-feedback.mapper';
import { GetMySessionFeedbackSwaggerDocs } from './my-session-feedback.swagger';

@ApiTags('Feedbacks recebidos')
@Controller('sessoes/:sessaoId/meu-feedback')
@Roles(UserType.STUDENT)
export class MySessionFeedbackController {
  constructor(private readonly getFeedback: GetMySessionFeedbackUseCase) {}

  @Get()
  @Header('Cache-Control', 'private, no-store')
  @GetMySessionFeedbackSwaggerDocs
  async get(
    @UuidParam('sessaoId') sessionId: string,
    @AuthenticatedUserId() studentId: string,
    @Res() response: Response,
  ): Promise<void> {
    const feedback = await this.getFeedback.execute(sessionId, studentId);
    response.json(feedback ? toReceivedFeedbackResponse(feedback) : null);
  }
}
