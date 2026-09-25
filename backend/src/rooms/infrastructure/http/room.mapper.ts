import type { RoomResponseDto } from '../../application/dtos/room-response.dto';
import type { UpdateRoomDto } from '../../application/dtos/update-room.dto';
import type { Room, RoomChanges } from '../../domain/entities/room.entity';

export const toRoomResponse = (room: Room): RoomResponseDto => ({
  id: room.id,
  professorResponsavelId: room.tutorId,
  nome: room.name,
  codigoDisciplina: room.courseCode,
  codigoSala: room.roomCode,
  semestre: room.semester,
  ativo: room.active,
  criadoEm: room.createdAt,
});

export const toRoomChanges = (dto: UpdateRoomDto): RoomChanges => ({
  name: dto.nome,
  semester: dto.semestre,
  active: dto.ativo,
});
