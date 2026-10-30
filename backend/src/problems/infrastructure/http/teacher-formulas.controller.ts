import { Body, Controller, Get, HttpCode, HttpStatus, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthenticatedUserId } from '@/shared/decorators/authenticated-user-id.decorator';
import { Roles } from '@/shared/decorators/roles.decorator';
import { UserType } from '@/users/domain/enums/user-type.enum';
import {
  type TeacherFormulaDto,
  UpdateTeacherFormulaDto,
} from '../../application/dtos/teacher-formula.dto';
import { GetTeacherFormulaUseCase } from '../../application/use-cases/get-teacher-formula.use-case';
import { UpdateTeacherFormulaUseCase } from '../../application/use-cases/update-teacher-formula.use-case';
import { toTeacherFormulaResponse } from './teacher-formula.mapper';
import {
  GetTeacherFormulaSwaggerDocs,
  UpdateTeacherFormulaSwaggerDocs,
} from './teacher-formulas.swagger';

@ApiTags('Professores')
@Controller('professores')
@Roles(UserType.TUTOR)
export class TeacherFormulasController {
  constructor(
    private readonly getTeacherFormula: GetTeacherFormulaUseCase,
    private readonly updateTeacherFormula: UpdateTeacherFormulaUseCase,
  ) {}

  @Get('me/formulas')
  @GetTeacherFormulaSwaggerDocs
  async get(@AuthenticatedUserId() tutorId: string): Promise<TeacherFormulaDto> {
    const formula = await this.getTeacherFormula.execute({ tutorId });
    return toTeacherFormulaResponse(formula);
  }

  @Put('me/formulas')
  @HttpCode(HttpStatus.OK)
  @UpdateTeacherFormulaSwaggerDocs
  async update(
    @AuthenticatedUserId() tutorId: string,
    @Body() dto: UpdateTeacherFormulaDto,
  ): Promise<TeacherFormulaDto> {
    const formula = await this.updateTeacherFormula.execute({
      tutorId,
      components: dto.componentes.map((c) => ({ type: c.tipo, weight: c.peso })),
    });
    return toTeacherFormulaResponse(formula);
  }
}
