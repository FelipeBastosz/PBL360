import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthenticatedUserId } from '@/shared/decorators/authenticated-user-id.decorator';
import { Roles } from '@/shared/decorators/roles.decorator';
import { UuidParam } from '@/shared/decorators/uuid-param.decorator';
import { UserType } from '@/users/domain/enums/user-type.enum';
import type { FeedbackRevisionResponseDto } from '../../application/dtos/feedback-revision-response.dto';
import { GetFeedbackRevisionsUseCase } from '../../application/use-cases/get-feedback-revisions.use-case';
import { toFeedbackRevisionResponse } from './feedback.mapper';
import { GetFeedbackRevisionsSwaggerDocs } from './feedbacks.swagger';

@ApiTags('Feedbacks')
@Controller('feedbacks/:id/revisoes')
@Roles(UserType.TUTOR)
export class FeedbackRevisionsController {
  constructor(private readonly getRevisions: GetFeedbackRevisionsUseCase) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @GetFeedbackRevisionsSwaggerDocs
  async list(
    @UuidParam('id') feedbackId: string,
    @AuthenticatedUserId() tutorId: string,
  ): Promise<FeedbackRevisionResponseDto[]> {
    const revisions = await this.getRevisions.execute({
      feedbackId,
      tutorId,
    });
    return revisions.map(toFeedbackRevisionResponse);
  }
}
