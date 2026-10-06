import { Body, Controller, Get, HttpCode, HttpStatus, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthenticatedUserId } from '@/shared/decorators/authenticated-user-id.decorator';
import { Roles } from '@/shared/decorators/roles.decorator';
import { UuidParam } from '@/shared/decorators/uuid-param.decorator';
import { UserType } from '@/users/domain/enums/user-type.enum';
import {
  DOMAIN_TO_SESSION_ROLE,
  SESSION_ROLE_TO_DOMAIN,
  UpdateSessionRoleDto,
} from '../../application/dtos/session-role.dto';
import { AssignSessionRoleUseCase } from '../../application/use-cases/assign-session-role.use-case';
import { ListSessionRolesUseCase } from '../../application/use-cases/list-session-roles.use-case';
import { ListSessionRolesSwaggerDocs, SessionRoleSwaggerDocs } from './session-role.swagger';

@ApiTags('Papéis da sessão')
@Controller('sessoes')
@Roles(UserType.TUTOR)
export class SessionRolesController {
  constructor(
    private readonly listSessionRoles: ListSessionRolesUseCase,
    private readonly assignSessionRole: AssignSessionRoleUseCase,
  ) {}

  @Get(':sessionId/papeis')
  @ListSessionRolesSwaggerDocs
  async list(@UuidParam('sessionId') sessionId: string, @AuthenticatedUserId() tutorId: string) {
    const roles = await this.listSessionRoles.execute({ sessionId, tutorId });
    return roles.map((item) => ({
      alunoId: item.studentId,
      nome: item.name,
      papel: DOMAIN_TO_SESSION_ROLE[item.role],
      notaAdicional: item.bonusScore === null ? null : Number(item.bonusScore),
    }));
  }

  @Put(':sessionId/papeis/:studentId')
  @HttpCode(HttpStatus.OK)
  @SessionRoleSwaggerDocs
  async assign(
    @UuidParam('sessionId') sessionId: string,
    @UuidParam('studentId') studentId: string,
    @Body() dto: UpdateSessionRoleDto,
    @AuthenticatedUserId() tutorId: string,
  ) {
    const result = await this.assignSessionRole.execute({
      sessionId,
      tutorId,
      studentId,
      role: dto.papel == null ? null : SESSION_ROLE_TO_DOMAIN[dto.papel],
      bonusScore: dto.papel == null ? null : (dto.notaAdicional ?? null),
      transfer: dto.transferir ?? false,
    });
    return toRoleResponse(result);
  }
}

const toRoleResponse = (result: {
  studentId: string;
  role: keyof typeof DOMAIN_TO_SESSION_ROLE | null;
  bonusScore: number | null;
}) => ({
  alunoId: result.studentId,
  papel: result.role === null ? null : DOMAIN_TO_SESSION_ROLE[result.role],
  notaAdicional: result.bonusScore,
});
