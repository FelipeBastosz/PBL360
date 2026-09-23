import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';

import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { JWT_SECURITY_SCHEME } from '@/config/swagger.config';
import { AuthenticatedUserId } from '@/shared/decorators/authenticated-user-id.decorator';
import { Roles } from '@/shared/decorators/roles.decorator';
import { ErrorResponseDto } from '@/shared/dtos/error-response.dto';
import { AuthGuard } from '@/shared/guards/auth.guard';
import { RolesGuard } from '@/shared/guards/roles.guard';
import { UserType } from '@/users/domain/enums/user-type.enum';

import { AddTutorToRoomDto } from '../../application/dtos/add-tutor-to-room.dto';
import { AddTutorToRoomUseCase } from '../../application/use-cases/add-tutor-to-room.use-case';
import { RemoveTutorFromRoomUseCase } from '../../application/use-cases/remove-tutor-from-room.use-case';

@ApiTags('Salas - Professores')
@Controller('salas')
@UseGuards(AuthGuard, RolesGuard)
export class RoomTutorsController {
  constructor(
    private readonly addTutorToRoomUseCase: AddTutorToRoomUseCase,
    private readonly removeTutorFromRoomUseCase: RemoveTutorFromRoomUseCase,
  ) {}

  @Post(':id/professores')
  @Roles(UserType.TUTOR)
  @ApiBearerAuth(JWT_SECURITY_SCHEME)
  @ApiOperation({
    summary: 'Adiciona um professor à sala',
    description:
      'Permite que o professor responsável associe outro professor ' +
      'cadastrado à sala. O professor responsável é identificado pelo JWT.',
  })
  @ApiOkResponse({
    description: 'Professor associado à sala com sucesso.',
  })
  @ApiBadRequestResponse({
    description: 'Identificador inválido.',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'JWT não informado, inválido ou expirado.',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Acesso negado. Apenas o professor responsável pode adicionar professores.',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Sala ou professor não encontrado.',
    type: ErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'O professor já está associado à sala.',
    type: ErrorResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  async addTutor(
    @Param('id', new ParseUUIDPipe()) roomId: string,
    @Body() dto: AddTutorToRoomDto,
    @AuthenticatedUserId() authenticatedTutorId: string,
  ): Promise<{ message: string }> {
    await this.addTutorToRoomUseCase.execute(roomId, authenticatedTutorId, dto.tutorId);

    return {
      message: 'Professor associado à sala com sucesso.',
    };
  }

  @Delete(':id/professores/:tutorId')
  @Roles(UserType.TUTOR)
  @ApiBearerAuth(JWT_SECURITY_SCHEME)
  @ApiOperation({
    summary: 'Remove um professor da sala',
    description:
      'Permite que o professor responsável remova outro professor ' +
      'associado à sala. O professor responsável não pode ser removido.',
  })
  @ApiOkResponse({
    description: 'Professor removido da sala com sucesso.',
  })
  @ApiBadRequestResponse({
    description: 'Identificador inválido.',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'JWT não informado, inválido ou expirado.',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description:
      'Acesso negado. Apenas o professor responsável pode remover professores. ' +
      'O professor responsável não pode ser removido.',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Sala ou associação não encontrada.',
    type: ErrorResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  async removeTutor(
    @Param('id', new ParseUUIDPipe()) roomId: string,
    @Param('tutorId', new ParseUUIDPipe()) tutorId: string,
    @AuthenticatedUserId() authenticatedTutorId: string,
  ): Promise<{ message: string }> {
    await this.removeTutorFromRoomUseCase.execute(roomId, authenticatedTutorId, tutorId);

    return {
      message: 'Professor removido da sala com sucesso.',
    };
  }
}
