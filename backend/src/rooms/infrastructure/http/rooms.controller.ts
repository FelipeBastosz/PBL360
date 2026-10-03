import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { AuthenticatedUserId } from '@/shared/decorators/authenticated-user-id.decorator';
import { Roles } from '@/shared/decorators/roles.decorator';
import { UuidParam } from '@/shared/decorators/uuid-param.decorator';
import { UserType } from '@/users/domain/enums/user-type.enum';

import { CreateRoomDto } from '../../application/dtos/create-room.dto';
import type {
  RoomResponseDto,
  RoomSummaryResponseDto,
} from '../../application/dtos/room-response.dto';
import { UpdateRoomDto } from '../../application/dtos/update-room.dto';
import { CreateRoomUseCase } from '../../application/use-cases/create-room.use-case';
import { DeleteRoomUseCase } from '../../application/use-cases/delete-room.use-case';
import { GetRoomDetailUseCase } from '../../application/use-cases/get-room-detail.use-case';
import { ListRoomStudentsUseCase } from '../../application/use-cases/list-room-students.use-case';
import { ListRoomsUseCase } from '../../application/use-cases/list-rooms.use-case';
import { ListStudentRoomsUseCase } from '../../application/use-cases/list-student-rooms.use-case';
import { UpdateRoomUseCase } from '../../application/use-cases/update-room.use-case';
import { RoomStudentResponseDto } from '../../application/dtos/room-student-response.dto';
import { StudentRoomResponseDto } from '../../application/dtos/student-room-response.dto';
import { JoinRoomByCodeDto, JoinRoomByLinkDto } from '../../application/dtos/join-room.dto';
import { JoinRoomUseCase } from '../../application/use-cases/join-room.use-case';
import { MessageResponseDto } from '@/shared/dtos/message-response.dto';
import { RoomEntryThrottlerGuard } from '@/shared/throttling/room-entry-throttler.guard';
import { AUTH_THROTTLER, ROOM_ENTRY_LIMIT } from '@/shared/throttling/throttlers';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { roomCodeFromInviteLink, toRoomChanges, toRoomResponse } from './room.mapper';
import {
  CreateRoomSwaggerDocs,
  DeleteRoomSwaggerDocs,
  EditRoomSwaggerDocs,
  GetRoomDetailSwaggerDocs,
  ListRoomsSwaggerDocs,
} from './room.swagger';
import { ListRoomStudentsSwaggerDocs, ListStudentRoomsSwaggerDocs } from './room-members.swagger';
import { JoinRoomByCodeSwaggerDocs, JoinRoomByLinkSwaggerDocs } from './room-entry.swagger';

@ApiTags('Salas')
@Controller('salas')
@Roles(UserType.TUTOR)
export class RoomsController {
  constructor(
    private readonly createRoomUseCase: CreateRoomUseCase,
    private readonly updateRoomUseCase: UpdateRoomUseCase,
    private readonly deleteRoomUseCase: DeleteRoomUseCase,
    private readonly listRoomsUseCase: ListRoomsUseCase,
    private readonly getRoomDetailUseCase: GetRoomDetailUseCase,
    private readonly listStudentRoomsUseCase: ListStudentRoomsUseCase,
    private readonly listRoomStudentsUseCase: ListRoomStudentsUseCase,
    private readonly joinRoomUseCase: JoinRoomUseCase,
  ) {}

  @Post('ingressar/codigo')
  @HttpCode(HttpStatus.OK)
  @Roles(UserType.STUDENT)
  @Throttle(ROOM_ENTRY_LIMIT)
  @SkipThrottle({ [AUTH_THROTTLER]: true })
  @UseGuards(RoomEntryThrottlerGuard)
  @JoinRoomByCodeSwaggerDocs
  joinByCode(
    @Body() dto: JoinRoomByCodeDto,
    @AuthenticatedUserId() studentId: string,
  ): Promise<MessageResponseDto> {
    return this.joinRoom(dto.codigoSala, studentId);
  }

  @Post('ingressar/link')
  @HttpCode(HttpStatus.OK)
  @Roles(UserType.STUDENT)
  @Throttle(ROOM_ENTRY_LIMIT)
  @SkipThrottle({ [AUTH_THROTTLER]: true })
  @UseGuards(RoomEntryThrottlerGuard)
  @JoinRoomByLinkSwaggerDocs
  joinByLink(
    @Body() dto: JoinRoomByLinkDto,
    @AuthenticatedUserId() studentId: string,
  ): Promise<MessageResponseDto> {
    return this.joinRoom(roomCodeFromInviteLink(dto.link), studentId);
  }

  private async joinRoom(roomCode: string, studentId: string): Promise<MessageResponseDto> {
    await this.joinRoomUseCase.execute({ roomCode, studentId });

    return { mensagem: 'Entrada na sala realizada com sucesso.' };
  }

  @Get('minhas')
  @Roles(UserType.STUDENT)
  @ListStudentRoomsSwaggerDocs
  async listStudentRooms(
    @AuthenticatedUserId() studentId: string,
  ): Promise<StudentRoomResponseDto[]> {
    const rooms = await this.listStudentRoomsUseCase.execute(studentId);

    return rooms.map((room) => ({
      salaId: room.roomId,
      nome: room.name,
      semestre: room.semester,
      totalAlunos: room.totalStudents,
      totalProblemas: room.totalProblems,
    }));
  }

  @Get(':id/alunos')
  @ListRoomStudentsSwaggerDocs
  async listRoomStudents(
    @UuidParam('id') roomId: string,
    @AuthenticatedUserId() tutorId: string,
  ): Promise<RoomStudentResponseDto[]> {
    const students = await this.listRoomStudentsUseCase.execute(roomId, tutorId);

    return students.map((student) => ({ nome: student.name, dataEntrada: student.joinedAt }));
  }

  @Get()
  @ListRoomsSwaggerDocs
  async list(@AuthenticatedUserId() tutorId: string): Promise<RoomSummaryResponseDto[]> {
    const rooms = await this.listRoomsUseCase.execute(tutorId);

    return rooms.map(({ room, totalStudents, totalProblems }) => ({
      ...toRoomResponse(room),
      totalAlunos: totalStudents,
      totalProblemas: totalProblems,
    }));
  }

  @Get(':id')
  @GetRoomDetailSwaggerDocs
  async getDetail(
    @UuidParam('id') roomId: string,
    @AuthenticatedUserId() tutorId: string,
  ): Promise<RoomResponseDto> {
    return toRoomResponse(await this.getRoomDetailUseCase.execute(roomId, tutorId));
  }

  @Post()
  @CreateRoomSwaggerDocs
  async create(
    @Body() dto: CreateRoomDto,
    @AuthenticatedUserId() tutorId: string,
  ): Promise<RoomResponseDto> {
    const room = await this.createRoomUseCase.execute({
      tutorId,
      name: dto.nome,
      courseCode: dto.codigoDisciplina,
      semester: dto.semestre,
    });

    return toRoomResponse(room);
  }

  @Patch(':id')
  @EditRoomSwaggerDocs
  async edit(
    @UuidParam('id') roomId: string,
    @Body() dto: UpdateRoomDto,
    @AuthenticatedUserId() tutorId: string,
  ): Promise<RoomResponseDto> {
    return toRoomResponse(
      await this.updateRoomUseCase.execute(roomId, tutorId, toRoomChanges(dto)),
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @DeleteRoomSwaggerDocs
  delete(@UuidParam('id') roomId: string, @AuthenticatedUserId() tutorId: string): Promise<void> {
    return this.deleteRoomUseCase.execute(roomId, tutorId);
  }
}
