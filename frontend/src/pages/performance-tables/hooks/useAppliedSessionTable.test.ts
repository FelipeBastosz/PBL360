import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { performanceTableService } from '@/services/performance-table.service';
import { roomService } from '@/services/room.service';
import { useAppliedSessionTable } from './useAppliedSessionTable';
import type { PerformanceTable } from '@/types/performanceTable';
import type { SessionEvaluationConfig } from '@/types/session';
import type { RoomTutor } from '@/types/room';

vi.mock('@/services/performance-table.service');
vi.mock('@/services/room.service');

const mockConfig: SessionEvaluationConfig = {
  tabela: {
    id: 'applied-table-uuid',
    nome: 'Barema do Colega',
    padrao: false,
    criterios: [],
  },
  formula: { padrao: true, versao: null, componentes: [] },
  bloqueada: false,
};

const mockDetails: PerformanceTable = {
  id: 'applied-table-uuid',
  professorId: 'tutor-prof-10',
  nome: 'Barema do Colega',
  descricao: 'Criado pelo professor titular',
  quantidadeProblemas: 1,
  criterios: [
    { id: 'c1', nome: 'Critério 1', peso: 5, ordem: 1, descricao: null },
    { id: 'c2', nome: 'Critério 2', peso: 5, ordem: 2, descricao: null },
  ],
  criadoEm: '2025-01-01',
  atualizadoEm: '2025-01-01',
};

describe('useAppliedSessionTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('resolves real author name from roomService.listTutors when table is missing from catalog', async () => {
    vi.mocked(performanceTableService.getById).mockResolvedValue(mockDetails);
    vi.mocked(roomService.listTutors).mockResolvedValue([
      {
        id: 'tutor-prof-10',
        nome: 'Prof. Carlos Alberto',
      } as unknown as RoomTutor,
    ]);

    const { result } = renderHook(() => useAppliedSessionTable(mockConfig, [], 'room-123', null));

    await waitFor(() => {
      expect(result.current).not.toBeNull();
    });

    expect(result.current?.autor?.nome).toBe('Prof. Carlos Alberto');
    expect(roomService.listTutors).toHaveBeenCalledWith('room-123');
  });
});
