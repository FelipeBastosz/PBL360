import type { Session } from '../../domain/entities/session.entity';
import type {
  SessionCreatedResponseDto,
  SessionDetailResponseDto,
  SessionResponseDto,
} from '../../application/dtos/session-response.dto';
import type { UpdateSessionDto } from '../../application/dtos/update-session.dto';
import type { UpdateSessionInput } from '../../application/use-cases/update-session.use-case';

export const toSessionResponse = (session: Session): SessionResponseDto => ({
  id: session.id,
  titulo: session.title,
  descricao: session.description,
  data: session.date,
  ordem: session.orderIndex,
  status: session.status,
});

export const toSessionDetailResponse = (
  session: Session,
  problemId: string,
  roomId: string,
): SessionDetailResponseDto => ({
  ...toSessionResponse(session),
  problemaId: problemId,
  salaId: roomId,
});

export const toSessionCreatedResponse = (
  session: Session,
  problemId: string,
): SessionCreatedResponseDto => ({ ...toSessionResponse(session), problemaId: problemId });

export const toUpdateSessionInput = (
  roomId: string,
  problemId: string,
  sessionId: string,
  tutorId: string,
  dto: UpdateSessionDto,
): UpdateSessionInput => ({
  roomId,
  problemId,
  sessionId,
  tutorId,
  title: dto.titulo,
  description: dto.descricao,
  date: dto.data,
});
