import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from '@/shared/decorators/roles.decorator';
import { AuthenticatedUserId } from '@/shared/decorators/authenticated-user-id.decorator';
import { UuidParam } from '@/shared/decorators/uuid-param.decorator';
import { UserType } from '@/users/domain/enums/user-type.enum';
import { GetProblemEvaluationCriteriaUseCase } from '../../application/use-cases/get-problem-evaluation-criteria.use-case';
import { toEvaluationCriteriaResponse } from './tutor-evaluation-response.mapper';
import { GetProblemEvaluationCriteriaSwaggerDocs } from './problem-evaluation-criteria.swagger';

@ApiTags('Avaliações')
@Roles(UserType.TUTOR)
@Controller('salas/:roomId/problemas/:problemId/criterios')
export class ProblemEvaluationCriteriaController {
  constructor(private readonly getCriteria: GetProblemEvaluationCriteriaUseCase) {}

  @Get()
  @GetProblemEvaluationCriteriaSwaggerDocs
  async get(
    @UuidParam('roomId') roomId: string,
    @UuidParam('problemId') problemId: string,
    @AuthenticatedUserId() authorId: string,
  ) {
    return toEvaluationCriteriaResponse(
      await this.getCriteria.execute(roomId, problemId, authorId),
    );
  }
}
