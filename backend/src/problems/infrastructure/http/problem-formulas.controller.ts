import { Body, Controller, Get, HttpCode, HttpStatus, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { AuthenticatedUserId } from '@/shared/decorators/authenticated-user-id.decorator';
import { Roles } from '@/shared/decorators/roles.decorator';
import { UuidParam } from '@/shared/decorators/uuid-param.decorator';
import { UserType } from '@/users/domain/enums/user-type.enum';
import { JWT_SECURITY_SCHEME } from '@/config/swagger.config';

import { CustomizeFormulaDto } from '../../application/dtos/customize-formula.dto';
import { FormulaResponseDto } from '../../application/dtos/formula-response.dto';
import { RestoreDefaultFormulaDto } from '../../application/dtos/restore-default-formula.dto';
import { FormulaScope } from '../../domain/entities/formula.entity';
import { GetProblemFormulaUseCase } from '../../application/use-cases/get-problem-formula.use-case';
import { CustomizeProblemFormulaUseCase } from '../../application/use-cases/customize-problem-formula.use-case';
import { RestoreDefaultFormulaUseCase } from '../../application/use-cases/restore-default-formula.use-case';

import { toCustomizeFormulaComponents, toFormulaResponse } from './problem-formula.mapper';
import {
  GetProblemFormulaSwaggerDocs,
  CustomizeProblemFormulaSwaggerDocs,
  RestoreDefaultFormulaSwaggerDocs,
} from './problem-formulas.swagger';

@ApiTags('Fórmulas de Avaliação')
@ApiBearerAuth(JWT_SECURITY_SCHEME)
@Controller('salas')
@Roles(UserType.TUTOR)
export class ProblemFormulasController {
  constructor(
    private readonly getFormulaUseCase: GetProblemFormulaUseCase,
    private readonly customizeFormulaUseCase: CustomizeProblemFormulaUseCase,
    private readonly restoreDefaultFormulaUseCase: RestoreDefaultFormulaUseCase,
  ) {}

  @Get([':roomId/problemas/:problemId/formulas', ':roomId/problemas/:problemId/formula'])
  @GetProblemFormulaSwaggerDocs
  get(
    @UuidParam('roomId') roomId: string,
    @UuidParam('problemId') problemId: string,
    @Query('escopo') escopo: FormulaScope,
    @AuthenticatedUserId() tutorId: string,
  ): Promise<FormulaResponseDto> {
    return this.executeGet(roomId, problemId, tutorId, escopo);
  }

  @Get([':salaId/problemas/:problemaId/formula', ':salaId/problemas/:problemaId/formulas'])
  @ApiOperation({
    summary: 'Obtém a fórmula de avaliação do problema',
    description:
      'Retorna a fórmula de avaliação do problema para qualquer professor ou co-tutor vinculado à sala.',
  })
  @ApiOkResponse({
    description: 'Fórmula retornada com sucesso.',
    type: FormulaResponseDto,
  })
  getByPortugueseParams(
    @UuidParam('salaId') salaId: string,
    @UuidParam('problemaId') problemaId: string,
    @Query('escopo') escopo: FormulaScope,
    @AuthenticatedUserId() tutorId: string,
  ): Promise<FormulaResponseDto> {
    return this.executeGet(salaId, problemaId, tutorId, escopo);
  }

  @Put([':roomId/problemas/:problemId/formulas', ':roomId/problemas/:problemId/formula'])
  @HttpCode(HttpStatus.OK)
  @CustomizeProblemFormulaSwaggerDocs
  customize(
    @UuidParam('roomId') roomId: string,
    @UuidParam('problemId') problemId: string,
    @Body() dto: CustomizeFormulaDto,
    @AuthenticatedUserId() tutorId: string,
  ): Promise<FormulaResponseDto> {
    return this.executeCustomize(roomId, problemId, tutorId, dto);
  }

  @Put([':salaId/problemas/:problemaId/formula', ':salaId/problemas/:problemaId/formulas'])
  @HttpCode(HttpStatus.OK)
  customizeByPortugueseParams(
    @UuidParam('salaId') salaId: string,
    @UuidParam('problemaId') problemaId: string,
    @Body() dto: CustomizeFormulaDto,
    @AuthenticatedUserId() tutorId: string,
  ): Promise<FormulaResponseDto> {
    return this.executeCustomize(salaId, problemaId, tutorId, dto);
  }

  @Post([
    ':roomId/problemas/:problemId/formulas/restaurar-padrao',
    ':roomId/problemas/:problemId/formula/restaurar-padrao',
  ])
  @HttpCode(HttpStatus.OK)
  @RestoreDefaultFormulaSwaggerDocs
  restoreDefault(
    @UuidParam('roomId') roomId: string,
    @UuidParam('problemId') problemId: string,
    @Body() dto: RestoreDefaultFormulaDto,
    @AuthenticatedUserId() tutorId: string,
  ): Promise<FormulaResponseDto> {
    return this.executeRestore(roomId, problemId, tutorId, dto);
  }

  @Post([
    ':salaId/problemas/:problemaId/formula/restaurar-padrao',
    ':salaId/problemas/:problemaId/formulas/restaurar-padrao',
  ])
  @HttpCode(HttpStatus.OK)
  restoreDefaultByPortugueseParams(
    @UuidParam('salaId') salaId: string,
    @UuidParam('problemaId') problemaId: string,
    @Body() dto: RestoreDefaultFormulaDto,
    @AuthenticatedUserId() tutorId: string,
  ): Promise<FormulaResponseDto> {
    return this.executeRestore(salaId, problemaId, tutorId, dto);
  }

  private async executeGet(
    roomId: string,
    problemId: string,
    tutorId: string,
    escopo?: FormulaScope,
  ): Promise<FormulaResponseDto> {
    const formula = await this.getFormulaUseCase.execute({
      roomId,
      problemId,
      tutorId,
      scope: escopo ?? FormulaScope.PROBLEMA,
    });
    return toFormulaResponse(formula);
  }

  private async executeCustomize(
    roomId: string,
    problemId: string,
    tutorId: string,
    dto: CustomizeFormulaDto,
  ): Promise<FormulaResponseDto> {
    const formula = await this.customizeFormulaUseCase.execute({
      roomId,
      problemId,
      tutorId,
      scope: dto.escopo,
      components: toCustomizeFormulaComponents(dto),
    });
    return toFormulaResponse(formula);
  }

  private async executeRestore(
    roomId: string,
    problemId: string,
    tutorId: string,
    dto: RestoreDefaultFormulaDto,
  ): Promise<FormulaResponseDto> {
    const formula = await this.restoreDefaultFormulaUseCase.execute({
      roomId,
      problemId,
      tutorId,
      scope: dto.escopo,
    });
    return toFormulaResponse(formula);
  }
}
