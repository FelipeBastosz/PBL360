import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from '@/shared/decorators/roles.decorator';
import { AuthenticatedUserId } from '@/shared/decorators/authenticated-user-id.decorator';
import { UuidParam } from '@/shared/decorators/uuid-param.decorator';
import { UserType } from '@/users/domain/enums/user-type.enum';
import { GetSessionEvaluationHistoryUseCase } from '../../application/use-cases/get-session-evaluation-history.use-case';
import { GetStudentSessionEvaluationComparisonUseCase } from '../../application/use-cases/get-student-session-evaluation-comparison.use-case';
import {
  toSessionEvaluationHistoryResponse,
  toStudentSessionEvaluationComparisonResponse,
} from './evaluation-history.mapper';
import {
  ListEvaluationHistorySwaggerDocs,
  GetEvaluationHistoryDetailSwaggerDocs,
} from './evaluation-history.swagger';

@ApiTags('Avaliações')
@Roles(UserType.TUTOR)
@Controller('sessoes/:sessaoId/historico-avaliacoes')
export class EvaluationHistoryController {
  constructor(
    private readonly getHistory: GetSessionEvaluationHistoryUseCase,
    private readonly getComparison: GetStudentSessionEvaluationComparisonUseCase,
  ) {}

  @Get()
  @ListEvaluationHistorySwaggerDocs
  async list(@UuidParam('sessionId') sessionId: string, @AuthenticatedUserId() tutorId: string) {
    return toSessionEvaluationHistoryResponse(await this.getHistory.execute(sessionId, tutorId));
  }

  @Get(':studentId')
  @GetEvaluationHistoryDetailSwaggerDocs
  async get(
    @UuidParam('sessionId') sessionId: string,
    @UuidParam('studentId') studentId: string,
    @AuthenticatedUserId() tutorId: string,
  ) {
    return toStudentSessionEvaluationComparisonResponse(
      await this.getComparison.execute(sessionId, studentId, tutorId),
    );
  }
}
