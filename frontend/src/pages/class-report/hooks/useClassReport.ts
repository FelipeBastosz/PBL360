import { useCallback, useEffect, useState } from 'react';
import { classReportService } from '@/services/class-report.service';
import { toApiError } from '@/services/apiError';
import type { ClassFinalReportResponse } from '@/types/class-report';

function getErrorMessage(err: unknown): string {
  const apiErr = toApiError(err);
  if (apiErr.status === 401 || apiErr.status === 403) {
    return 'Você não possui permissão para acessar o relatório final desta turma.';
  }
  if (apiErr.status === 404) {
    return 'Turma não encontrada.';
  }
  return apiErr.messages[0] || 'Não foi possível carregar o relatório final da turma.';
}

export function useClassReport(roomId?: string) {
  const [data, setData] = useState<ClassFinalReportResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const refetch = useCallback(() => {
    setIsLoading(true);
    setReloadKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let active = true;
    if (!roomId) {
      return;
    }
    classReportService
      .getFinalReport(roomId)
      .then((response) => {
        if (!active) return;
        setData(response);
        setError(null);
        setIsLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setError(getErrorMessage(err));
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [roomId, reloadKey]);

  return { data, isLoading, error, refetch };
}
