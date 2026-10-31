import { useState, useEffect } from 'react';
import { performanceTableService } from '@/services/performance-table.service';
import { roomService } from '@/services/room.service';
import type { PerformanceTableSummary } from '@/types/performanceTable';
import type { SessionEvaluationConfig } from '@/types/session';

type UserContext = {
  id?: string;
  name?: string;
  nome?: string;
} | null;

async function resolveAuthorName(
  professorId: string | null | undefined,
  roomId?: string,
  tables: PerformanceTableSummary[] = [],
  user?: UserContext,
): Promise<string> {
  if (!professorId) return 'Professor da turma';

  const userName = user?.nome ?? user?.name;
  if (user?.id && professorId === user.id && userName) {
    return userName;
  }
  const existingAuthor = tables.find((t) => t.autor?.id === professorId)?.autor?.nome;
  if (existingAuthor && existingAuthor !== 'Sistema') {
    return existingAuthor;
  }

  if (roomId) {
    try {
      const tutors = await roomService.listTutors(roomId);
      const match = tutors.find((t) => t.id === professorId);
      if (match?.nome) return match.nome;
    } catch {
      // Falha silenciosa de rede
    }
  }

  return 'Professor da turma';
}

export function useAppliedSessionTable(
  sessionConfig: SessionEvaluationConfig | null,
  tables: PerformanceTableSummary[],
  roomId?: string,
  user?: UserContext,
): PerformanceTableSummary | null {
  const [externalTable, setExternalTable] = useState<PerformanceTableSummary | null>(null);

  useEffect(() => {
    const activeTable = sessionConfig?.tabela;

    if (!activeTable || tables.some((t) => t.id === activeTable.id)) {
      return;
    }

    let isMounted = true;
    const request = performanceTableService.getById(activeTable.id);
    if (!request || typeof request.then !== 'function') {
      return;
    }

    request
      .then(async (details) => {
        if (!isMounted) return;
        const authorName = await resolveAuthorName(details.professorId, roomId, tables, user);

        setExternalTable({
          id: details.id,
          nome: details.nome,
          descricao: details.descricao ?? null,
          quantidadeCriterios: details.criterios?.length ?? 0,
          quantidadeProblemas: details.quantidadeProblemas ?? 0,
          criadoEm: details.criadoEm ?? new Date().toISOString(),
          atualizadoEm: details.atualizadoEm ?? new Date().toISOString(),
          origem: 'TURMA',
          autor: { id: details.professorId ?? null, nome: authorName },
          emUso: 1,
        });
      })
      .catch(() => {
        if (!isMounted) return;
        setExternalTable(null);
      });

    return () => {
      isMounted = false;
    };
  }, [sessionConfig, tables, roomId, user]);

  return externalTable;
}
