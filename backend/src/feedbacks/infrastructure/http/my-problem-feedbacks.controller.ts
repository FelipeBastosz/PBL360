import { Controller, Get, Header } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthenticatedUserId } from '@/shared/decorators/authenticated-user-id.decorator';
import { Roles } from '@/shared/decorators/roles.decorator';
import { UuidParam } from '@/shared/decorators/uuid-param.decorator';
import { UserType } from '@/users/domain/enums/user-type.enum';
import { GetMyProblemFeedbacksUseCase } from '../../application/use-cases/get-my-problem-feedbacks.use-case';
import { toReceivedProblemResponse } from './received-feedback.mapper';
import { GetMyProblemFeedbacksSwaggerDocs } from './my-problem-feedbacks.swagger';

@ApiTags('Feedbacks recebidos')
@Controller([
  'salas/:salaId/problemas/:problemaId/meus-feedbacks',
  'minhas-salas/:salaId/problemas/:problemaId/feedbacks',
])
@Roles(UserType.STUDENT)
export class MyProblemFeedbacksController {
  constructor(private readonly getFeedbacks: GetMyProblemFeedbacksUseCase) {}

  @Get()
  @Header('Cache-Control', 'private, no-store')
  @GetMyProblemFeedbacksSwaggerDocs
  async get(
    @UuidParam('salaId') roomId: string,
    @UuidParam('problemaId') problemId: string,
    @AuthenticatedUserId() studentId: string,
  ) {
    return toReceivedProblemResponse(await this.getFeedbacks.execute(roomId, problemId, studentId));
  }
}
