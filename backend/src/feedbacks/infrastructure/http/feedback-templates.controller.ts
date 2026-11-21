import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from '@/shared/decorators/roles.decorator';
import { UserType } from '@/users/domain/enums/user-type.enum';
import type { FeedbackTemplateResponseDto } from '../../application/dtos/feedback-template-response.dto';
import { ListFeedbackTemplatesUseCase } from '../../application/use-cases/list-feedback-templates.use-case';
import { toFeedbackTemplateResponse } from './feedback-template.mapper';
import { ListFeedbackTemplatesSwaggerDocs } from './feedback-templates.swagger';

@ApiTags('Feedbacks')
@Controller('modelos-feedback')
@Roles(UserType.TUTOR)
export class FeedbackTemplatesController {
  constructor(private readonly listFeedbackTemplates: ListFeedbackTemplatesUseCase) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ListFeedbackTemplatesSwaggerDocs
  async list(): Promise<FeedbackTemplateResponseDto[]> {
    const templates = await this.listFeedbackTemplates.execute();
    return templates.map(toFeedbackTemplateResponse);
  }
}
