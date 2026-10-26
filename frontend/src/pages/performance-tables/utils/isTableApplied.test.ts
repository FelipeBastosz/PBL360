import { describe, expect, it } from 'vitest';
import { isTableApplied } from './isTableApplied';
import type { PerformanceTableSummary } from '@/types/performanceTable';
import type { SessionEvaluationConfig } from '@/types/session';

const baseTable: PerformanceTableSummary = {
  id: 'table-orig-1',
  nome: 'Barema Oficial',
  descricao: null,
  quantidadeCriterios: 3,
};

const baseConfig: SessionEvaluationConfig = {
  tabela: {
    id: 'table-orig-1',
    nome: 'Barema Oficial',
    padrao: false,
    criterios: [],
  },
  formula: { padrao: true, versao: null, componentes: [] },
  bloqueada: false,
};

describe('isTableApplied', () => {
  it('returns true when IDs match directly', () => {
    expect(isTableApplied(baseTable, baseConfig)).toBe(true);
  });

  it('returns true when table is a session copy with a session suffix in the name', () => {
    const copyConfig: SessionEvaluationConfig = {
      ...baseConfig,
      tabela: {
        id: 'table-copy-999',
        nome: 'Barema Oficial — P1S2',
        padrao: false,
        criterios: [],
      },
    };

    expect(isTableApplied(baseTable, copyConfig)).toBe(true);
  });

  it('returns true when names match regardless of case and whitespaces', () => {
    const caseConfig: SessionEvaluationConfig = {
      ...baseConfig,
      tabela: {
        id: 'table-copy-999',
        nome: '  barema oficial  ',
        padrao: false,
        criterios: [],
      },
    };

    expect(isTableApplied(baseTable, caseConfig)).toBe(true);
  });

  it('returns false when config is null or table has another name', () => {
    expect(isTableApplied(baseTable, null)).toBe(false);

    const differentConfig: SessionEvaluationConfig = {
      ...baseConfig,
      tabela: {
        id: 'table-other',
        nome: 'Outro Barema',
        padrao: false,
        criterios: [],
      },
    };

    expect(isTableApplied(baseTable, differentConfig)).toBe(false);
  });
});
