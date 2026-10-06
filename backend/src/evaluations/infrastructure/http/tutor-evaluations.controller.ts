import { Body, Controller, Get, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from '@/shared/decorators/roles.decorator';
import { AuthenticatedUserId } from '@/shared/decorators/authenticated-user-id.decorator';
import { UuidParam } from '@/shared/decorators/uuid-param.decorator';
import { UserType } from '@/users/domain/enums/user-type.enum';
import { SaveTutorEvaluationDto } from '../../application/dtos/save-tutor-evaluation.dto';
import { ListSessionEvaluationsUseCase } from '../../application/use-cases/list-session-evaluations.use-case';
import { GetTutorEvaluationUseCase } from '../../application/use-cases/get-tutor-evaluation.use-case';
import { SaveTutorEvaluationUseCase } from '../../application/use-cases/save-tutor-evaluation.use-case';
import { toSaveTutorEvaluationInput } from './tutor-evaluation.mapper';
import {
  toEvaluationSummaryResponse,
  toTutorEvaluationResponse,
} from './tutor-evaluation-response.mapper';
import {
  ListSessionEvaluationsSwaggerDocs,
  GetTutorEvaluationSwaggerDocs,
  SaveTutorEvaluationSwaggerDocs,
} from './tutor-evaluation.swagger';

@ApiTags('Avaliações')
@Roles(UserType.TUTOR)
@Controller('sessoes/:sessionId/avaliacoes')
export class TutorEvaluationsController {
  constructor(
    private readonly listEvaluations: ListSessionEvaluationsUseCase,
    private readonly getEvaluation: GetTutorEvaluationUseCase,
    private readonly saveEvaluation: SaveTutorEvaluationUseCase,
  ) {}

  @Get()
  @ListSessionEvaluationsSwaggerDocs
  async list(@UuidParam('sessionId') sessionId: string, @AuthenticatedUserId() authorId: string) {
    return (await this.listEvaluations.execute(sessionId, authorId)).map(
      toEvaluationSummaryResponse,
    );
  }

  @Get(':studentId')
  @GetTutorEvaluationSwaggerDocs
  async get(
    @UuidParam('sessionId') sessionId: string,
    @UuidParam('studentId') studentId: string,
    @AuthenticatedUserId() authorId: string,
  ) {
    return toTutorEvaluationResponse(
      await this.getEvaluation.execute(sessionId, studentId, authorId),
    );
  }

  @Put(':studentId')
  @SaveTutorEvaluationSwaggerDocs
  async put(
    @UuidParam('sessionId') sessionId: string,
    @UuidParam('studentId') studentId: string,
    @AuthenticatedUserId() authorId: string,
    @Body() dto: SaveTutorEvaluationDto,
  ) {
    return toTutorEvaluationResponse(
      await this.saveEvaluation.execute(
        toSaveTutorEvaluationInput(dto, sessionId, studentId, authorId),
      ),
    );
  }
}
