import { useCallback, useEffect, useState } from 'react';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { disciplineService } from '@/services/discipline.service';
import type { CreateDisciplinePayload, Discipline } from '@/types/discipline';

export function useDisciplines() {
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const { run, isLoading, error } = useAsyncAction(disciplineService.list);

  useEffect(() => {
    run().then((res) => {
      if (res.ok) setDisciplines(res.data);
    });
  }, [run]);

  const register = useCallback(async (payload: CreateDisciplinePayload) => {
    const created = await disciplineService.create(payload);
    setDisciplines((current) => [...current, created]);
    return created;
  }, []);

  return { disciplines, isLoading, error, register };
}
