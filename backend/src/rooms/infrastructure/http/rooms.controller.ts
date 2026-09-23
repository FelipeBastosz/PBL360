import {
  Body,
  Controller,
  ForbiddenException,
  Post,
  Patch,
  Param,
  UseGuards,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';

import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiNoContentResponse,
} from '@nestjs/swagger';

import { AuthenticatedUserId } from '@/shared/decorators/authenticated-user-id.decorator';
import { Roles } from '@/shared/decorators/roles.decorator';
import { AuthGuard } from '@/shared/guards/auth.guard';
import { RolesGuard } from '@/shared/guards/roles.guard';
import { UserType } from '@/users/domain/enums/user-type.enum';

import { CreateRoomDto } from '../../application/dtos/create-room.dto';
import { UpdateRoomDto } from '../../application/dtos/update-room.dto';
import { CreateRoomUseCase } from '../../application/use-cases/create-room.use-case';
import { UpdateRoomUseCase } from '../../application/use-cases/update-room.use-case';
import { UpdateRoomResponseDto } from '@/rooms/application/dtos/update-room-response.dto';
import { ErrorResponseDto } from '@/shared/dtos/error-response.dto';
import { DeleteRoomUseCase } from '@/rooms/application/use-cases/delete-room.use-case';
import { DeleteRoomDto } from '@/rooms/application/dtos/delete-room.dto';

@Controller('salas')
@UseGuards(AuthGuard, RolesGuard)
export class RoomsController {
  constructor(
    private readonly createRoomUseCase: CreateRoomUseCase,
    private readonly updateRoomUseCase: UpdateRoomUseCase,
    private readonly deleteRoomUseCase: DeleteRoomUseCase,
  ) {}

  @Post()
  @Roles(UserType.TUTOR)
  create(@Body() dto: CreateRoomDto, @AuthenticatedUserId() authenticatedTutorId: string) {
    if (dto.tutorId !== authenticatedTutorId) {
      throw new ForbiddenException('Não é permitido criar uma sala em nome de outro professor.');
    }

    return this.createRoomUseCase.execute({
      tutorId: dto.tutorId,
      name: dto.nome,
      semester: dto.semestre,
    });
  }

  @Patch(':id')
  @Roles(UserType.TUTOR)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Atualiza os dados de uma sala',
    description:
      'Valida as informações enviadas, atualiza a sala correspondente ao ID informado e devolve os dados atualizados.',
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
    description: 'Não autorizado. Token de acesso não informado, inválido ou expirado.',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Acesso negado. Apenas usuários com perfil TUTOR podem realizar esta ação.',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Sala não encontrada pelo ID fornecido.',
    type: ErrorResponseDto,
  })
  async edit(
    @Param('id') roomId: string,
    @Body() updateRoomDto: UpdateRoomDto,
  ): Promise<UpdateRoomResponseDto> {
    return this.updateRoomUseCase.execute(roomId, updateRoomDto);
  }

  @Delete(':id')
  @Roles(UserType.TUTOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Exclui uma sala',
    description:
      'Realiza a exclusão lógica da sala correspondente ao ID informado. Valida se o usuário requerente é o professor responsável pela sala.',
  })
  @ApiNoContentResponse({
    description: 'Sala excluída com sucesso (exclusão lógica). Não retorna conteúdo.',
  })
  @ApiBadRequestResponse({
    description: 'Dados inválidos fornecidos para a exclusão (ex: UUID inválido).',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Não autorizado. Token de acesso não informado, inválido ou expirado.',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Acesso negado. Apenas o professor responsável pode excluir esta sala.',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Sala não encontrada pelo ID fornecido ou já excluída.',
    type: ErrorResponseDto,
  })
  async delete(@Param('id') roomId: string, @Body() deleteRoomDto: DeleteRoomDto): Promise<void> {
    return this.deleteRoomUseCase.execute(roomId, deleteRoomDto);
  }
}
