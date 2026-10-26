import type {
  RoomResponseDto,
  RoomSummaryResponseDto,
} from '../../application/dtos/room-response.dto';
import type { UpdateRoomDto } from '../../application/dtos/update-room.dto';
import type { Room, RoomChanges } from '../../domain/entities/room.entity';
import type { RoomTutor, TutorRoomSummary } from '../../domain/repositories/room.repository';
import type { RoomTutorResponseDto } from '../../application/dtos/room-tutor-response.dto';
import { InvalidRequestError } from '@/shared/errors/application.error';

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

export const toRoomSummaryResponse = (summary: TutorRoomSummary): RoomSummaryResponseDto => ({
  ...toRoomResponse(summary.room),
  totalAlunos: summary.totalStudents,
  totalProblemas: summary.totalProblems,
});

export const toRoomTutorResponse = (tutor: RoomTutor): RoomTutorResponseDto => ({
  id: tutor.id,
  nome: tutor.name,
  email: tutor.email,
  responsavel: tutor.isResponsible,
});

export const toRoomChanges = (dto: UpdateRoomDto): RoomChanges => ({
  name: dto.nome,
  semester: dto.semestre,
  active: dto.ativo,
});

export const roomCodeFromInviteLink = (link: string): string => {
  const pathname = new URL(link).pathname;
  const match = pathname.match(/^\/salas\/([A-Za-z0-9]{8})\/?$/);
  const roomCode = match?.[1];

  if (!roomCode) {
    throw new InvalidRequestError('O link de ingresso é inválido.');
  }

  return roomCode;
};
