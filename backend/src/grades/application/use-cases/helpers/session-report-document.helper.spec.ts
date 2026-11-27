import { AttendanceStatus } from '@/sessions/domain/enums/attendance-status.enum';
import { SessionRole } from '@/sessions/domain/enums/session-role.enum';
import { EvaluationStatus } from '@/evaluations/domain/enums/evaluation-status.enum';
import { ReportFileFormat } from '@/report-files/domain/report-document';
import type { SessionReportData } from '@/sessions/domain/repositories/session-report.repository';
import {
  buildSessionFileName,
  buildSessionReportDocument,
  buildStudentRow,
  formatSessionDate,
} from './session-report-document.helper';

const reportData = (): SessionReportData => ({
  room: { id: 'room-1', name: 'Turma A', courseCode: 'EXA613', semester: '2026.2' },
  problem: { id: 'problem-1', title: 'Prontuário eletrônico', orderIndex: 2 },
  session: { id: 'session-1', title: 'Abertura', orderIndex: 1, date: '2026-10-07' },
  students: [
    {
      studentId: 'student-1',
      name: 'Ana',
      matricula: '2026001',
      attendanceStatus: AttendanceStatus.PRESENT,
      role: SessionRole.COORDINATOR,
      roleScore: 9,
      tags: ['Participou', 'Colaborou'],
      evaluationStatus: EvaluationStatus.SUBMITTED,
      appliedBonus: 1,
      feedback: { text: 'Boa participação', authorName: 'Tutor' },
    },
  ],
  generalFeedback: { text: '  Excelente discussão  ', authorName: 'Tutor' },
});

describe('session report document helper', () => {
  it('formats absent, ISO, Date, and invalid date values', () => {
    expect(formatSessionDate(null)).toBe('—');
    expect(formatSessionDate('2026-10-07T08:00:00Z')).toBe('07/10/2026');
    expect(formatSessionDate(new Date('2026-10-07T00:00:00Z'))).toBe('07/10/2026');
    expect(formatSessionDate('invalid-date')).toBe('invalid-date');
  });

  it('builds student rows with visible or hidden names and optional tags', () => {
    const student = reportData().students[0]!;
    const grade = { gradeStatus: 'Nota enviada', grade: 8.5 };

    expect(buildStudentRow(student, grade, false, true)).toEqual([
      'Ana',
      '2026001',
      'Presente',
      'Coordenador',
      'Participou, Colaborou',
      'Nota enviada',
      8.5,
    ]);
    expect(
      buildStudentRow(
        { ...student, role: 'Papel novo', attendanceStatus: null, tags: [] },
        grade,
        true,
        false,
      ),
    ).toEqual([null, '2026001', 'Não registrada', 'Papel novo', null, 'Nota enviada', 8.5]);
    expect(
      buildStudentRow({ ...student, matricula: null, role: null, tags: [] }, grade, false, true),
    ).toEqual(['Ana', null, 'Presente', null, null, 'Nota enviada', 8.5]);
    expect(
      buildStudentRow({ ...student, attendanceStatus: 'REMOTA' }, grade, false, false)[2],
    ).toBe('REMOTA');
  });

  it('uses session and problem order in the filename when available', () => {
    const data = reportData();
    expect(buildSessionFileName(data)).toBe('relatorio-sessao-p2-s1');
    expect(buildSessionFileName({ ...data, problem: { ...data.problem, orderIndex: null } })).toBe(
      'relatorio-sessao-s1',
    );
    expect(
      buildSessionFileName({
        ...data,
        session: { ...data.session, orderIndex: null },
        problem: { ...data.problem, orderIndex: null },
      }),
    ).toBe('relatorio-sessao-Abertura');
  });

  it('builds the report with grades, identification, feedback and display options', () => {
    const data = reportData();
    const grades = new Map([
      [
        'student-1',
        {
          session: {
            situacao: 'AVALIADA',
            nota: 8,
            modalidade: 'TUTOR',
            pares: { origem: 'FORMULARIO' },
          },
          exactGrade: 8.34,
        },
      ],
    ]) as never;

    const document = buildSessionReportDocument(ReportFileFormat.PDF, data, grades, {
      ocultarNome: true,
      mostrarFeedBack: true,
      mostrarMarcacoes: false,
    });

    expect(document).toMatchObject({
      format: ReportFileFormat.PDF,
      title: 'Relatório da sessão — Abertura',
      fileName: 'relatorio-sessao-p2-s1',
      identification: [
        { label: 'Turma', value: 'Turma A' },
        { label: 'Problema', value: 'Problema 2 — Prontuário eletrônico' },
        { label: 'Sessão', value: 'Sessão 1 — Abertura' },
        { label: 'Data', value: '07/10/2026' },
      ],
      sections: [
        {
          kind: 'table',
          title: 'Dados da sessão',
          rows: [[null, '2026001', 'Presente', 'Coordenador', null, 'Nota enviada', 8.3]],
        },
        {
          kind: 'text',
          title: 'Feedbacks da sessão',
          entries: [
            { label: 'Geral (Autor: Tutor)', text: '  Excelente discussão  ' },
            { label: '2026001 (Autor: Tutor)', text: 'Boa participação' },
          ],
        },
      ],
    });

    const withoutFeedback = buildSessionReportDocument(ReportFileFormat.XLSX, data, grades, {
      mostrarFeedBack: false,
    });
    expect(withoutFeedback.sections).toHaveLength(1);

    const defaultOptions = buildSessionReportDocument(ReportFileFormat.PDF, data, grades);
    expect(defaultOptions.sections).toHaveLength(2);
    expect(defaultOptions.sections[0]).toMatchObject({
      rows: [
        ['Ana', '2026001', 'Presente', 'Coordenador', 'Participou, Colaborou', 'Nota enviada', 8.3],
      ],
    });

    const zeroOrder = buildSessionReportDocument(
      ReportFileFormat.PDF,
      {
        ...data,
        problem: { ...data.problem, orderIndex: 0 },
        session: { ...data.session, orderIndex: 0 },
      },
      grades,
    );
    expect(zeroOrder.identification.slice(1, 3)).toEqual([
      { label: 'Problema', value: 'Prontuário eletrônico' },
      { label: 'Sessão', value: 'Abertura' },
    ]);
  });
});
