import { Body, Controller, Get, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthenticatedUserId } from '@/shared/decorators/authenticated-user-id.decorator';
import { Roles } from '@/shared/decorators/roles.decorator';
import { UuidParam } from '@/shared/decorators/uuid-param.decorator';
import { UserType } from '@/users/domain/enums/user-type.enum';
import { EditSessionTableDto } from '../../application/dtos/edit-session-table.dto';
import { GetSessionTableEditPermissionsUseCase } from '../../application/use-cases/get-session-table-edit-permissions.use-case';
import { EditSessionTableUseCase } from '../../application/use-cases/edit-session-table.use-case';
import {
  toSessionTableEditInput,
  toSessionTableEditResponse,
  toTableEditPermissionsResponse,
} from './session-table-editing.mapper';
import {
  GetSessionTableEditPermissionsSwaggerDocs,
  EditSessionTableSwaggerDocs,
} from './session-table-editing.swagger';

@ApiTags('Configuração da sessão')
@Controller('sessoes/:sessaoId/tabela')
@Roles(UserType.TUTOR)
export class SessionTableEditingController {
  constructor(
    private readonly permissions: GetSessionTableEditPermissionsUseCase,
    private readonly editTable: EditSessionTableUseCase,
  ) {}

  @Get('permissoes-edicao')
  @GetSessionTableEditPermissionsSwaggerDocs
  async get(@UuidParam('sessaoId') sessionId: string, @AuthenticatedUserId() tutorId: string) {
    return toTableEditPermissionsResponse(await this.permissions.execute(sessionId, tutorId));
  }

  @Put('edicao')
  @EditSessionTableSwaggerDocs
  async put(
    @UuidParam('sessaoId') sessionId: string,
    @AuthenticatedUserId() tutorId: string,
    @Body() dto: EditSessionTableDto,
  ) {
    return toSessionTableEditResponse(
      await this.editTable.execute(toSessionTableEditInput(dto, sessionId, tutorId)),
    );
  }
}
