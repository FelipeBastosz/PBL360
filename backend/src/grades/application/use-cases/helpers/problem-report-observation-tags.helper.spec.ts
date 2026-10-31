import { ReportColumnType } from '@/report-files/domain/report-document';
import type { ProblemObservationTagDetail } from '@/grades/domain/repositories/grades.repository';
import type { GradesResponseDto } from '../../dtos/grades-response.dto';
import { buildObservationTagsTableSection } from './problem-report-observation-tags.helper';

describe('problem-report-observation-tags.helper', () => {
  const studentMap = new Map<string, GradesResponseDto['alunos'][number]>([
    [
      'student-1',
      {
        alunoId: 'student-1',
        nome: 'Maria Clara',
        matricula: '20261001',
        sessoes: [],
        notaFinal: 9.0,
      },
    ],
    [
      'student-2',
      {
        alunoId: 'student-2',
        nome: 'João Pedro',
        matricula: null,
        sessoes: [],
        notaFinal: 8.0,
      },
    ],
  ]);

  it('returns null when marcacoes array is empty', () => {
    const result = buildObservationTagsTableSection([], studentMap);
    expect(result).toBeNull();
  });

  it('returns null when all items have empty tags', () => {
    const marcacoes: ProblemObservationTagDetail[] = [
      {
        studentId: 'student-1',
        sessionId: 'sess-1',
        sessionTitle: 'Sessão 1',
        tags: [],
      },
    ];
    const result = buildObservationTagsTableSection(marcacoes, studentMap);
    expect(result).toBeNull();
  });

  it('builds table section with student names and tags', () => {
    const marcacoes: ProblemObservationTagDetail[] = [
      {
        studentId: 'student-1',
        sessionId: 'sess-1',
        sessionTitle: 'Abertura',
        tags: ['Pontual', 'Participativo'],
      },
      {
        studentId: 'student-2',
        sessionId: 'sess-2',
        sessionTitle: 'Fechamento',
        tags: ['Colaborativo'],
      },
    ];

    const result = buildObservationTagsTableSection(marcacoes, studentMap);
    expect(result).toEqual({
      kind: 'table',
      title: 'Marcações das sessões',
      columns: [
        { header: 'Aluno', type: ReportColumnType.TEXT },
        { header: 'Matrícula', type: ReportColumnType.TEXT },
        { header: 'Sessão', type: ReportColumnType.TEXT },
        { header: 'Marcações', type: ReportColumnType.TEXT },
      ],
      rows: [
        ['Maria Clara', '20261001', 'Abertura', 'Pontual, Participativo'],
        ['João Pedro', null, 'Fechamento', 'Colaborativo'],
      ],
    });
  });

  it('builds table section with ocultarNomes: true omitting student names', () => {
    const marcacoes: ProblemObservationTagDetail[] = [
      {
        studentId: 'student-1',
        sessionId: 'sess-1',
        sessionTitle: 'Abertura',
        tags: ['Pontual'],
      },
      {
        studentId: 'student-unknown',
        sessionId: 'sess-1',
        sessionTitle: 'Abertura',
        tags: ['Proativo'],
      },
    ];

    const result = buildObservationTagsTableSection(marcacoes, studentMap, true);
    expect(result).toEqual({
      kind: 'table',
      title: 'Marcações das sessões',
      columns: [
        { header: 'Matrícula', type: ReportColumnType.TEXT },
        { header: 'Sessão', type: ReportColumnType.TEXT },
        { header: 'Marcações', type: ReportColumnType.TEXT },
      ],
      rows: [
        ['20261001', 'Abertura', 'Pontual'],
        [null, 'Abertura', 'Proativo'],
      ],
    });
  });
});
