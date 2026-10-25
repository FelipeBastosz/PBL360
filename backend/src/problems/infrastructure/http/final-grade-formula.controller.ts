import { Body, Controller, Get, HttpCode, HttpStatus, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthenticatedUserId } from '@/shared/decorators/authenticated-user-id.decorator';
import { Roles } from '@/shared/decorators/roles.decorator';
import { UuidParam } from '@/shared/decorators/uuid-param.decorator';
import { UserType } from '@/users/domain/enums/user-type.enum';
import { CustomizeFinalGradeFormulaDto } from '../../application/dtos/customize-formula.dto';
import { FinalGradeFormulaUseCase } from '../../application/use-cases/final-grade-formula.use-case';
import {
  CustomizeFinalGradeFormulaSwaggerDocs,
  GetFinalGradeFormulaSwaggerDocs,
  RestoreFinalGradeFormulaSwaggerDocs,
} from './final-grade-formula.swagger';

@ApiTags('Fórmulas de Avaliação')
@Controller('salas/:roomId/problemas/:problemId/formula-final')
@Roles(UserType.TUTOR)
export class FinalGradeFormulaController {
  constructor(private readonly formula: FinalGradeFormulaUseCase) {}

  @Get()
  @GetFinalGradeFormulaSwaggerDocs
  get(
    @UuidParam('roomId') roomId: string,
    @UuidParam('problemId') problemId: string,
    @AuthenticatedUserId() tutorId: string,
  ) {
    return this.formula.get(roomId, problemId, tutorId);
  }

  @Put()
  @HttpCode(HttpStatus.OK)
  @CustomizeFinalGradeFormulaSwaggerDocs
  customize(
    @UuidParam('roomId') roomId: string,
    @UuidParam('problemId') problemId: string,
    @Body() dto: CustomizeFinalGradeFormulaDto,
    @AuthenticatedUserId() tutorId: string,
  ) {
    return this.formula.customize(roomId, problemId, tutorId, dto.sessoes);
  }

  @Post('restaurar-padrao')
  @HttpCode(HttpStatus.OK)
  @RestoreFinalGradeFormulaSwaggerDocs
  restore(
    @UuidParam('roomId') roomId: string,
    @UuidParam('problemId') problemId: string,
    @AuthenticatedUserId() tutorId: string,
  ) {
    return this.formula.restore(roomId, problemId, tutorId);
  }
}
