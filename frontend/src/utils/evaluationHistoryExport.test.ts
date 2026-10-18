import { describe, expect, it } from 'vitest';
import type { StudentEvaluationHistoryItem } from '@/types/evaluationHistory';
import { buildExportTable, exportFileName, toCsv, toPrintHtml } from './evaluationHistoryExport';

const items: StudentEvaluationHistoryItem[] = [
  {
    alunoId: 'aluno-1',
    nome: 'Carla "Cacá" Rocha',
    matricula: '26121192',
    notaAluno: 8.5,
    notaAlunoOriginal: 9.5,
    notaTutor: 7,
    notaPares: 8,
    avaliacoesPares: 2,
    situacaoAjuste: 'AJUSTADA',
  },
  {
    alunoId: 'aluno-2',
    nome: 'Bruno <Mendes>',
    matricula: null,
    notaAluno: null,
    notaAlunoOriginal: null,
    notaTutor: null,
    notaPares: null,
    avaliacoesPares: 0,
    situacaoAjuste: 'SEM_AJUSTE',
  },
];

describe('buildExportTable', () => {
  it('includes names when they are visible', () => {
    const table = buildExportTable(items, false);

    expect(table.headers).toEqual([
      'Matrícula',
      'Nome',
      'Nota do aluno',
      'Nota do tutor',
      'Situação',
    ]);
    expect(table.rows[0]).toEqual([
      '26121192',
      'Carla "Cacá" Rocha',
      '9,5',
      '8,5',
      'Ajustada com justificativa',
    ]);
    expect(table.rows[1]).toEqual(['', 'Bruno <Mendes>', '', '', 'Avaliação pendente']);
  });

  it('omits the name column when names are hidden', () => {
    const table = buildExportTable(items, true);

    expect(table.headers).not.toContain('Nome');
    expect(table.rows[0]).toEqual(['26121192', '9,5', '8,5', 'Ajustada com justificativa']);
  });
});

describe('toCsv', () => {
  it('uses a BOM, semicolons and escapes quotes and separators', () => {
    const csv = toCsv({ headers: ['A', 'B'], rows: [['x;y', 'a "b"']] });

    expect(csv.startsWith('﻿')).toBe(true);
    expect(csv.slice(1)).toBe('A;B\r\n"x;y";"a ""b"""');
  });
});

describe('toPrintHtml', () => {
  it('renders an escaped table', () => {
    const html = toPrintHtml(buildExportTable(items, false), 'Histórico', new Date(2026, 9, 14));

    expect(html).toContain('<th>Matrícula</th>');
    expect(html).toContain('Bruno &lt;Mendes&gt;');
    expect(html).not.toContain('<Mendes>');
  });
});

describe('exportFileName', () => {
  it('builds a dated file name', () => {
    expect(exportFileName('csv', new Date('2026-10-14T12:00:00Z'))).toBe(
      'historico-avaliacoes-2026-10-14.csv',
    );
  });
});
