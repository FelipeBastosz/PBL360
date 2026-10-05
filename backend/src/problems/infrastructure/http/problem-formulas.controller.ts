import { Body, Controller, Get, HttpCode, HttpStatus, Post, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { AuthenticatedUserId } from '@/shared/decorators/authenticated-user-id.decorator';
import { Roles } from '@/shared/decorators/roles.decorator';
import { UuidParam } from '@/shared/decorators/uuid-param.decorator';
import { UserType } from '@/users/domain/enums/user-type.enum';

import { CustomizeFormulaDto } from '../../application/dtos/customize-formula.dto';
import { FormulaResponseDto } from '../../application/dtos/formula-response.dto';
import { RestoreDefaultFormulaDto } from '../../application/dtos/restore-default-formula.dto';
import { FormulaScope } from '../../domain/entities/formula.entity';
import { GetProblemFormulaUseCase } from '../../application/use-cases/get-problem-formula.use-case';
import { CustomizeProblemFormulaUseCase } from '../../application/use-cases/customize-problem-formula.use-case';
import { RestoreDefaultFormulaUseCase } from '../../application/use-cases/restore-default-formula.use-case';

import {
  GetProblemFormulaSwaggerDocs,
  CustomizeProblemFormulaSwaggerDocs,
  RestoreDefaultFormulaSwaggerDocs,
} from './problem-formulas.swagger';

@ApiTags('Fórmulas de Avaliação')
@Controller('salas/:roomId/problemas/:problemId/formulas')
@Roles(UserType.TUTOR)
export class ProblemFormulasController {
  constructor(
    private readonly getFormulaUseCase: GetProblemFormulaUseCase,
    private readonly customizeFormulaUseCase: CustomizeProblemFormulaUseCase,
    private readonly restoreDefaultFormulaUseCase: RestoreDefaultFormulaUseCase,
  ) {}

  @Get()
  @GetProblemFormulaSwaggerDocs
  async get(
    @UuidParam('roomId') roomId: string,
    @UuidParam('problemId') problemId: string,
    @Query('escopo') escopo: FormulaScope,
    @AuthenticatedUserId() tutorId: string,
  ): Promise<FormulaResponseDto> {
    return this.getFormulaUseCase.execute({ roomId, problemId, tutorId, scope: escopo });
  }

  @Put()
  @HttpCode(HttpStatus.OK)
  @CustomizeProblemFormulaSwaggerDocs
  async customize(
    @UuidParam('roomId') roomId: string,
    @UuidParam('problemId') problemId: string,
    @Body() dto: CustomizeFormulaDto,
    @AuthenticatedUserId() tutorId: string,
  ): Promise<FormulaResponseDto> {
    return this.customizeFormulaUseCase.execute({ roomId, problemId, tutorId, dto });
  }

  @Post('restaurar-padrao')
  @HttpCode(HttpStatus.OK)
  @RestoreDefaultFormulaSwaggerDocs
  async restoreDefault(
    @UuidParam('roomId') roomId: string,
    @UuidParam('problemId') problemId: string,
    @Body() dto: RestoreDefaultFormulaDto,
    @AuthenticatedUserId() tutorId: string,
  ): Promise<FormulaResponseDto> {
    return this.restoreDefaultFormulaUseCase.execute({ roomId, problemId, tutorId, scope: dto.escopo });
  }
}
