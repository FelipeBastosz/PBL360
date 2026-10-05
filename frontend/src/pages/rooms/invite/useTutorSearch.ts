import { useEffect, useState } from 'react';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { userService } from '@/services/user.service';
import type { TutorSummary } from '@/types/room';

export const MIN_SEARCH_LENGTH = 3;

type SearchResult = { term: string; tutors: TutorSummary[]; failed: boolean };

export function useTutorSearch(query: string) {
  const term = useDebouncedValue(query.trim(), 300);
  const [result, setResult] = useState<SearchResult | null>(null);
  const isSearchable = term.length >= MIN_SEARCH_LENGTH;

  useEffect(() => {
    if (!isSearchable) return undefined;
    let active = true;
    userService
      .searchTutors(term)
      .then((tutors) => {
        if (active) setResult({ term, tutors, failed: false });
      })
      .catch(() => {
        if (active) setResult({ term, tutors: [], failed: true });
      });
    return () => {
      active = false;
    };
  }, [term, isSearchable]);

  const current = isSearchable && result?.term === term ? result : null;

  return {
    isSearchable,
    isSearching: isSearchable && !current,
    tutors: current?.tutors ?? [],
    failed: current?.failed ?? false,
  };
}
