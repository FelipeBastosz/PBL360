import { ReportColumnType } from '@/report-files/domain/report-document';
import type { GradesResponseDto } from '../../dtos/grades-response.dto';
import { buildPendenciesTableSection } from './problem-report-pendencies.helper';

describe('problem-report-pendencies.helper', () => {
  const grades: GradesResponseDto = {
    sessoes: [
      { id: 'sess-1', rotulo: 'Abertura', data: '2026-10-01' },
      { id: 'sess-2', rotulo: 'Fechamento', data: '2026-10-08' },
    ],
    alunos: [
      {
        alunoId: 'aluno-1',
        nome: 'Ana Souza',
        matricula: '20260001',
        sessoes: [
          {
            sessaoId: 'sess-1',
            nota: 8.5,
            situacao: 'AVALIADA',
            modalidade: 'TUTOR',
            autoavaliacao: { nota: 8.5, situacao: 'AVALIADA' },
            pares: { nota: 8.5, situacao: 'AVALIADA' },
          },
          {
            sessaoId: 'sess-2',
            nota: null,
            situacao: 'PENDENTE',
            modalidade: 'TUTOR',
            autoavaliacao: { nota: null, situacao: 'PENDENTE' },
            pares: { nota: null, situacao: 'PENDENTE' },
          },
        ],
        notaFinal: null,
        autoavaliacao: { nota: null, situacao: 'PENDENTE' },
        pares: { nota: null, situacao: 'PENDENTE' },
      },
      {
        alunoId: 'aluno-2',
        nome: 'Bruno Lima',
        matricula: null,
        sessoes: [
          {
            sessaoId: 'sess-1',
            nota: 7.0,
            situacao: 'AVALIADA',
            modalidade: 'TUTOR',
            autoavaliacao: { nota: 7.0, situacao: 'AVALIADA' },
            pares: { nota: 7.0, situacao: 'AVALIADA' },
          },
          {
            sessaoId: 'sess-2',
            nota: null,
            situacao: 'JUSTIFICADA',
            modalidade: 'TUTOR',
            autoavaliacao: { nota: null, situacao: 'JUSTIFICADA' },
            pares: { nota: null, situacao: 'JUSTIFICADA' },
          },
        ],
        notaFinal: 7.0,
        autoavaliacao: { nota: 7.0, situacao: 'AVALIADA' },
        pares: { nota: 7.0, situacao: 'AVALIADA' },
      },
    ],
    mediaTurma: 7.75,
    versoesFormula: { sessao: 1, problema: 1 },
  };

  it('builds pendencies table with student names and registrations when ocultarNomes is false', () => {
    const section = buildPendenciesTableSection(grades, false);

    expect(section).toEqual({
      kind: 'table',
      title: 'Pendências de avaliação',
      columns: [
        { header: 'Aluno', type: ReportColumnType.TEXT },
        { header: 'Matrícula', type: ReportColumnType.TEXT },
        { header: 'Sessão pendente', type: ReportColumnType.TEXT },
      ],
      rows: [['Ana Souza', '20260001', 'Fechamento']],
    });
  });

  it('omits student name column when ocultarNomes is true', () => {
    const section = buildPendenciesTableSection(grades, true);

    expect(section).toEqual({
      kind: 'table',
      title: 'Pendências de avaliação',
      columns: [
        { header: 'Matrícula', type: ReportColumnType.TEXT },
        { header: 'Sessão pendente', type: ReportColumnType.TEXT },
      ],
      rows: [['20260001', 'Fechamento']],
    });
  });

  it('returns null when there are no pending sessions', () => {
    const noPendenciesGrades: GradesResponseDto = {
      ...grades,
      alunos: [
        {
          ...grades.alunos[0],
          sessoes: [
            { ...grades.alunos[0].sessoes[0] },
            { ...grades.alunos[0].sessoes[1], situacao: 'AVALIADA', nota: 9.0 },
          ],
        },
      ],
    };

    const section = buildPendenciesTableSection(noPendenciesGrades, false);
    expect(section).toBeNull();
  });
});
