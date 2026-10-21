import { applyDecorators, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthenticatedUserId } from '@/shared/decorators/authenticated-user-id.decorator';
import { Roles } from '@/shared/decorators/roles.decorator';
import { UuidParam } from '@/shared/decorators/uuid-param.decorator';
import { UserType } from '@/users/domain/enums/user-type.enum';
import { JWT_SECURITY_SCHEME } from '@/config/swagger.config';
import { ErrorResponseDto } from '@/shared/dtos/error-response.dto';
import { CloseSessionUseCase } from '../../application/use-cases/close-session.use-case';

class ClosedSessionResponseDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ example: 'concluida' }) status: string;
  @ApiProperty({ format: 'date-time' }) encerradaEm: Date;
  @ApiProperty({ format: 'uuid' }) encerradaPor: string;
}

const CloseSessionSwaggerDocs = applyDecorators(
  ApiOperation({ summary: 'Registra o encerramento de uma sessão tutorial' }),
  ApiOkResponse({ type: ClosedSessionResponseDto }),
  ApiUnauthorizedResponse({
    description: 'JWT não informado, inválido ou expirado.',
    type: ErrorResponseDto,
  }),
  ApiForbiddenResponse({
    description: 'O professor não possui vínculo ativo com a sala.',
    type: ErrorResponseDto,
  }),
  ApiNotFoundResponse({ description: 'Sessão não encontrada.', type: ErrorResponseDto }),
);

@ApiTags('Sessões')
@ApiBearerAuth(JWT_SECURITY_SCHEME)
@Controller('sessoes')
@Roles(UserType.TUTOR)
export class CloseSessionController {
  constructor(private readonly closeSession: CloseSessionUseCase) {}

  @Post(':sessaoId/encerrar')
  @HttpCode(HttpStatus.OK)
  @CloseSessionSwaggerDocs
  async close(@UuidParam('sessaoId') sessionId: string, @AuthenticatedUserId() tutorId: string) {
    const session = await this.closeSession.execute(sessionId, tutorId);
    return {
      id: session.id,
      status: session.status,
      encerradaEm: session.closedAt,
      encerradaPor: session.closedBy,
    };
  }
}
