import { describe, expect, it } from 'vitest';
import type { StudentPerformanceSession } from '@/types/studentPerformance';
import {
  MODALITY_LABELS,
  situationLabel,
  situationTone,
  toChartPoints,
  toLinePath,
  toProblemBands,
} from './studentPerformance';

function session(
  id: string,
  nota: number | null,
  problemaId = 'p1',
  problemaTitulo = 'Problema 1',
): StudentPerformanceSession {
  return {
    sessaoId: id,
    problemaId,
    problemaTitulo,
    rotulo: 'Sessão 1',
    data: '05-08-2026',
    nota,
    situacao: nota === null ? 'PENDENTE' : 'AVALIADA',
    modalidade: 'TUTOR',
    presenca: 'PRESENTE',
    marcacoes: [],
  };
}

describe('toChartPoints', () => {
  it('spreads the sessions evenly and maps 10 to the top and 0 to the bottom', () => {
    const points = toChartPoints([session('a', 10), session('b', 0)]);

    expect(points).toEqual([
      { id: 'a', x: 25, y: 0 },
      { id: 'b', x: 75, y: 100 },
    ]);
  });

  it('keeps a pending grade without a vertical position instead of turning it into zero', () => {
    const [point] = toChartPoints([session('a', null)]);

    expect(point.y).toBeNull();
  });
});

describe('toLinePath', () => {
  it('joins consecutive grades into one segment', () => {
    const points = toChartPoints([session('a', 5), session('b', 10)]);

    expect(toLinePath(points)).toBe('M250 50 L750 0');
  });

  it('breaks the line at a pending grade instead of bridging over it', () => {
    const points = toChartPoints([
      session('a', 5),
      session('b', 6),
      session('c', null),
      session('d', 7),
      session('e', 8),
    ]);

    expect(toLinePath(points)).toBe('M100 50 L300 40 M700 30 L900 20');
  });

  it('draws no line for a single session', () => {
    expect(toLinePath(toChartPoints([session('a', 7)]))).toBe('');
  });

  it('keeps zero as a real point of the line', () => {
    const points = toChartPoints([session('a', 0), session('b', 4)]);

    expect(toLinePath(points)).toBe('M250 100 L750 60');
  });
});

describe('toProblemBands', () => {
  it('groups consecutive sessions of the same problem', () => {
    const bands = toProblemBands([
      session('a', 7, 'p1', 'Problema 1'),
      session('b', 8, 'p1', 'Problema 1'),
      session('c', 6, 'p2', 'Problema 2'),
    ]);

    expect(bands).toEqual([
      { problemId: 'p1', title: 'Problema 1', start: 0, size: 2 },
      { problemId: 'p2', title: 'Problema 2', start: 2, size: 1 },
    ]);
  });
});

describe('situation helpers', () => {
  it('translates the known situations and tones', () => {
    expect(situationLabel('NAO_ENVIADA')).toBe('Não enviada');
    expect(situationTone('AVALIADA')).toBe('success');
    expect(situationTone('PENDENTE')).toBe('warning');
  });

  it('labels the Planning Poker modality', () => {
    expect(MODALITY_LABELS.PLANNING_POKER).toBe('Planning Poker');
  });

  it('keeps an unknown situation readable', () => {
    expect(situationLabel('EM_REVISAO')).toBe('Em revisao');
    expect(situationTone('EM_REVISAO')).toBe('info');
  });
});
