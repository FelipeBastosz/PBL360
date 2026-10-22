import { Workbook } from 'exceljs';
import { EvaluationStatus } from '@/evaluations/domain/enums/evaluation-status.enum';
import { ReportFileFormat } from '@/report-files/domain/report-document';
import { ReportFileService } from '@/report-files/application/services/report-file.service';
import { PdfmakeReportRenderer } from '@/report-files/infrastructure/pdf/pdfmake-report-renderer';
import { ExceljsReportRenderer } from '@/report-files/infrastructure/xlsx/exceljs-report-renderer';
import type { SessionAccessService } from '../services/session-access.service';
import type {
  SessionReportData,
  SessionReportRepository,
} from '../../domain/repositories/session-report.repository';
import { ExportSessionReportUseCase } from './export-session-report.use-case';

describe('ExportSessionReportUseCase - File Acceptance & Content Comparison', () => {
  let useCase: ExportSessionReportUseCase;
  let sessionAccess: jest.Mocked<SessionAccessService>;
  let reportRepository: jest.Mocked<SessionReportRepository>;

  const fullSessionData: SessionReportData = {
    room: {
      id: 'room-101',
      name: 'Turma A — Medicina 2026.2',
      courseCode: 'MED101',
      semester: '2026.2',
    },
    problem: {
      id: 'prob-201',
      title: 'Dor torácica aguda e dispneia',
      orderIndex: 2,
    },
    session: {
      id: 'sess-301',
      title: 'Discussão clínica e fechamento',
      orderIndex: 3,
      date: '2026-10-20',
    },
    criteria: [
      { id: 'crit-1', name: 'Raciocínio clínico', weight: 5 },
      { id: 'crit-2', name: 'Comunicação', weight: 5 },
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
        roleScore: 9.5,
        tags: ['Participativo', 'Liderança'],
        evaluationStatus: EvaluationStatus.SUBMITTED,
        appliedBonus: 9.5,
        items: [
          { criterionId: 'crit-1', score: 9.0 },
          { criterionId: 'crit-2', score: 8.5 },
        ],
        recordedSessionScore: 8.98,
        feedback: {
          text: 'Excelente condução do grupo e clareza na formulação das hipóteses.',
          authorName: 'Prof. Carlos',
        },
      },
      {
        studentId: 'stud-2',
        name: 'Bruno Lima',
        matricula: '2026002',
        attendanceStatus: 'LATE',
        role: 'BOARD_SECRETARY',
        roleScore: 8.0,
        tags: ['Atraso justificado'],
        evaluationStatus: EvaluationStatus.DRAFT,
        appliedBonus: null,
        items: [
          { criterionId: 'crit-1', score: 7.0 },
          { criterionId: 'crit-2', score: 7.5 },
        ],
        recordedSessionScore: null,
        feedback: {
          text: 'Boa síntese no quadro, atentar para pontualidade.',
          authorName: 'Prof. Carlos',
        },
      },
      {
        studentId: 'stud-3',
        name: 'Carlos Dias',
        matricula: '2026003',
        attendanceStatus: 'EXCUSED',
        role: 'TABLE_SECRETARY',
        roleScore: null,
        tags: [],
        evaluationStatus: null,
        appliedBonus: null,
        items: [],
        recordedSessionScore: null,
        feedback: null,
      },
      {
        studentId: 'stud-4',
        name: 'Daniela Castro',
        matricula: null,
        attendanceStatus: 'ABSENT',
        role: null,
        roleScore: null,
        tags: ['Falta'],
        evaluationStatus: EvaluationStatus.SUBMITTED,
        appliedBonus: null,
        items: [
          { criterionId: 'crit-1', score: 8.0 }, // Note: criterion score adjusted to 8.0
          { criterionId: 'crit-2', score: 8.0 },
        ],
        recordedSessionScore: 6.0, // old score before adjustment
        feedback: null,
      },
      {
        studentId: 'stud-5',
        name: 'Eduardo Ramos',
        matricula: null,
        attendanceStatus: null, // missing attendance
        role: null,
        roleScore: null,
        tags: [],
        evaluationStatus: null, // missing evaluation
        appliedBonus: null,
        items: [],
        recordedSessionScore: null,
        feedback: null, // missing feedback
      },
    ],
    generalFeedback: {
      text: 'O grupo demonstrou excelente maturidade na formulação dos diagnósticos diferenciais.',
      authorName: 'Prof. Carlos',
    },
  };

  beforeEach(() => {
    sessionAccess = {
      assertTutorCanAccessSessionById: jest.fn().mockResolvedValue({
        session: { id: 'sess-301', problemId: 'prob-201' },
        roomId: 'room-101',
      }),
    } as unknown as jest.Mocked<SessionAccessService>;

    reportRepository = {
      getSessionReportData: jest.fn().mockResolvedValue(fullSessionData),
    };

    const pdfRenderer = new PdfmakeReportRenderer();
    const xlsxRenderer = new ExceljsReportRenderer();
    const reportGenerator = new ReportFileService(pdfRenderer, xlsxRenderer);

    useCase = new ExportSessionReportUseCase(sessionAccess, reportRepository, reportGenerator);
  });

  it('generates valid PDF and Excel files and verifies their contents match', async () => {
    // 1. Generate PDF
    const pdfReport = await useCase.execute({
      sessionId: 'sess-301',
      format: ReportFileFormat.PDF,
      tutorId: 'tutor-1',
    });

    expect(pdfReport.contentType).toBe('application/pdf');
    expect(pdfReport.fileName).toBe('relatorio-sessao-p2-s3.pdf');
    expect(pdfReport.content.subarray(0, 5).toString('utf8')).toBe('%PDF-');
    expect(pdfReport.content.length).toBeGreaterThan(1000);

    // 2. Generate Excel
    const xlsxReport = await useCase.execute({
      sessionId: 'sess-301',
      format: ReportFileFormat.XLSX,
      tutorId: 'tutor-1',
    });

    expect(xlsxReport.contentType).toBe(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    expect(xlsxReport.fileName).toBe('relatorio-sessao-p2-s3.xlsx');
    expect(xlsxReport.content.subarray(0, 2).toString('utf8')).toBe('PK');
    expect(xlsxReport.content.length).toBeGreaterThan(1000);

    // 3. Open Excel file and inspect worksheets & cells
    const workbook = new Workbook();
    await workbook.xlsx.load(
      xlsxReport.content as unknown as Parameters<typeof workbook.xlsx.load>[0],
    );

    expect(workbook.worksheets.map((ws) => ws.name)).toEqual([
      'Dados da sessão',
      'Feedbacks da sessão',
    ]);

    // Inspect Sheet 1: Dados da sessão
    const sheet1 = workbook.getWorksheet('Dados da sessão')!;
    expect(sheet1).toBeDefined();

    // Verify preamble identification
    expect(sheet1.getCell('A1').value).toContain(
      'Relatório da sessão — Discussão clínica e fechamento',
    );
    expect(sheet1.getCell('A2').value).toBe('Dados da sessão');
    expect(sheet1.getCell('A3').value).toBe('Turma');
    expect(sheet1.getCell('B3').value).toBe('Turma A — Medicina 2026.2');

    // Row 8 contains table headers
    const headerRow = sheet1.getRow(8);
    const headers = [1, 2, 3, 4, 5, 6, 7, 8].map((col) => headerRow.getCell(col).value);
    expect(headers).toEqual([
      'Aluno',
      'Matrícula',
      'Chamada',
      'Papel',
      'Nota adicional de papel',
      'Marcações',
      'Situação da nota',
      'Nota',
    ]);

    // Verify Row 9 (Ana Souza - Complete with submitted grade)
    const anaRow = sheet1.getRow(9);
    expect(anaRow.getCell(1).value).toBe('Ana Souza');
    expect(anaRow.getCell(2).value).toBe('2026001');
    expect(anaRow.getCell(3).value).toBe('Presente');
    expect(anaRow.getCell(4).value).toBe('Coordenador');
    // Numeric cell for role score
    expect(typeof anaRow.getCell(5).value).toBe('number');
    expect(anaRow.getCell(5).value).toBe(9.5);
    expect(anaRow.getCell(6).value).toBe('Participativo, Liderança');
    expect(anaRow.getCell(7).value).toBe('Nota enviada');
    // Numeric cell for final grade: criteria avg = 8.75, role = 9.5 => (8.75*0.7) + (9.5*0.3) = 6.125 + 2.85 = 8.98
    expect(typeof anaRow.getCell(8).value).toBe('number');
    expect(anaRow.getCell(8).value).toBe(8.98);

    // Verify Row 10 (Bruno Lima - Draft evaluation)
    const brunoRow = sheet1.getRow(10);
    expect(brunoRow.getCell(1).value).toBe('Bruno Lima');
    expect(brunoRow.getCell(3).value).toBe('Atrasado');
    expect(brunoRow.getCell(4).value).toBe('Secretário do quadro');
    expect(brunoRow.getCell(5).value).toBe(8.0);
    expect(brunoRow.getCell(6).value).toBe('Atraso justificado');
    expect(brunoRow.getCell(7).value).toBe('Rascunho');
    expect(brunoRow.getCell(8).value).toBeNull(); // Draft has null score

    // Verify Row 11 (Carlos Dias - Excused, unrecorded)
    const carlosRow = sheet1.getRow(11);
    expect(carlosRow.getCell(1).value).toBe('Carlos Dias');
    expect(carlosRow.getCell(3).value).toBe('Justificado');
    expect(carlosRow.getCell(4).value).toBe('Secretário da mesa');
    expect(carlosRow.getCell(5).value).toBeNull();
    expect(carlosRow.getCell(7).value).toBe('Não registrada');
    expect(carlosRow.getCell(8).value).toBeNull();

    // Verify Row 12 (Daniela Castro - Grade adjustment reflected)
    const danielaRow = sheet1.getRow(12);
    expect(danielaRow.getCell(1).value).toBe('Daniela Castro');
    expect(danielaRow.getCell(3).value).toBe('Ausente');
    expect(danielaRow.getCell(7).value).toBe('Nota enviada');
    // Reflects adjusted criterion scores (8.0, 8.0) without role bonus => 8.0
    expect(danielaRow.getCell(8).value).toBe(8.0);

    // Verify Row 13 (Eduardo Ramos - All missing data)
    const eduardoRow = sheet1.getRow(13);
    expect(eduardoRow.getCell(1).value).toBe('Eduardo Ramos');
    expect(eduardoRow.getCell(2).value).toBeNull();
    expect(eduardoRow.getCell(3).value).toBe('Não registrada');
    expect(eduardoRow.getCell(4).value).toBeNull();
    expect(eduardoRow.getCell(5).value).toBeNull();
    expect(eduardoRow.getCell(6).value).toBeNull();
    expect(eduardoRow.getCell(7).value).toBe('Não registrada');
    expect(eduardoRow.getCell(8).value).toBeNull();

    // Inspect Sheet 2: Feedbacks da sessão
    const sheet2 = workbook.getWorksheet('Feedbacks da sessão')!;
    expect(sheet2).toBeDefined();

    const sheet2Header = sheet2.getRow(8);
    expect(sheet2Header.getCell(1).value).toBe('Item');
    expect(sheet2Header.getCell(2).value).toBe('Texto');

    // General feedback
    const genFbRow = sheet2.getRow(9);
    expect(genFbRow.getCell(1).value).toBe('Geral (Autor: Prof. Carlos)');
    expect(genFbRow.getCell(2).value).toBe(
      'O grupo demonstrou excelente maturidade na formulação dos diagnósticos diferenciais.',
    );

    // Ana Souza feedback
    const anaFbRow = sheet2.getRow(10);
    expect(anaFbRow.getCell(1).value).toBe('Ana Souza (Autor: Prof. Carlos)');
    expect(anaFbRow.getCell(2).value).toBe(
      'Excelente condução do grupo e clareza na formulação das hipóteses.',
    );

    // Bruno Lima feedback
    const brunoFbRow = sheet2.getRow(11);
    expect(brunoFbRow.getCell(1).value).toBe('Bruno Lima (Autor: Prof. Carlos)');
    expect(brunoFbRow.getCell(2).value).toBe('Boa síntese no quadro, atentar para pontualidade.');

    // Carlos Dias (no feedback)
    const carlosFbRow = sheet2.getRow(12);
    expect(carlosFbRow.getCell(1).value).toBe('Carlos Dias');
    expect(carlosFbRow.getCell(2).value).toBe('Não informado.');
  });
});
