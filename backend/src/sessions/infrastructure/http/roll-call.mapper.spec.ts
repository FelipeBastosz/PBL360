import { AttendanceStatus } from '../../domain/enums/attendance-status.enum';
import { RollCallOrigin } from '../../domain/roll-call/roll-call';
import { toAttendanceEntries, toRollCallResponse } from './roll-call.mapper';

describe('roll call mapper', () => {
  it('maps attendance payloads and optional values to the domain model', () => {
    expect(
      toAttendanceEntries({
        registros: [
          { alunoId: 's1', status: 'PRESENTE', lugar: 2 },
          { alunoId: 's2', status: 'JUSTIFICADO', justificativa: 'Atestado' },
        ],
      } as never),
    ).toEqual([
      { studentId: 's1', status: AttendanceStatus.PRESENT, seatNumber: 2, justification: null },
      {
        studentId: 's2',
        status: AttendanceStatus.EXCUSED,
        seatNumber: null,
        justification: 'Atestado',
      },
    ]);
  });

  it('maps a recorded roll call with a reference and nullable student status', () => {
    const recordedAt = new Date('2025-05-01T12:00:00Z');
    expect(
      toRollCallResponse({
        sessionId: 's1',
        origin: RollCallOrigin.PREVIOUS_SESSION,
        referenceSession: { id: 's0', date: '2025-04-30' },
        recordedAt,
        seats: 4,
        students: [
          {
            studentId: 'u1',
            name: 'Ana',
            initials: 'A',
            seatNumber: 1,
            status: AttendanceStatus.PRESENT,
            justification: null,
          },
          {
            studentId: 'u2',
            name: 'Bia',
            initials: 'B',
            seatNumber: null,
            status: null,
            justification: null,
          },
        ],
        totals: { present: 1, late: 0, excused: 0, absent: 0, unrecorded: 1 },
      }),
    ).toEqual({
      sessaoId: 's1',
      origem: 'SESSAO_ANTERIOR',
      sessaoReferencia: { id: 's0', data: '30-04-2025' },
      registradaEm: recordedAt,
      lugares: 4,
      alunos: [
        {
          alunoId: 'u1',
          nome: 'Ana',
          iniciais: 'A',
          lugar: 1,
          status: 'PRESENTE',
          justificativa: null,
        },
        {
          alunoId: 'u2',
          nome: 'Bia',
          iniciais: 'B',
          lugar: null,
          status: null,
          justificativa: null,
        },
      ],
      totais: { presentes: 1, atrasados: 0, justificados: 0, ausentes: 0, semRegistro: 1 },
    });
  });

  it('maps absent references and timestamps', () => {
    expect(
      toRollCallResponse({
        sessionId: 's2',
        origin: RollCallOrigin.EMPTY,
        referenceSession: null,
        recordedAt: null,
        seats: 0,
        students: [],
        totals: { present: 0, late: 0, excused: 0, absent: 0, unrecorded: 0 },
      }),
    ).toMatchObject({ origem: 'VAZIA', sessaoReferencia: null, registradaEm: null, alunos: [] });
  });
});
