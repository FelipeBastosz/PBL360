import { ReportColumnType, ReportFileFormat } from '@/report-files/domain/report-document';
import { FeedbackScope } from '@/feedbacks/domain/enums/feedback-scope.enum';
import type { ProblemFeedbackDetail } from '@/feedbacks/domain/repositories/feedback.repository';
import type { ProblemObservationTagDetail } from '../../domain/repositories/grades.repository';
import type { Room } from '@/rooms/domain/entities/room.entity';
import type { Problem } from '@/problems/domain/entities/problem.entity';
import type { GradesResponseDto } from '../../dtos/grades-response.dto';
import { buildProblemReportDocument } from './problem-report-document.helper';

describe('problem-report-document.helper', () => {
  const room = {
    id: 'room-1',
    name: 'Turma A — Medicina',
    courseCode: 'MED101',
    semester: '2026.2',
  } as Room;

  const problem = {
    id: 'problem-1',
    roomId: 'room-1',
    title: 'Problema 1 — Dor torácica',
    orderIndex: 1,
  } as Problem;

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
            nota: 9.0,
            situacao: 'AVALIADA',
            modalidade: 'TUTOR',
            autoavaliacao: { nota: 9.0, situacao: 'AVALIADA' },
            pares: { nota: 9.0, situacao: 'AVALIADA' },
          },
        ],
        notaFinal: 8.75,
        autoavaliacao: { nota: 8.75, situacao: 'AVALIADA' },
        pares: { nota: 8.75, situacao: 'AVALIADA' },
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
    ],
    mediaTurma: 8.75,
    versoesFormula: { sessao: 1, problema: 1 },
  };

  const feedbacks: ProblemFeedbackDetail[] = [
    {
      id: 'fb-1',
      scope: FeedbackScope.PROBLEM,
      authorId: 'tutor-1',
      authorName: 'Prof. Carlos',
      recipientId: null,
      recipientName: null,
      sessionId: null,
      sessionTitle: null,
      score: null,
      text: 'A turma evoluiu muito bem.',
      createdAt: new Date(),
      editedAt: null,
    },
    {
      id: 'fb-2',
      scope: FeedbackScope.SESSION,
      authorId: 'tutor-1',
      authorName: 'Prof. Carlos',
      recipientId: 'aluno-1',
      recipientName: 'Ana Souza',
      sessionId: 'sess-1',
      sessionTitle: 'Abertura',
      score: null,
      text: 'Excelente participação na abertura.',
      createdAt: new Date(),
      editedAt: null,
    },
    {
      id: 'fb-3',
      scope: FeedbackScope.STUDENT,
      authorId: 'tutor-2',
      authorName: 'Profa. Maria',
      recipientId: 'aluno-1',
      recipientName: 'Ana Souza',
      sessionId: null,
      sessionTitle: null,
      score: 9.0,
      text: 'Desempenho consistente em todo o problema.',
      createdAt: new Date(),
      editedAt: null,
    },
  ];

  const marcacoes: ProblemObservationTagDetail[] = [
    {
      studentId: 'aluno-1',
      sessionId: 'sess-1',
      sessionTitle: 'Abertura',
      sessionOrderIndex: 1,
      tags: ['Participativo', 'Pontual'],
    },
    {
      studentId: 'aluno-2',
      sessionId: 'sess-1',
      sessionTitle: 'Abertura',
      sessionOrderIndex: 1,
      tags: ['Disperso'],
    },
  ];

  it('builds full problem report document with grades and all feedback sections', () => {
    const doc = buildProblemReportDocument({
      room,
      problem,
      grades,
      feedbacks,
      format: ReportFileFormat.PDF,
    });

    expect(doc.format).toBe(ReportFileFormat.PDF);
    expect(doc.title).toBe('Relatório do problema');
    expect(doc.fileName).toBe('relatorio-problema-1-Turma A — Medicina');
    expect(doc.repeatIdentification).toBe(true);
    expect(doc.identification).toEqual([
      { label: 'Turma', value: 'Turma A — Medicina' },
      { label: 'Disciplina', value: 'MED101' },
      { label: 'Semestre', value: '2026.2' },
      { label: 'Problema', value: 'Problema 1 — Dor torácica' },
    ]);

    expect(doc.sections).toHaveLength(6);

    const table = doc.sections[0];
    expect(table.kind).toBe('table');
    if (table.kind === 'table') {
      expect(table.title).toBe('Notas por sessão');
      expect(table.columns).toEqual([
        { header: 'Aluno', type: ReportColumnType.TEXT },
        { header: 'Matrícula', type: ReportColumnType.TEXT },
        { header: 'Abertura', type: ReportColumnType.NUMBER, decimals: 1 },
        { header: 'Fechamento', type: ReportColumnType.NUMBER, decimals: 1 },
        { header: 'Nota final', type: ReportColumnType.NUMBER, decimals: 1 },
      ]);
      expect(table.rows).toEqual([
        ['Ana Souza', '20260001', 8.5, 9.0, 8.75],
        ['Bruno Lima', null, 7.0, null, null],
      ]);
    }

    const pendenciesSection = doc.sections[1];
    expect(pendenciesSection).toEqual({
      kind: 'table',
      title: 'Pendências de avaliação',
      columns: [
        { header: 'Aluno', type: ReportColumnType.TEXT },
        { header: 'Matrícula', type: ReportColumnType.TEXT },
        { header: 'Sessão pendente', type: ReportColumnType.TEXT },
      ],
      rows: [['Bruno Lima', null, 'Fechamento']],
    });

    const generalSection = doc.sections[2];
    expect(generalSection).toEqual({
      kind: 'text',
      title: 'Feedback geral do problema',
      entries: [{ label: 'Turma (Autor: Prof. Carlos)', text: 'A turma evoluiu muito bem.' }],
    });

    const sessionSection = doc.sections[3];
    expect(sessionSection).toEqual({
      kind: 'text',
      title: 'Feedbacks das sessões',
      entries: [
        {
          label: 'Ana Souza — Abertura (Autor: Prof. Carlos)',
          text: 'Excelente participação na abertura.',
        },
      ],
    });

    const studentSection = doc.sections[4];
    expect(studentSection).toEqual({
      kind: 'text',
      title: 'Feedbacks individuais',
      entries: [
        {
          label: 'Ana Souza (Autor: Profa. Maria)',
          text: 'Desempenho consistente em todo o problema.',
        },
      ],
    });

    const notesSection = doc.sections[5];
    expect(notesSection).toEqual({
      kind: 'text',
      title: 'Informações do relatório',
      entries: [
        {
          label: 'Critérios e notas',
          text: 'Notas das sessões consolidadas a partir das avaliações do professor e dos pesos cadastrados. A nota final pondera as notas das sessões disponíveis.',
        },
        {
          label: 'Pendências e faltas justificadas',
          text: 'Notas ausentes (— no PDF e células vazias no Excel) correspondem a sessões pendentes de avaliação ou com falta justificada. Faltas justificadas são desconsideradas no cálculo da nota final. Pendências de avaliação ativas são detalhadas na seção "Pendências de avaliação".',
        },
      ],
    });
  });

  it('handles missing orderIndex by using problem title in fileName', () => {
    const doc = buildProblemReportDocument({
      room,
      problem: { ...problem, orderIndex: null },
      grades,
      feedbacks: [],
      format: ReportFileFormat.XLSX,
    });

    expect(doc.fileName).toBe('relatorio-problema-Problema 1 — Dor torácica-Turma A — Medicina');
  });

  it('omits optional session and student feedback sections when empty but includes report info', () => {
    const doc = buildProblemReportDocument({
      room,
      problem,
      grades,
      feedbacks: [],
      format: ReportFileFormat.PDF,
    });

    expect(doc.sections).toHaveLength(4);
    expect(doc.sections[0].title).toBe('Notas por sessão');
    expect(doc.sections[1].title).toBe('Pendências de avaliação');
    expect(doc.sections[2]).toEqual({
      kind: 'text',
      title: 'Feedback geral do problema',
      entries: [{ label: 'Turma', text: null }],
    });
    expect(doc.sections[3].title).toBe('Informações do relatório');
  });

  it('does not list justified sessions as pendencies and omits pendency section when no session is pending', () => {
    const justifiedGrades: GradesResponseDto = {
      ...grades,
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
              situacao: 'JUSTIFICADA',
              modalidade: 'TUTOR',
              autoavaliacao: { nota: null, situacao: 'JUSTIFICADA' },
              pares: { nota: null, situacao: 'JUSTIFICADA' },
            },
          ],
          notaFinal: 8.5,
          autoavaliacao: { nota: 8.5, situacao: 'AVALIADA' },
          pares: { nota: 8.5, situacao: 'AVALIADA' },
        },
      ],
    };

    const doc = buildProblemReportDocument({
      room,
      problem,
      grades: justifiedGrades,
      feedbacks: [],
      format: ReportFileFormat.PDF,
    });

    const pendenciesSection = doc.sections.find((s) => s.title === 'Pendências de avaliação');
    expect(pendenciesSection).toBeUndefined();
  });

  it('builds problem report document with ocultarNomes: true omitting student names from tables and feedback', () => {
    const doc = buildProblemReportDocument({
      room,
      problem,
      grades,
      feedbacks,
      format: ReportFileFormat.PDF,
      ocultarNomes: true,
    });

    const table = doc.sections[0];
    expect(table.kind).toBe('table');
    if (table.kind === 'table') {
      expect(table.columns).toEqual([
        { header: 'Matrícula', type: ReportColumnType.TEXT },
        { header: 'Abertura', type: ReportColumnType.NUMBER, decimals: 1 },
        { header: 'Fechamento', type: ReportColumnType.NUMBER, decimals: 1 },
        { header: 'Nota final', type: ReportColumnType.NUMBER, decimals: 1 },
      ]);
      expect(table.rows).toEqual([
        ['20260001', 8.5, 9.0, 8.75],
        [null, 7.0, null, null],
      ]);
    }

    const pendenciesSection = doc.sections[1];
    expect(pendenciesSection).toEqual({
      kind: 'table',
      title: 'Pendências de avaliação',
      columns: [
        { header: 'Matrícula', type: ReportColumnType.TEXT },
        { header: 'Sessão pendente', type: ReportColumnType.TEXT },
      ],
      rows: [[null, 'Fechamento']],
    });

    const sessionSection = doc.sections[3];
    expect(sessionSection).toEqual({
      kind: 'text',
      title: 'Feedbacks das sessões',
      entries: [
        {
          label: 'Matrícula: 20260001 — Abertura (Autor: Prof. Carlos)',
          text: 'Excelente participação na abertura.',
        },
      ],
    });

    const studentSection = doc.sections[4];
    expect(studentSection).toEqual({
      kind: 'text',
      title: 'Feedbacks individuais',
      entries: [
        {
          label: 'Matrícula: 20260001 (Autor: Profa. Maria)',
          text: 'Desempenho consistente em todo o problema.',
        },
      ],
    });
  });

  it('includes observation tags section when marcacoes are provided', () => {
    const doc = buildProblemReportDocument({
      room,
      problem,
      grades,
      feedbacks,
      marcacoes,
      format: ReportFileFormat.PDF,
    });

    const tagsSection = doc.sections.find((s) => s.title === 'Marcações das sessões');
    expect(tagsSection).toBeDefined();
    expect(tagsSection).toEqual({
      kind: 'table',
      title: 'Marcações das sessões',
      columns: [
        { header: 'Aluno', type: ReportColumnType.TEXT },
        { header: 'Matrícula', type: ReportColumnType.TEXT },
        { header: 'Sessão', type: ReportColumnType.TEXT },
        { header: 'Marcações', type: ReportColumnType.TEXT },
      ],
      rows: [
        ['Ana Souza', '20260001', 'Abertura', 'Participativo, Pontual'],
        ['Bruno Lima', null, 'Abertura', 'Disperso'],
      ],
    });
  });

  it('formats observation tags table with ocultarNomes: true', () => {
    const doc = buildProblemReportDocument({
      room,
      problem,
      grades,
      feedbacks,
      marcacoes,
      format: ReportFileFormat.PDF,
      ocultarNomes: true,
    });

    const tagsSection = doc.sections.find((s) => s.title === 'Marcações das sessões');
    expect(tagsSection).toEqual({
      kind: 'table',
      title: 'Marcações das sessões',
      columns: [
        { header: 'Matrícula', type: ReportColumnType.TEXT },
        { header: 'Sessão', type: ReportColumnType.TEXT },
        { header: 'Marcações', type: ReportColumnType.TEXT },
      ],
      rows: [
        ['20260001', 'Abertura', 'Participativo, Pontual'],
        [null, 'Abertura', 'Disperso'],
      ],
    });
  });

  it('omits feedbacks when feedbacks is null or mostrarFeedback is false', () => {
    const docNull = buildProblemReportDocument({
      room,
      problem,
      grades,
      feedbacks: null,
      marcacoes,
      format: ReportFileFormat.PDF,
    });

    expect(docNull.sections.some((s) => s.title.includes('Feedback'))).toBe(false);
    expect(docNull.sections.some((s) => s.title === 'Marcações das sessões')).toBe(true);

    const docFalse = buildProblemReportDocument({
      room,
      problem,
      grades,
      feedbacks,
      marcacoes,
      format: ReportFileFormat.PDF,
      mostrarFeedback: false,
    });

    expect(docFalse.sections.some((s) => s.title.includes('Feedback'))).toBe(false);
  });

  it('omits marcacoes when marcacoes is null or mostrarMarcacoes is false', () => {
    const docNull = buildProblemReportDocument({
      room,
      problem,
      grades,
      feedbacks,
      marcacoes: null,
      format: ReportFileFormat.PDF,
    });

    expect(docNull.sections.some((s) => s.title === 'Marcações das sessões')).toBe(false);
    expect(docNull.sections.some((s) => s.title.includes('Feedback'))).toBe(true);

    const docFalse = buildProblemReportDocument({
      room,
      problem,
      grades,
      feedbacks,
      marcacoes,
      format: ReportFileFormat.PDF,
      mostrarMarcacoes: false,
    });

    expect(docFalse.sections.some((s) => s.title === 'Marcações das sessões')).toBe(false);
  });

  it('omits both feedbacks and marcacoes when both flags are false', () => {
    const doc = buildProblemReportDocument({
      room,
      problem,
      grades,
      feedbacks,
      marcacoes,
      format: ReportFileFormat.PDF,
      mostrarFeedback: false,
      mostrarMarcacoes: false,
    });

    expect(doc.sections.map((s) => s.title)).toEqual([
      'Notas por sessão',
      'Pendências de avaliação',
      'Informações do relatório',
    ]);
  });
});
