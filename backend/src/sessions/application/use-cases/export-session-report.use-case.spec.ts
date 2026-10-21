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
import type { SessionAccessService } from '../services/session-access.service';
import type {
  SessionReportData,
  SessionReportRepository,
} from '../../domain/repositories/session-report.repository';
import { ExportSessionReportUseCase } from './export-session-report.use-case';

describe('ExportSessionReportUseCase', () => {
  let useCase: ExportSessionReportUseCase;
  let sessionAccess: jest.Mocked<SessionAccessService>;
  let reportRepository: jest.Mocked<SessionReportRepository>;
  let reportGenerator: jest.Mocked<ReportFileGenerator>;

  const baseSessionReportData: SessionReportData = {
    room: {
      id: 'room-1',
      name: 'Turma A — Medicina 2026.2',
      courseCode: 'MED01',
      semester: '2026.2',
    },
    problem: {
      id: 'prob-1',
      title: 'Dor torácica aguda',
      orderIndex: 1,
    },
    session: {
      id: 'sess-1',
      title: 'Abertura',
      orderIndex: 1,
      date: '2026-10-14T10:00:00.000Z',
    },
    criteria: [
      { id: 'crit-1', name: 'Participação', weight: 4 },
      { id: 'crit-2', name: 'Fundamentação', weight: 6 },
    ],
    formula: {
      criteriaWeight: 70,
      roleWeight: 30,
    },
    students: [
      {
        studentId: 'stud-1',
        name: 'Ana Souza',
        matricula: '2026001',
        attendanceStatus: 'PRESENT',
        role: 'COORDINATOR',
        roleScore: 9.0,
        tags: ['Participativa', 'Pontual'],
        evaluationStatus: EvaluationStatus.SUBMITTED,
        appliedBonus: 9.0,
        items: [
          { criterionId: 'crit-1', score: 8.0 },
          { criterionId: 'crit-2', score: 9.0 },
        ],
        recordedSessionScore: 8.7,
        feedback: { text: 'Ótima condução da discussão.', authorName: 'Prof. Carlos' },
      },
      {
        studentId: 'stud-2',
        name: 'Bruno Lima',
        matricula: '2026002',
        attendanceStatus: 'LATE',
        role: 'TABLE_SECRETARY',
        roleScore: 8.0,
        tags: ['Atraso leve'],
        evaluationStatus: EvaluationStatus.DRAFT,
        appliedBonus: null,
        items: [
          { criterionId: 'crit-1', score: 7.0 },
          { criterionId: 'crit-2', score: 7.5 },
        ],
        recordedSessionScore: null,
        feedback: null,
      },
      {
        studentId: 'stud-3',
        name: 'Carlos Dias',
        matricula: null,
        attendanceStatus: null,
        role: null,
        roleScore: null,
        tags: [],
        evaluationStatus: null,
        appliedBonus: null,
        items: [],
        recordedSessionScore: null,
        feedback: null,
      },
    ],
    generalFeedback: {
      text: 'Sessão muito produtiva com participação ativa de todos.',
      authorName: 'Prof. Carlos',
    },
  };

  const sampleReportFile: ReportFile = {
    content: Buffer.from('%PDF-1.7...'),
    fileName: 'relatorio-sessao-1.pdf',
    contentType: 'application/pdf',
  };

  beforeEach(() => {
    sessionAccess = {
      assertTutorCanAccessSessionById: jest.fn().mockResolvedValue({
        session: { id: 'sess-1', problemId: 'prob-1' },
        roomId: 'room-1',
      }),
    } as unknown as jest.Mocked<SessionAccessService>;

    reportRepository = {
      getSessionReportData: jest.fn().mockResolvedValue(baseSessionReportData),
    };

    reportGenerator = {
      generate: jest.fn().mockResolvedValue(sampleReportFile),
    };

    useCase = new ExportSessionReportUseCase(sessionAccess, reportRepository, reportGenerator);
  });

  it('exports session report with complete data, correct identification, and sections', async () => {
    const result = await useCase.execute({
      sessionId: 'sess-1',
      format: ReportFileFormat.PDF,
      tutorId: 'tutor-1',
    });

    expect(sessionAccess.assertTutorCanAccessSessionById).toHaveBeenCalledWith('sess-1', 'tutor-1');
    expect(reportRepository.getSessionReportData).toHaveBeenCalledWith('sess-1', 'room-1');
    expect(reportGenerator.generate).toHaveBeenCalled();

    const document: ReportDocument = reportGenerator.generate.mock.calls[0]![0];

    expect(document.format).toBe(ReportFileFormat.PDF);
    expect(document.title).toBe('Relatório da sessão — Abertura');
    expect(document.fileName).toBe('relatorio-sessao-1');
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

      // Ana Souza: Complete, submitted evaluation
      expect(tableSection.rows[0]).toEqual([
        'Ana Souza',
        '2026001',
        'Presente',
        'Coordenador',
        9.0,
        'Participativa, Pontual',
        'Nota enviada',
        8.72, // (8*0.4 + 9*0.6)*0.7 + 9*0.3 = 8.6*0.7 + 2.7 = 6.02 + 2.7 = 8.72
      ]);

      // Bruno Lima: Draft evaluation (score must be null)
      expect(tableSection.rows[1]).toEqual([
        'Bruno Lima',
        '2026002',
        'Atrasado',
        'Secretário da mesa',
        8.0,
        'Atraso leve',
        'Rascunho',
        null,
      ]);

      // Carlos Dias: Unrecorded (all missing data)
      expect(tableSection.rows[2]).toEqual([
        'Carlos Dias',
        null,
        'Não registrada',
        null,
        null,
        null,
        'Não registrada',
        null,
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
        {
          label: 'Ana Souza (Autor: Prof. Carlos)',
          text: 'Ótima condução da discussão.',
        },
        {
          label: 'Bruno Lima',
          text: null,
        },
        {
          label: 'Carlos Dias',
          text: null,
        },
      ]);
    }

    expect(result).toBe(sampleReportFile);
  });

  it('differentiates submitted grade, draft, and unrecorded grade', async () => {
    await useCase.execute({
      sessionId: 'sess-1',
      format: ReportFileFormat.XLSX,
      tutorId: 'tutor-1',
    });

    const document: ReportDocument = reportGenerator.generate.mock.calls[0]![0];
    const tableSection = document.sections[0]!;
    expect(tableSection.kind).toBe('table');

    if (tableSection.kind === 'table') {
      const rows = tableSection.rows;
      // Index 6 is 'Situação da nota', Index 7 is 'Nota'
      expect(rows[0]![6]).toBe('Nota enviada');
      expect(typeof rows[0]![7]).toBe('number');

      expect(rows[1]![6]).toBe('Rascunho');
      expect(rows[1]![7]).toBeNull();

      expect(rows[2]![6]).toBe('Não registrada');
      expect(rows[2]![7]).toBeNull();
    }
  });

  it('reflects grade adjustment in calculated score', async () => {
    // Student with an adjusted criterion score from 5.0 to 9.0
    const adjustedData: SessionReportData = {
      ...baseSessionReportData,
      students: [
        {
          studentId: 'stud-1',
          name: 'Ana Souza',
          matricula: '2026001',
          attendanceStatus: 'PRESENT',
          role: null,
          roleScore: null,
          tags: [],
          evaluationStatus: EvaluationStatus.SUBMITTED,
          appliedBonus: null,
          items: [
            { criterionId: 'crit-1', score: 9.0 }, // adjusted from 5.0
            { criterionId: 'crit-2', score: 9.0 },
          ],
          recordedSessionScore: 7.4, // old pre-adjustment score
          feedback: null,
        },
      ],
    };

    reportRepository.getSessionReportData.mockResolvedValue(adjustedData);

    await useCase.execute({
      sessionId: 'sess-1',
      format: ReportFileFormat.PDF,
      tutorId: 'tutor-1',
    });

    const document: ReportDocument = reportGenerator.generate.mock.calls[0]![0];
    const tableSection = document.sections[0]!;
    if (tableSection.kind === 'table') {
      // Recalculated grade with items reflecting the adjustment: (9*4 + 9*6)/10 = 9.0
      expect(tableSection.rows[0]![7]).toBe(9.0);
    }
  });

  it('handles missing data gracefully without errors', async () => {
    const emptyData: SessionReportData = {
      room: {
        id: 'room-1',
        name: 'Turma Vazia',
        courseCode: '',
        semester: '',
      },
      problem: {
        id: 'prob-1',
        title: 'Problema Sem Ordem',
        orderIndex: null,
      },
      session: {
        id: 'sess-1',
        title: 'Sessão Sem Ordem',
        orderIndex: null,
        date: '',
      },
      criteria: [],
      formula: { criteriaWeight: 70, roleWeight: 30 },
      students: [],
      generalFeedback: null,
    };

    reportRepository.getSessionReportData.mockResolvedValue(emptyData);

    await useCase.execute({
      sessionId: 'sess-1',
      format: ReportFileFormat.PDF,
      tutorId: 'tutor-1',
    });

    const document: ReportDocument = reportGenerator.generate.mock.calls[0]![0];
    expect(document.fileName).toBe('relatorio-sessao-Sessão Sem Ordem');
    expect(document.identification[3]!.value).toBe('—');
    if (document.sections[0]!.kind === 'table') {
      expect(document.sections[0]!.rows).toHaveLength(0);
    }
    if (document.sections[1]!.kind === 'text') {
      expect(document.sections[1]!.entries).toHaveLength(0);
    }
  });

  it('rejects with ForbiddenError when tutor has no access to room', async () => {
    sessionAccess.assertTutorCanAccessSessionById.mockRejectedValue(
      new ForbiddenError('Você não tem permissão para acessar ou modificar esta sala.'),
    );

    await expect(
      useCase.execute({
        sessionId: 'sess-1',
        format: ReportFileFormat.PDF,
        tutorId: 'unauthorized-tutor',
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);

    expect(reportRepository.getSessionReportData).not.toHaveBeenCalled();
    expect(reportGenerator.generate).not.toHaveBeenCalled();
  });

  it('rejects with NotFoundError when session does not exist', async () => {
    sessionAccess.assertTutorCanAccessSessionById.mockRejectedValue(
      new NotFoundError('Sessão não encontrada.'),
    );

    await expect(
      useCase.execute({
        sessionId: 'nonexistent-session',
        format: ReportFileFormat.PDF,
        tutorId: 'tutor-1',
      }),
    ).rejects.toBeInstanceOf(NotFoundError);

    expect(reportRepository.getSessionReportData).not.toHaveBeenCalled();
    expect(reportGenerator.generate).not.toHaveBeenCalled();
  });

  it('propagates ReportGenerationError when file generation fails', async () => {
    reportGenerator.generate.mockRejectedValue(new ReportGenerationError());

    await expect(
      useCase.execute({
        sessionId: 'sess-1',
        format: ReportFileFormat.PDF,
        tutorId: 'tutor-1',
      }),
    ).rejects.toBeInstanceOf(ReportGenerationError);
  });
});
