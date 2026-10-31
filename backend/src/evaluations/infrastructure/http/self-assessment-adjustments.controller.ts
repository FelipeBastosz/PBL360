import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from '@/shared/decorators/roles.decorator';
import { AuthenticatedUserId } from '@/shared/decorators/authenticated-user-id.decorator';
import { UuidParam } from '@/shared/decorators/uuid-param.decorator';
import { UserType } from '@/users/domain/enums/user-type.enum';
import { AdjustSelfAssessmentDto } from '../../application/dtos/adjust-self-assessment.dto';
import { ListSelfAssessmentAdjustmentsQueryDto } from '../../application/dtos/list-self-assessment-adjustments-query.dto';
import { AdjustSelfAssessmentUseCase } from '../../application/use-cases/adjust-self-assessment.use-case';
import { ListSelfAssessmentAdjustmentsUseCase } from '../../application/use-cases/list-self-assessment-adjustments.use-case';
import {
  toAdjustSelfAssessmentInput,
  toSelfAssessmentAdjustmentHistoryResponse,
  toSelfAssessmentAdjustmentResponse,
} from './self-assessment-adjustments.mapper';
import {
  AdjustSelfAssessmentSwaggerDocs,
  ListSelfAssessmentAdjustmentsSwaggerDocs,
} from './self-assessment-adjustments.swagger';

@ApiTags('Avaliações')
@Roles(UserType.TUTOR)
@Controller('sessoes/:sessaoId/autoavaliacoes/:alunoId/ajustes')
export class SelfAssessmentAdjustmentsController {
  constructor(
    private readonly adjustSelfAssessment: AdjustSelfAssessmentUseCase,
    private readonly listAdjustments: ListSelfAssessmentAdjustmentsUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @AdjustSelfAssessmentSwaggerDocs
  async create(
    @UuidParam('sessaoId') sessionId: string,
    @UuidParam('alunoId') studentId: string,
    @AuthenticatedUserId() authorId: string,
    @Body() dto: AdjustSelfAssessmentDto,
  ) {
    const input = toAdjustSelfAssessmentInput(dto, sessionId, studentId, authorId);
    return toSelfAssessmentAdjustmentResponse(
      studentId,
      await this.adjustSelfAssessment.execute(input),
    );
  }

  @Get()
  @ListSelfAssessmentAdjustmentsSwaggerDocs
  async list(
    @UuidParam('sessaoId') sessionId: string,
    @UuidParam('alunoId') studentId: string,
    @AuthenticatedUserId() authorId: string,
    @Query() query: ListSelfAssessmentAdjustmentsQueryDto,
  ) {
    return toSelfAssessmentAdjustmentHistoryResponse(
      await this.listAdjustments.execute(sessionId, studentId, authorId, query.tipo),
    );
  }
}
