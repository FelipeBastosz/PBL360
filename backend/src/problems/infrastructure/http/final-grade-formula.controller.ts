import { Body, Controller, Get, HttpCode, HttpStatus, Post, Put } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { AuthenticatedUserId } from '@/shared/decorators/authenticated-user-id.decorator';
import { Roles } from '@/shared/decorators/roles.decorator';
import { UuidParam } from '@/shared/decorators/uuid-param.decorator';
import { UserType } from '@/users/domain/enums/user-type.enum';
import { JWT_SECURITY_SCHEME } from '@/config/swagger.config';
import { CustomizeFinalGradeFormulaDto } from '../../application/dtos/customize-formula.dto';
import { FinalGradeFormulaResponseDto } from '../../application/dtos/final-grade-formula-response.dto';
import { FinalGradeFormulaUseCase } from '../../application/use-cases/final-grade-formula.use-case';

@ApiBearerAuth(JWT_SECURITY_SCHEME)
@Controller('salas/:roomId/problemas/:problemId/formula-final')
@Roles(UserType.TUTOR)
export class FinalGradeFormulaController {
  constructor(private readonly formula: FinalGradeFormulaUseCase) {}

  @Get()
  @ApiOperation({ summary: 'Obtém a fórmula vigente da nota final do problema.' })
  @ApiOkResponse({
    description: 'Fórmula retornada com sucesso.',
    type: FinalGradeFormulaResponseDto,
  })
  get(
    @UuidParam('roomId') roomId: string,
    @UuidParam('problemId') problemId: string,
    @AuthenticatedUserId() tutorId: string,
  ) {
    return this.formula.get(roomId, problemId, tutorId);
  }

  @Put()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Personaliza os pesos relativos das sessões na nota final.' })
  @ApiOkResponse({
    description: 'Fórmula personalizada salva com sucesso.',
    type: FinalGradeFormulaResponseDto,
  })
  @ApiUnprocessableEntityResponse({ description: 'Sessões ou pesos inválidos.' })
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
  @ApiOperation({ summary: 'Restaura a média simples das sessões.' })
  @ApiOkResponse({ description: 'Fórmula padrão restaurada.', type: FinalGradeFormulaResponseDto })
  restore(
    @UuidParam('roomId') roomId: string,
    @UuidParam('problemId') problemId: string,
    @AuthenticatedUserId() tutorId: string,
  ) {
    return this.formula.restore(roomId, problemId, tutorId);
  }
}
