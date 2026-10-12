import { Body, Controller, Get, HttpCode, HttpStatus, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from '@/shared/decorators/roles.decorator';
import { AuthenticatedUserId } from '@/shared/decorators/authenticated-user-id.decorator';
import { UuidParam } from '@/shared/decorators/uuid-param.decorator';
import { UserType } from '@/users/domain/enums/user-type.enum';
import { SaveSelfAssessmentDto } from '../../application/dtos/save-self-assessment.dto';
import { GetSelfAssessmentUseCase } from '../../application/use-cases/get-self-assessment.use-case';
import { GetStudentEvaluationSummaryUseCase } from '../../application/use-cases/get-student-evaluation-summary.use-case';
import { SaveSelfAssessmentUseCase } from '../../application/use-cases/save-self-assessment.use-case';
import {
  toSaveSelfAssessmentInput,
  toSelfAssessmentResponse,
  toStudentEvaluationSummaryResponse,
} from './student-evaluations.mapper';
import {
  GetSelfAssessmentSwaggerDocs,
  GetStudentEvaluationSummarySwaggerDocs,
  SaveSelfAssessmentSwaggerDocs,
} from './student-evaluations.swagger';

@ApiTags('Avaliações')
@Roles(UserType.STUDENT)
@Controller('sessoes/:sessaoId')
export class StudentEvaluationsController {
  constructor(
    private readonly getSummary: GetStudentEvaluationSummaryUseCase,
    private readonly getSelfAssessment: GetSelfAssessmentUseCase,
    private readonly saveSelfAssessment: SaveSelfAssessmentUseCase,
  ) {}

  @Get('minhas-avaliacoes')
  @GetStudentEvaluationSummarySwaggerDocs
  async summary(
    @UuidParam('sessaoId') sessionId: string,
    @AuthenticatedUserId() studentId: string,
  ) {
    return toStudentEvaluationSummaryResponse(await this.getSummary.execute(sessionId, studentId));
  }

  @Get('autoavaliacao')
  @GetSelfAssessmentSwaggerDocs
  async get(@UuidParam('sessaoId') sessionId: string, @AuthenticatedUserId() studentId: string) {
    return toSelfAssessmentResponse(await this.getSelfAssessment.execute(sessionId, studentId));
  }

  @Put('autoavaliacao')
  @HttpCode(HttpStatus.OK)
  @SaveSelfAssessmentSwaggerDocs
  async put(
    @UuidParam('sessaoId') sessionId: string,
    @AuthenticatedUserId() studentId: string,
    @Body() dto: SaveSelfAssessmentDto,
  ) {
    const input = toSaveSelfAssessmentInput(dto, sessionId, studentId);
    return toSelfAssessmentResponse(await this.saveSelfAssessment.execute(input));
  }
}
