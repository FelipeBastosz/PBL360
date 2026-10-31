import type { Session } from '../../domain/entities/session.entity';
import type {
  SessionCreatedResponseDto,
  SessionDetailResponseDto,
  SessionListResponseDto,
} from '../../application/dtos/session-response.dto';
import type { UpdateSessionDto } from '../../application/dtos/update-session.dto';
import type { UpdateSessionInput } from '../../application/use-cases/update-session.use-case';
import type { SessionDeletionImpactDto } from '../../application/dtos/session-deletion-impact.dto';
import type { GetSessionDeletionImpactOutput } from '../../application/use-cases/get-session-deletion-impact.use-case';
import { toBrazilianDate, toIsoDate } from '@/shared/dates/brazilian-date';

export const toSessionResponse = (session: Session): SessionListResponseDto => ({
  id: session.id,
  titulo: session.title,
  descricao: session.description,
  data: toBrazilianDate(session.date)!,
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
  date: toIsoDate(dto.data),
});

export const toSessionDeletionImpactResponse = (
  impact: GetSessionDeletionImpactOutput,
): SessionDeletionImpactDto => ({
  podeExcluir: impact.canDelete,
  chamada: impact.rollCall,
  papeis: impact.roles,
  observacoes: impact.observations,
  avaliacoes: impact.evaluations,
  feedbacks: impact.feedbacks,
});
