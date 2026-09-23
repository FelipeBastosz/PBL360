import {
  Body,
  Controller,
  ForbiddenException,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { JWT_SECURITY_SCHEME } from '@/config/swagger.config';
import { AuthenticatedUserId } from '@/shared/decorators/authenticated-user-id.decorator';
import { Roles } from '@/shared/decorators/roles.decorator';
import { ErrorResponseDto } from '@/shared/dtos/error-response.dto';
import { AuthGuard } from '@/shared/guards/auth.guard';
import { RolesGuard } from '@/shared/guards/roles.guard';
import { UserType } from '@/users/domain/enums/user-type.enum';

import { CreateRoomDto } from '../../application/dtos/create-room.dto';
import { UpdateRoomDto } from '../../application/dtos/update-room.dto';
import { UpdateRoomResponseDto } from '../../application/dtos/update-room-response.dto';
import { CreateRoomUseCase } from '../../application/use-cases/create-room.use-case';
import { UpdateRoomUseCase } from '../../application/use-cases/update-room.use-case';

@ApiTags('Salas')
@Controller('salas')
@UseGuards(AuthGuard, RolesGuard)
export class RoomsController {
  constructor(
    private readonly createRoomUseCase: CreateRoomUseCase,
    private readonly updateRoomUseCase: UpdateRoomUseCase,
  ) {}

  @Post()
  @Roles(UserType.TUTOR)
  @ApiBearerAuth(JWT_SECURITY_SCHEME)
  @ApiOperation({
    summary: 'Cria uma nova sala',
    description:
      'Permite que um professor autenticado crie uma sala. ' +
      'O professor informa o nome, o código da turma e o semestre. ' +
      'O código da turma (code), como EXA123, identifica a turma acadêmica. ' +
      'O sistema gera automaticamente um token de acesso (accessToken), ' +
      'utilizado pelos alunos para ingressar na sala.',
  })
  @ApiBody({
    description:
      'Dados necessários para criar uma sala. ' +
      'O token de acesso é gerado automaticamente pelo sistema.',
    type: CreateRoomDto,
  })
  @ApiCreatedResponse({
    description: 'Sala criada com sucesso.',
    schema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          format: 'uuid',
          description: 'Identificador único da sala.',
          example: '550e8400-e29b-41d4-a716-446655440000',
        },
        tutorId: {
          type: 'string',
          format: 'uuid',
          description: 'Identificador do professor responsável.',
          example: '123e4567-e89b-42d3-a456-426614174000',
        },
        name: {
          type: 'string',
          description: 'Nome da sala.',
          example: 'Engenharia de Software',
        },
        code: {
          type: 'string',
          description: 'Código da turma informado pelo professor.',
          example: 'EXA123',
        },
        accessToken: {
          type: 'string',
          description: 'Token de 8 caracteres gerado automaticamente para ingresso na sala.',
          example: 'aB7kP2x9',
        },
        semester: {
          type: 'string',
          description: 'Semestre acadêmico da turma.',
          example: '2026.2',
        },
        active: {
          type: 'boolean',
          description: 'Indica se a sala está ativa.',
          example: true,
        },
        createdAt: {
          type: 'string',
          format: 'date-time',
          description: 'Data e hora de criação da sala.',
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Dados inválidos fornecidos para a criação.',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'JWT não informado, inválido ou expirado.',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description:
      'Acesso negado. Apenas professores podem criar salas. ' +
      'Não é permitido criar uma sala em nome de outro professor.',
    type: ErrorResponseDto,
  })
  create(@Body() dto: CreateRoomDto, @AuthenticatedUserId() authenticatedTutorId: string) {
    if (dto.tutorId !== authenticatedTutorId) {
      throw new ForbiddenException('Não é permitido criar uma sala em nome de outro professor.');
    }

    return this.createRoomUseCase.execute({
      tutorId: dto.tutorId,
      name: dto.nome,
      code: dto.codigo,
      semester: dto.semestre,
    });
  }

  @Patch(':id')
  @Roles(UserType.TUTOR)
  @ApiBearerAuth(JWT_SECURITY_SCHEME)
  @ApiOperation({
    summary: 'Atualiza os dados de uma sala',
    description:
      'Atualiza nome, semestre ou status de uma sala. ' +
      'O professor deve estar associado à sala para realizar a edição. ' +
      'Sua identidade é obtida pelo JWT.',
  })
  @ApiOkResponse({
    description: 'Sala atualizada com sucesso.',
    type: UpdateRoomResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Dados inválidos fornecidos para a atualização.',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'JWT não informado, inválido ou expirado.',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Acesso negado. O usuário não é professor ou não está associado à sala.',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Sala não encontrada pelo ID fornecido.',
    type: ErrorResponseDto,
  })
  async edit(
    @Param('id') roomId: string,
    @Body() updateRoomDto: UpdateRoomDto,
    @AuthenticatedUserId() authenticatedTutorId: string,
  ): Promise<UpdateRoomResponseDto> {
    return this.updateRoomUseCase.execute(roomId, authenticatedTutorId, updateRoomDto);
  }
}
