import { EvaluationStatus } from '@/evaluations/domain/enums/evaluation-status.enum';
import { AttendanceStatus } from '@/sessions/domain/enums/attendance-status.enum';
import { SessionRole } from '@/sessions/domain/enums/session-role.enum';
import type { SessionReportRawData } from './session-report.types';
import { buildSessionReportData } from './session-report.mapper';

const rawReport = (): SessionReportRawData => ({
  header: {
    sessionId: 'session-1',
    sessionTitle: 'Abertura',
    sessionOrderIndex: 1,
    sessionDate: '2026-10-01',
    problemId: 'problem-1',
    problemTitle: 'Problema',
    problemOrderIndex: 2,
    roomId: 'room-1',
    roomName: 'Turma A',
    courseCode: 'EXA613',
    semester: '2026.2',
  },
  roomId: 'fallback-room',
  sessionId: 'fallback-session',
  students: [
    { studentId: 'student-1', name: 'Ana', matricula: '2026001' },
    { studentId: 'student-2', name: 'Bia', matricula: null },
  ],
  attendances: [{ studentId: 'student-1', status: AttendanceStatus.PRESENT }],
  roles: [{ studentId: 'student-1', role: SessionRole.COORDINATOR, roleScore: '9.5' }],
  observations: [{ studentId: 'student-1', tags: ['Participou'] }],
  evaluations: [
    {
      id: 'evaluation-1',
      studentId: 'student-1',
      status: EvaluationStatus.DRAFT,
      appliedBonus: '1.5',
    },
  ],
  feedbacks: [
    { id: 'feedback-1', recipientId: 'student-1', text: 'Boa participação', authorName: 'Tutor' },
    { id: 'feedback-general', recipientId: null, text: 'Discussão produtiva', authorName: 'Tutor' },
  ],
  summaries: [{ studentId: 'student-1', status: EvaluationStatus.SUBMITTED } as never],
});

describe('buildSessionReportData', () => {
  it('maps header, student metadata, evaluation summaries and feedbacks', () => {
    expect(buildSessionReportData(rawReport())).toEqual({
      room: { id: 'room-1', name: 'Turma A', courseCode: 'EXA613', semester: '2026.2' },
      problem: { id: 'problem-1', title: 'Problema', orderIndex: 2 },
      session: { id: 'session-1', title: 'Abertura', orderIndex: 1, date: '2026-10-01' },
      students: [
        {
          studentId: 'student-1',
          name: 'Ana',
          matricula: '2026001',
          attendanceStatus: AttendanceStatus.PRESENT,
          role: SessionRole.COORDINATOR,
          roleScore: 9.5,
          tags: ['Participou'],
          evaluationStatus: EvaluationStatus.SUBMITTED,
          appliedBonus: 1.5,
          feedback: { text: 'Boa participação', authorName: 'Tutor' },
        },
        {
          studentId: 'student-2',
          name: 'Bia',
          matricula: null,
          attendanceStatus: null,
          role: null,
          roleScore: null,
          tags: [],
          evaluationStatus: null,
          appliedBonus: null,
          feedback: null,
        },
      ],
      generalFeedback: { text: 'Discussão produtiva', authorName: 'Tutor' },
    });
  });

  it('uses evaluation status when no summary is available and defaults missing report metadata', () => {
    const raw = rawReport();
    raw.header = undefined;
    raw.summaries = undefined;
    raw.feedbacks = [
      { id: 'feedback-1', recipientId: 'other', text: 'Texto', authorName: 'Tutor' },
    ];

    const result = buildSessionReportData(raw);

    expect(result.room).toEqual({ id: 'fallback-room', name: '', courseCode: '', semester: '' });
    expect(result.problem).toEqual({ id: '', title: '', orderIndex: null });
    expect(result.session).toMatchObject({ id: 'fallback-session', title: '', orderIndex: null });
    expect(result.session.date).toBeInstanceOf(Date);
    expect(result.students[0]).toMatchObject({ evaluationStatus: EvaluationStatus.DRAFT });
    expect(result.generalFeedback).toBeNull();
  });

  it('prefers a session summary null status over the underlying evaluation status', () => {
    const raw = rawReport();
    raw.summaries = [{ studentId: 'student-1', status: null } as never];

    expect(buildSessionReportData(raw).students[0]?.evaluationStatus).toBe(EvaluationStatus.DRAFT);
  });
});
