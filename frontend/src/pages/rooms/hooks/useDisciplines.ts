import { useEffect, useState } from 'react';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { disciplineService } from '@/services/discipline.service';
import type { Discipline } from '@/types/discipline';

export function useDisciplines() {
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const { run, isLoading, error } = useAsyncAction(disciplineService.list);

  useEffect(() => {
    run().then((res) => {
      if (res.ok) setDisciplines(res.data);
    });
  }, [run]);

  return { disciplines, isLoading, error };
}
