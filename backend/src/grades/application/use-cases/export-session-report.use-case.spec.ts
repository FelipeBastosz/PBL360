import { EvaluationStatus } from '@/evaluations/domain/enums/evaluation-status.enum';
import {
  ReportColumnType,
  ReportFileFormat,
  type ReportDocument,
  type ReportFile,
} from '@/report-files/domain/report-document';
import type { ReportFileGenerator } from '@/report-files/domain/services/report-file-generator';
import { ReportGenerationError } from '@/report-files/application/errors/report-generation.error';
import { ForbiddenError, NotFoundError } from '@/shared/errors/application.error';
import type { SessionAccessService } from '@/sessions/application/services/session-access.service';
import type {
  SessionReportData,
  SessionReportStudentData,
} from '@/sessions/domain/repositories/session-report.repository';
import type { GradesResponseDto } from '../dtos/grades-response.dto';
import type { ProblemGradesWithSessionGrades } from './helpers/get-problem-grades.helper';
import type { GetProblemGradesUseCase } from './get-problem-grades.use-case';
import { ExportSessionReportUseCase } from './export-session-report.use-case';

type SessionGrade = GradesResponseDto['alunos'][number]['sessoes'][number];

const notEvaluated = { nota: null, situacao: 'NAO_LIBERADA' };

const sessionGrade = (overrides: Partial<SessionGrade>): SessionGrade => ({
  sessaoId: 'sess-1',
  nota: null,
  situacao: 'PENDENTE',
  modalidade: 'TUTOR',
  autoavaliacao: notEvaluated,
  pares: { ...notEvaluated, origem: 'FORMULARIO' },
  ...overrides,
});

const gradesFor = (
  sessions: Record<string, SessionGrade>,
  exactGrades: Record<string, number> = {},
): ProblemGradesWithSessionGrades => ({
  response: {
    sessoes: [],
    alunos: Object.entries(sessions).map(([alunoId, session]) => ({
      alunoId,
      nome: alunoId,
      matricula: null,
      sessoes: [sessionGrade({ sessaoId: 'other-session', nota: 1 }), session],
      notaFinal: null,
      autoavaliacao: notEvaluated,
      pares: notEvaluated,
    })),
    mediaTurma: null,
    versoesFormula: { sessao: null, problema: null },
  },
  sessionGrades: Object.entries(sessions).flatMap(([alunoId, session]) => [
    { session_id: 'other-session', student_id: alunoId, grade: 1 },
    {
      session_id: session.sessaoId,
      student_id: alunoId,
      grade: exactGrades[alunoId] ?? session.nota,
    },
  ]),
});

const student = (overrides: Partial<SessionReportStudentData>): SessionReportStudentData => ({
  studentId: 'stud-1',
  name: 'Ana Souza',
  matricula: '2026001',
  attendanceStatus: 'PRESENT',
  role: null,
  roleScore: null,
  tags: [],
  evaluationStatus: null,
  appliedBonus: null,
  feedback: null,
  ...overrides,
});

const baseSessionReportData: SessionReportData = {
  room: {
    id: 'room-1',
    name: 'Turma A — Medicina 2026.2',
    courseCode: 'MED01',
    semester: '2026.2',
  },
  problem: { id: 'prob-1', title: 'Dor torácica aguda', orderIndex: 1 },
  session: { id: 'sess-1', title: 'Abertura', orderIndex: 1, date: '2026-10-14T10:00:00.000Z' },
  students: [
    student({
      role: 'COORDINATOR',
      roleScore: 9.0,
      tags: ['Participativa', 'Pontual'],
      evaluationStatus: EvaluationStatus.SUBMITTED,
      appliedBonus: 9.0,
      feedback: { text: 'Ótima condução da discussão.', authorName: 'Prof. Carlos' },
    }),
    student({
      studentId: 'stud-2',
      name: 'Bruno Lima',
      matricula: '2026002',
      attendanceStatus: 'LATE',
      role: 'TABLE_SECRETARY',
      roleScore: 8.0,
      tags: ['Atraso leve'],
      evaluationStatus: EvaluationStatus.DRAFT,
    }),
    student({
      studentId: 'stud-3',
      name: 'Carlos Dias',
      matricula: null,
      attendanceStatus: null,
    }),
  ],
  generalFeedback: {
    text: 'Sessão muito produtiva com participação ativa de todos.',
    authorName: 'Prof. Carlos',
  },
};

