import type { EditSessionTableDto } from '../../application/dtos/edit-session-table.dto';
import type {
  SessionTableEditInput,
  SessionTableEditResult,
  TableSessionUsage,
} from '../../domain/repositories/session-table-editing.repository';

export function toSessionTableEditInput(
  dto: EditSessionTableDto,
  sessionId: string,
  tutorId: string,
): SessionTableEditInput {
  return {
    sessionId,
    tutorId,
    scope: dto.escopo,
    name: dto.nome,
    criteria: dto.criterios.map((criterion) => ({
      id: criterion.id,
      name: criterion.nome,
      weight: criterion.peso,
    })),
  };
}

export function toSessionTableEditResponse(result: SessionTableEditResult) {
  return {
    tabela: { id: result.table.id, nome: result.table.name },
    sessoesAtualizadas: result.sessions.map((session) => ({
      sessaoId: session.sessionId,
      rotulo: session.label,
    })),
  };
}

export function toTableEditPermissionsResponse(result: {
  canEditCriteria: boolean;
  reason: string | null;
  sessions: TableSessionUsage[];
}) {
  return {
    podeEditarCriterios: result.canEditCriteria,
    motivo: result.reason,
    sessoesQueUsam: result.sessions.map((session) => ({
      sessaoId: session.sessionId,
      rotulo: session.label,
      jaAconteceu: session.hasOccurred,
    })),
  };
}
