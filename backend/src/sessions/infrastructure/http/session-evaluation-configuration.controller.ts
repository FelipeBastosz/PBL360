import { Body, Controller, Get, HttpCode, HttpStatus, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthenticatedUserId } from '@/shared/decorators/authenticated-user-id.decorator';
import { Roles } from '@/shared/decorators/roles.decorator';
import { UuidParam } from '@/shared/decorators/uuid-param.decorator';
import { UserType } from '@/users/domain/enums/user-type.enum';
import { JWT_SECURITY_SCHEME } from '@/config/swagger.config';
import {
  SessionEvaluationConfigurationDto,
  SessionFormulaDto,
  UpdateSessionFormulaDto,
  UpdateSessionTableDto,
} from '../../application/dtos/session-evaluation-configuration.dto';
import { SessionEvaluationConfigurationService } from '../../application/services/session-evaluation-configuration.service';
import {
  GetSessionEvaluationConfigurationSwaggerDocs,
  GetSessionFormulaSwaggerDocs,
  RestoreSessionFormulaSwaggerDocs,
  SetSessionFormulaSwaggerDocs,
  SetSessionTableSwaggerDocs,
} from './session-evaluation-configuration.swagger';

@ApiTags('Configuração da sessão')
@ApiBearerAuth(JWT_SECURITY_SCHEME)
@Controller('sessoes/:sessaoId')
@Roles(UserType.TUTOR)
export class SessionEvaluationConfigurationController {
  constructor(private readonly configuration: SessionEvaluationConfigurationService) {}

  @Get('configuracao-avaliacao')
  @GetSessionEvaluationConfigurationSwaggerDocs
  get(
    @UuidParam('sessaoId') sessionId: string,
    @AuthenticatedUserId() tutorId: string,
  ): Promise<SessionEvaluationConfigurationDto> {
    return this.configuration.get(sessionId, tutorId);
  }

  @Get('formula')
  @GetSessionFormulaSwaggerDocs
  getFormula(
    @UuidParam('sessaoId') sessionId: string,
    @AuthenticatedUserId() tutorId: string,
  ): Promise<SessionFormulaDto> {
    return this.configuration.getFormula(sessionId, tutorId);
  }

  @Put('tabela')
  @HttpCode(HttpStatus.OK)
  @SetSessionTableSwaggerDocs
  setTable(
    @UuidParam('sessaoId') sessionId: string,
    @Body() dto: UpdateSessionTableDto,
    @AuthenticatedUserId() tutorId: string,
  ) {
    return this.configuration.setTable(
      sessionId,
      tutorId,
      dto.tabelaId,
      dto.aplicarNasSeguintes ?? false,
    );
  }

  @Put('formula')
  @HttpCode(HttpStatus.OK)
  @SetSessionFormulaSwaggerDocs
  setFormula(
    @UuidParam('sessaoId') sessionId: string,
    @Body() dto: UpdateSessionFormulaDto,
    @AuthenticatedUserId() tutorId: string,
  ) {
    return this.configuration.setFormula(
      sessionId,
      tutorId,
      dto.componentes,
      dto.aplicarNasSeguintes ?? false,
    );
  }

  @Post('formula/restaurar-padrao')
  @HttpCode(HttpStatus.OK)
  @RestoreSessionFormulaSwaggerDocs
  restoreFormula(@UuidParam('sessaoId') sessionId: string, @AuthenticatedUserId() tutorId: string) {
    return this.configuration.restoreFormula(sessionId, tutorId);
  }
}