const baseGrades = gradesFor(
  {
    'stud-1': sessionGrade({ nota: 8.7, situacao: 'AVALIADA' }),
    'stud-2': sessionGrade({}),
    'stud-3': sessionGrade({}),
  },
  { 'stud-1': 8.7166 },
);

const sampleReportFile: ReportFile = {
  content: Buffer.from('%PDF-1.7...'),
  fileName: 'relatorio-sessao-1.pdf',
  contentType: 'application/pdf',
};

describe('ExportSessionReportUseCase', () => {
  let useCase: ExportSessionReportUseCase;
  let sessionAccess: jest.Mocked<SessionAccessService>;
  let reportRepository: { getSessionReportData: jest.Mock };
  let reportGenerator: jest.Mocked<ReportFileGenerator>;
  let getProblemGrades: { executeWithSessionGrades: jest.Mock };

  const exportReport = (overrides: Partial<Parameters<typeof useCase.execute>[0]> = {}) =>
    useCase.execute({
      sessionId: 'sess-1',
      format: ReportFileFormat.PDF,
      tutorId: 'tutor-1',
      ...overrides,
    });

  const generatedDocument = (): ReportDocument => reportGenerator.generate.mock.calls[0]![0];

  const tableRows = () => {
    const section = generatedDocument().sections[0]!;
    if (section.kind !== 'table') throw new Error('Expected the session table section.');
    return section.rows;
  };

  const exportWith = async (
    studentData: SessionReportStudentData,
    grade: SessionGrade,
    exactGrade?: number,
  ) => {
    reportRepository.getSessionReportData.mockResolvedValue({
      ...baseSessionReportData,
      students: [studentData],
    });
    getProblemGrades.executeWithSessionGrades.mockResolvedValue(
      gradesFor(
        { [studentData.studentId]: grade },
        exactGrade === undefined ? {} : { [studentData.studentId]: exactGrade },
      ),
    );
    await exportReport();
    return tableRows()[0]!;
  };

  beforeEach(() => {
    sessionAccess = {
      assertTutorCanAccessSessionById: jest.fn().mockResolvedValue({
        session: { id: 'sess-1', problemId: 'prob-1' },
        roomId: 'room-1',
      }),
    } as unknown as jest.Mocked<SessionAccessService>;
    reportRepository = { getSessionReportData: jest.fn().mockResolvedValue(baseSessionReportData) };
    reportGenerator = { generate: jest.fn().mockResolvedValue(sampleReportFile) };
    getProblemGrades = { executeWithSessionGrades: jest.fn().mockResolvedValue(baseGrades) };

    useCase = new ExportSessionReportUseCase(
      sessionAccess,
      reportRepository,
      reportGenerator,
      getProblemGrades as unknown as GetProblemGradesUseCase,
    );
  });

  it('exports session report with complete data, correct identification, and sections', async () => {
    const result = await exportReport();

    expect(sessionAccess.assertTutorCanAccessSessionById).toHaveBeenCalledWith('sess-1', 'tutor-1');
    expect(reportRepository.getSessionReportData).toHaveBeenCalledWith('sess-1', 'room-1');
    expect(getProblemGrades.executeWithSessionGrades).toHaveBeenCalledWith({
      roomId: 'room-1',
      problemId: 'prob-1',
      tutorId: 'tutor-1',
    });

    const document = generatedDocument();
    expect(document.format).toBe(ReportFileFormat.PDF);
    expect(document.title).toBe('Relatório da sessão — Abertura');
    expect(document.fileName).toBe('relatorio-sessao-p1-s1');
    expect(document.identification).toEqual([
      { label: 'Turma', value: 'Turma A — Medicina 2026.2' },
      { label: 'Problema', value: 'Problema 1 — Dor torácica aguda' },
      { label: 'Sessão', value: 'Sessão 1 — Abertura' },
      { label: 'Data', value: '14/10/2026' },
    ]);

    expect(document.sections).toHaveLength(2);
    const tableSection = document.sections[0]!;
    expect(tableSection.kind).toBe('table');
    expect(tableSection.title).toBe('Dados da sessão');
    if (tableSection.kind === 'table') {
      expect(tableSection.columns).toEqual([
        { header: 'Aluno', type: ReportColumnType.TEXT },
        { header: 'Matrícula', type: ReportColumnType.TEXT },
        { header: 'Chamada', type: ReportColumnType.TEXT },
        { header: 'Papel', type: ReportColumnType.TEXT },
        { header: 'Nota adicional de papel', type: ReportColumnType.NUMBER, decimals: 2 },
        { header: 'Marcações', type: ReportColumnType.TEXT },
        { header: 'Situação da nota', type: ReportColumnType.TEXT },
        { header: 'Nota', type: ReportColumnType.NUMBER, decimals: 2 },
      ]);
      expect(tableSection.rows).toEqual([
        [
          'Ana Souza',
          '2026001',
          'Presente',
          'Coordenador',
          9.0,
          'Participativa, Pontual',
          'Nota enviada',
          8.72,
        ],
        [
          'Bruno Lima',
          '2026002',
          'Atrasado',
          'Secretário da mesa',
          8.0,
          'Atraso leve',
          'Rascunho',
          null,
        ],
        ['Carlos Dias', null, 'Não registrada', null, null, null, 'Não registrada', null],
      ]);
    }

    const textSection = document.sections[1]!;
    expect(textSection.kind).toBe('text');
    expect(textSection.title).toBe('Feedbacks da sessão');
    if (textSection.kind === 'text') {
      expect(textSection.entries).toEqual([
        {
          label: 'Geral (Autor: Prof. Carlos)',
          text: 'Sessão muito produtiva com participação ativa de todos.',
        },
        { label: 'Ana Souza (Autor: Prof. Carlos)', text: 'Ótima condução da discussão.' },
        { label: 'Bruno Lima', text: null },
        { label: 'Carlos Dias', text: null },
      ]);
    }

    expect(result).toBe(sampleReportFile);
  });

  it('uses the planning poker decision as the session grade with one decimal place', async () => {
    const row = await exportWith(
      student({}),
      sessionGrade({
        nota: 8.8,
        situacao: 'AVALIADA',
        modalidade: 'PARES',
        pares: { nota: 8.8, situacao: 'AVALIADA', origem: 'PLANNING_POKER' },
      }),
      8.75,
    );

    expect(row.slice(6)).toEqual(['Nota enviada', 8.8]);
  });

  it('uses the peer form grade as the session grade', async () => {
    const row = await exportWith(
      student({}),
      sessionGrade({
        nota: 7.3,
        situacao: 'AVALIADA',
        modalidade: 'PARES',
        pares: { nota: 7.3, situacao: 'AVALIADA', origem: 'FORMULARIO' },
      }),
      7.25,
    );

    expect(row.slice(6)).toEqual(['Nota enviada', 7.25]);
  });

  it('uses the self-assessment grade as the session grade', async () => {
    const row = await exportWith(
      student({}),
      sessionGrade({ nota: 9.1, situacao: 'AVALIADA', modalidade: 'AUTOAVALIACAO' }),
      9.125,
    );

    expect(row.slice(6)).toEqual(['Nota enviada', 9.13]);
  });

  it.each([
    ['AUSENTE', 0, 'Ausente'],
    ['JUSTIFICADA', null, 'Falta justificada'],
  ])('labels a %s student with the grade from the grades module', async (situacao, nota, label) => {
    const row = await exportWith(
      student({ attendanceStatus: situacao === 'AUSENTE' ? 'ABSENT' : 'EXCUSED' }),
      sessionGrade({ nota, situacao, modalidade: 'PARES' }),
    );

    expect(row.slice(6)).toEqual([label, nota]);
  });

  it('keeps a peer modality pending even when a stale tutor draft exists', async () => {
    const row = await exportWith(
      student({ evaluationStatus: EvaluationStatus.DRAFT }),
      sessionGrade({ modalidade: 'PARES' }),
    );

    expect(row.slice(6)).toEqual(['Não registrada', null]);
  });

  it('marks a student missing from the grades response as not recorded', async () => {
    reportRepository.getSessionReportData.mockResolvedValue({
      ...baseSessionReportData,
      students: [student({ studentId: 'stud-unknown' })],
    });

    await exportReport();

    expect(tableRows()[0]!.slice(6)).toEqual(['Não registrada', null]);
  });

  it('hides student names and omits the feedback section when requested', async () => {
    await exportReport({
      format: ReportFileFormat.XLSX,
      ocultarNome: true,
      mostrarFeedBack: false,
    });

    const rows = tableRows();
    expect(rows[0]![0]).toBeNull();
    expect(rows[0]![1]).toBe('2026001');
    expect(rows[0]![7]).toBe(8.72);
    expect(generatedDocument().sections).toHaveLength(1);
  });

  it('uses the student registration instead of their name in visible feedback labels', async () => {
    await exportReport({ ocultarNome: true });

    const feedbackSection = generatedDocument().sections[1]!;
    expect(feedbackSection.kind).toBe('text');
    if (feedbackSection.kind === 'text') {
      expect(feedbackSection.entries[1]?.label).toBe('2026001 (Autor: Prof. Carlos)');
      expect(feedbackSection.entries.map((entry) => entry.label)).not.toContain('Ana Souza');
    }
  });

  it('shows the frozen applied bonus for submitted evaluations and the role score otherwise', async () => {
    reportRepository.getSessionReportData.mockResolvedValue({
      ...baseSessionReportData,
      students: [
        student({
          role: 'COORDINATOR',
          roleScore: 10.0,
          evaluationStatus: EvaluationStatus.SUBMITTED,
          appliedBonus: 5.0,
        }),
        student({
          studentId: 'stud-2',
          role: 'BOARD_SECRETARY',
          roleScore: 10.0,
          evaluationStatus: EvaluationStatus.SUBMITTED,
          appliedBonus: null,
        }),
        student({ studentId: 'stud-3', role: 'COORDINATOR', roleScore: 7.5 }),
      ],
    });

    await exportReport();

    expect(tableRows().map((row) => row[4])).toEqual([5.0, null, 7.5]);
  });

  it('handles missing data gracefully without errors', async () => {
    reportRepository.getSessionReportData.mockResolvedValue({
      room: { id: 'room-1', name: 'Turma Vazia', courseCode: '', semester: '' },
      problem: { id: 'prob-1', title: 'Problema Sem Ordem', orderIndex: null },
      session: { id: 'sess-1', title: 'Sessão Sem Ordem', orderIndex: null, date: '' },
      students: [],
      generalFeedback: null,
    });
    getProblemGrades.executeWithSessionGrades.mockResolvedValue(gradesFor({}));

    await exportReport();

    const document = generatedDocument();
    expect(document.fileName).toBe('relatorio-sessao-Sessão Sem Ordem');
    expect(document.identification[3]!.value).toBe('—');
    expect(tableRows()).toHaveLength(0);
    if (document.sections[1]!.kind === 'text') {
      expect(document.sections[1]!.entries).toHaveLength(0);
    }
  });

  it('rejects with ForbiddenError when tutor has no access to room', async () => {
    sessionAccess.assertTutorCanAccessSessionById.mockRejectedValue(
      new ForbiddenError('Você não tem permissão para acessar ou modificar esta sala.'),
    );

    await expect(exportReport({ tutorId: 'unauthorized-tutor' })).rejects.toBeInstanceOf(
      ForbiddenError,
    );

    expect(reportRepository.getSessionReportData).not.toHaveBeenCalled();
    expect(getProblemGrades.executeWithSessionGrades).not.toHaveBeenCalled();
    expect(reportGenerator.generate).not.toHaveBeenCalled();
  });

  it('rejects with NotFoundError when session does not exist', async () => {
    sessionAccess.assertTutorCanAccessSessionById.mockRejectedValue(
      new NotFoundError('Sessão não encontrada.'),
    );

    await expect(exportReport({ sessionId: 'nonexistent-session' })).rejects.toBeInstanceOf(
      NotFoundError,
    );

    expect(reportRepository.getSessionReportData).not.toHaveBeenCalled();
    expect(reportGenerator.generate).not.toHaveBeenCalled();
  });

  it('propagates ReportGenerationError when file generation fails', async () => {
    reportGenerator.generate.mockRejectedValue(new ReportGenerationError());

    await expect(exportReport()).rejects.toBeInstanceOf(ReportGenerationError);
  });
});
