import { useState, useEffect, useCallback } from 'react';
import { observationService } from '@/services/observation.service';
import type { BehaviorTag, ObservationItem } from '@/types/observation';

export function useStudentObservationTags(sessionId: string, studentId: string) {
  const [tags, setTags] = useState<BehaviorTag[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [observations, setObservations] = useState<ObservationItem[]>([]);

  const fetchObs = useCallback(async () => {
    const [tagList, obsData] = await Promise.all([
      observationService.listTags().catch(() => []),
      observationService
        .listStudentObservations(sessionId, studentId)
        .catch(() => ({ observacoes: [], contagem: {} })),
    ]);
    return { tagList, obsData };
  }, [sessionId, studentId]);

  useEffect(() => {
    if (sessionId && studentId) {
      fetchObs().then((res) => {
        setTags(res.tagList);
        setCounts(res.obsData.contagem);
        setObservations(res.obsData.observacoes);
      });
    }
  }, [sessionId, studentId, fetchObs]);

  async function handleTagClick(tagId: string) {
    setCounts((prev) => ({ ...prev, [tagId]: (prev[tagId] ?? 0) + 1 }));
    const created = await observationService.registerObservation(sessionId, studentId, {
      marcacaoIds: [tagId],
    });
    setObservations((prev) => [...prev, created]);
  }

  async function handleTagDecrement(tagId: string) {
    setCounts((prev) => ({ ...prev, [tagId]: Math.max(0, (prev[tagId] ?? 1) - 1) }));
    const target = observations
      .slice()
      .reverse()
      .find((o) => o.marcacoes.some((m) => m.id === tagId));
    if (target) {
      setObservations((prev) => prev.filter((o) => o.id !== target.id));
      await observationService.undoObservation(target.id).catch(() => null);
    }
  }

  return { tags, counts, handleTagClick, handleTagDecrement };
}
