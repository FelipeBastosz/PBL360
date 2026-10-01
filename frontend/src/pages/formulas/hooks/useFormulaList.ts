import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { performanceTableService } from '@/services/performance-table.service';
import type { PerformanceTable, PerformanceTableSummary } from '@/types/performanceTable';

export function useFormulaList() {
  const [summaries, setSummaries] = useState<PerformanceTableSummary[]>([]);
  const [query, setQuery] = useState('');
  const [loadedDetails, setLoadedDetails] = useState<Record<string, PerformanceTable>>({});

  const { run: fetchList, isLoading: isListLoading } = useAsyncAction(performanceTableService.list);
  const { run: fetchDetails } = useAsyncAction(performanceTableService.getById);

  const loadList = useCallback(async () => {
    const res = await fetchList();
    if (res.ok) {
      setSummaries(res.data);
      // Busca automaticamente os critérios da fórmula que tiver isDefault: true no banco
      const defaultTable = res.data.find((item) => item.isDefault) ?? res.data[0];
      if (defaultTable) {
        const detailsRes = await fetchDetails(defaultTable.id);
        if (detailsRes.ok) {
          setLoadedDetails((prev) => ({ ...prev, [defaultTable.id]: detailsRes.data }));
        }
      }
    }
  }, [fetchList, fetchDetails]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadList();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadList]);

  const loadDetails = async (id: string) => {
    if (!loadedDetails[id]) {
      const res = await fetchDetails(id);
      if (res.ok) setLoadedDetails((prev) => ({ ...prev, [id]: res.data }));
    }
  };

  const filteredSummaries = useMemo(() => {
    return summaries.filter((s) => s.nome.toLowerCase().includes(query.toLowerCase()));
  }, [summaries, query]);

  return {
    setSummaries,
    query,
    setQuery,
    filteredSummaries,
    loadedDetails,
    setLoadedDetails,
    loadDetails,
    isListLoading,
  };
}
