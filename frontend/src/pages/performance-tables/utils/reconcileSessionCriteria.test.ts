import { describe, expect, it } from 'vitest';
import type { CriterionInput, PerformanceTable } from '@/types/performanceTable';
import type { SessionEvaluationConfig } from '@/types/session';
import {
  buildPastSessionPermissions,
  mergeTableWithSessionConfig,
  reconcileSessionCriteria,
} from './reconcileSessionCriteria';

const baseCriteria: CriterionInput[] = [
  { id: 'cat-1', nome: 'Participação', descricao: 'Fala nas sessões', peso: 4, ordem: 1 },
  { id: 'cat-2', nome: 'Domínio', descricao: 'Domínio do tema', peso: 6, ordem: 2 },
];

const baseTable: PerformanceTable = {
  id: 'cat-table-1',
  nome: 'Barema Original',
  descricao: 'Descrição original',
  criterios: [
    { id: 'cat-1', nome: 'Participação', descricao: 'Fala nas sessões', peso: 4, ordem: 1 },
    { id: 'cat-2', nome: 'Domínio', descricao: 'Domínio do tema', peso: 6, ordem: 2 },
  ],
};

describe('reconcileSessionCriteria', () => {
  it('returns base criteria when session criteria are empty or undefined', () => {
    expect(reconcileSessionCriteria(baseCriteria, undefined)).toEqual(baseCriteria);
    expect(reconcileSessionCriteria(baseCriteria, [])).toEqual(baseCriteria);
  });

  it('replaces IDs and weights with session criteria while preserving descriptions and order', () => {
    const result = reconcileSessionCriteria(baseCriteria, [
      { id: 'sess-1', nome: 'Participação', peso: 3 },
      { id: 'sess-2', nome: 'Domínio', peso: 7 },
    ]);

    expect(result).toEqual([
      { id: 'sess-1', nome: 'Participação', descricao: 'Fala nas sessões', peso: 3, ordem: 1 },
      { id: 'sess-2', nome: 'Domínio', descricao: 'Domínio do tema', peso: 7, ordem: 2 },
    ]);
  });
});

describe('buildPastSessionPermissions', () => {
  it('returns null when table has no past sessions', () => {
    expect(buildPastSessionPermissions(baseTable)).toBeNull();
    expect(buildPastSessionPermissions({ ...baseTable, quantidadeSessoesPassadas: 0 })).toBeNull();
  });

  it('returns locked permissions when table was used in past sessions', () => {
    expect(buildPastSessionPermissions({ ...baseTable, quantidadeSessoesPassadas: 2 })).toEqual({
      podeEditarCriterios: false,
      motivo: 'Esta tabela já foi usada em sessões que aconteceram',
      sessoesQueUsam: [],
    });
  });
});

describe('mergeTableWithSessionConfig', () => {
  it('merges session config name and criterion IDs with base table descriptions', () => {
    const config: SessionEvaluationConfig = {
      tabela: {
        id: 'copy-table-1',
        nome: 'Barema Original — P1S1',
        padrao: false,
        criterios: [
          { id: 'sc-1', nome: 'Participação', peso: 2 },
          { id: 'sc-2', nome: 'Domínio', peso: 8 },
        ],
      },
      formula: { padrao: true, versao: null, componentes: [] },
      bloqueada: false,
    };

    const merged = mergeTableWithSessionConfig(baseTable, null, config);

    expect(merged.nome).toBe('Barema Original — P1S1');
    expect(merged.descricao).toBe('Descrição original');
    expect(merged.criterios).toEqual([
      { id: 'sc-1', nome: 'Participação', descricao: 'Fala nas sessões', peso: 2, ordem: 1 },
      { id: 'sc-2', nome: 'Domínio', descricao: 'Domínio do tema', peso: 8, ordem: 2 },
    ]);
  });
});
