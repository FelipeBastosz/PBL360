import { Body, Controller, Get, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { AuthenticatedUserId } from '@/shared/decorators/authenticated-user-id.decorator';
import { Roles } from '@/shared/decorators/roles.decorator';
import { UuidParam } from '@/shared/decorators/uuid-param.decorator';
import { UserType } from '@/users/domain/enums/user-type.enum';

import { EvaluationReleasesResponseDto } from '../../application/dtos/evaluation-releases-response.dto';
import { UpdateEvaluationReleasesDto } from '../../application/dtos/update-evaluation-releases.dto';
import { GetEvaluationReleasesUseCase } from '../../application/use-cases/get-evaluation-releases.use-case';
import { UpdateEvaluationReleasesUseCase } from '../../application/use-cases/update-evaluation-releases.use-case';

import {
  toEvaluationReleaseChange,
  toEvaluationReleasesResponse,
} from './evaluation-releases.mapper';
import {
  GetEvaluationReleasesSwaggerDocs,
  UpdateEvaluationReleasesSwaggerDocs,
} from './evaluation-releases.swagger';

@ApiTags('Liberações de Avaliação')
@Controller('sessoes')
@Roles(UserType.TUTOR)
export class EvaluationReleasesController {
  constructor(
    private readonly getReleasesUseCase: GetEvaluationReleasesUseCase,
    private readonly updateReleasesUseCase: UpdateEvaluationReleasesUseCase,
  ) {}

  @Get(':sessaoId/liberacoes')
  @GetEvaluationReleasesSwaggerDocs
  async get(
    @UuidParam('sessaoId') sessionId: string,
    @AuthenticatedUserId() tutorId: string,
  ): Promise<EvaluationReleasesResponseDto> {
    const releases = await this.getReleasesUseCase.execute({ sessionId, tutorId });
    return toEvaluationReleasesResponse(releases);
  }

  @Put(':sessaoId/liberacoes')
  @UpdateEvaluationReleasesSwaggerDocs
  async update(
    @UuidParam('sessaoId') sessionId: string,
    @Body() dto: UpdateEvaluationReleasesDto,
    @AuthenticatedUserId() tutorId: string,
  ): Promise<EvaluationReleasesResponseDto> {
    const releases = await this.updateReleasesUseCase.execute({
      sessionId,
      tutorId,
      self: toEvaluationReleaseChange(dto.autoavaliacao),
      peer: toEvaluationReleaseChange(dto.pares),
    });
    return toEvaluationReleasesResponse(releases);
  }
}
