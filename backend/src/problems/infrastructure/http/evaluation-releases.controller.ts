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
@Controller('salas/:roomId/problemas/:problemId/liberacoes')
@Roles(UserType.TUTOR)
export class EvaluationReleasesController {
  constructor(
    private readonly getReleasesUseCase: GetEvaluationReleasesUseCase,
    private readonly updateReleasesUseCase: UpdateEvaluationReleasesUseCase,
  ) {}

  @Get()
  @GetEvaluationReleasesSwaggerDocs
  async get(
    @UuidParam('roomId') roomId: string,
    @UuidParam('problemId') problemId: string,
    @AuthenticatedUserId() tutorId: string,
  ): Promise<EvaluationReleasesResponseDto> {
    const releases = await this.getReleasesUseCase.execute({ roomId, problemId, tutorId });
    return toEvaluationReleasesResponse(releases);
  }

  @Put()
  @UpdateEvaluationReleasesSwaggerDocs
  async update(
    @UuidParam('roomId') roomId: string,
    @UuidParam('problemId') problemId: string,
    @Body() dto: UpdateEvaluationReleasesDto,
    @AuthenticatedUserId() tutorId: string,
  ): Promise<EvaluationReleasesResponseDto> {
    const releases = await this.updateReleasesUseCase.execute({
      roomId,
      problemId,
      tutorId,
      self: toEvaluationReleaseChange(dto.autoavaliacao),
      peer: toEvaluationReleaseChange(dto.pares),
    });
    return toEvaluationReleasesResponse(releases);
  }
}
