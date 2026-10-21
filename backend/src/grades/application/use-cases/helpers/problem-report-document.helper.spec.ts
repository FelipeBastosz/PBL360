import { ReportColumnType, ReportFileFormat } from '@/report-files/domain/report-document';
import { FeedbackScope } from '@/feedbacks/domain/enums/feedback-scope.enum';
import type { ProblemFeedbackDetail } from '@/feedbacks/domain/repositories/feedback.repository';
import type { Room } from '@/rooms/domain/entities/room.entity';
import type { Problem } from '@/problems/domain/entities/problem.entity';
import type { GradesResponseDto } from '../../dtos/grades-response.dto';
import { buildProblemReportDocument } from './problem-report-document.helper';

describe('problem-report-document.helper', () => {
  const room = {
    id: 'room-1',
    name: 'Turma A — Medicina',
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
            autoavaliacao: { nota: 8.5, situacao: 'AVALIADA' },
            pares: { nota: 8.5, situacao: 'AVALIADA' },
          },
          {
            sessaoId: 'sess-2',
            nota: 9.0,
            situacao: 'AVALIADA',
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
            autoavaliacao: { nota: 7.0, situacao: 'AVALIADA' },
            pares: { nota: 7.0, situacao: 'AVALIADA' },
          },
          {
            sessaoId: 'sess-2',
            nota: null,
            situacao: 'PENDENTE',
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
    expect(doc.fileName).toBe('relatorio-problema-1');
    expect(doc.identification).toEqual([
      { label: 'Sala', value: 'Turma A — Medicina' },
      { label: 'Problema', value: 'Problema 1 — Dor torácica' },
    ]);

    expect(doc.sections).toHaveLength(5);

    const table = doc.sections[0];
    expect(table.kind).toBe('table');
    if (table.kind === 'table') {
      expect(table.title).toBe('Notas por sessão');
      expect(table.columns).toEqual([
        { header: 'Aluno', type: ReportColumnType.TEXT },
        { header: 'Matrícula', type: ReportColumnType.TEXT },
        { header: 'Abertura', type: ReportColumnType.NUMBER },
        { header: 'Fechamento', type: ReportColumnType.NUMBER },
        { header: 'Nota final', type: ReportColumnType.NUMBER },
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
  });

  it('handles missing orderIndex by using problem title in fileName', () => {
    const doc = buildProblemReportDocument({
      room,
      problem: { ...problem, orderIndex: null },
      grades,
      feedbacks: [],
      format: ReportFileFormat.XLSX,
    });

    expect(doc.fileName).toBe('relatorio-problema-Problema 1 — Dor torácica');
  });

  it('omits optional session and student feedback sections when empty', () => {
    const doc = buildProblemReportDocument({
      room,
      problem,
      grades,
      feedbacks: [],
      format: ReportFileFormat.PDF,
    });

    expect(doc.sections).toHaveLength(3);
    expect(doc.sections[0].title).toBe('Notas por sessão');
    expect(doc.sections[1].title).toBe('Pendências de avaliação');
    expect(doc.sections[2]).toEqual({
      kind: 'text',
      title: 'Feedback geral do problema',
      entries: [{ label: 'Turma', text: null }],
    });
  });
});
