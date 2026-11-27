import { AttendanceStatus } from '../../domain/enums/attendance-status.enum';
import { RollCallOrigin } from '../../domain/roll-call/roll-call';
import { SessionRole } from '../../domain/enums/session-role.enum';
import {
  AttendanceStatusPayload,
  RollCallOriginPayload,
} from '../../application/dtos/roll-call.dto';
import { SessionRolePayload } from '../../application/dtos/session-role.dto';
import { RollCallController } from './roll-call.controller';
import { SessionRolesController } from './session-roles.controller';
import { EvaluationReleasesController } from './evaluation-releases.controller';
import { MemberSessionsController } from './member-sessions.controller';

describe('session controllers', () => {
  it('reads and records attendance with domain status conversion', async () => {
    const rollCall = {
      sessionId: 'sess1',
      origin: RollCallOrigin.EMPTY,
      referenceSession: null,
      recordedAt: null,
      seats: 1,
      students: [
        {
          studentId: 's1',
          name: 'Ana',
          initials: 'A',
          seatNumber: null,
          status: AttendanceStatus.PRESENT,
          justification: null,
        },
      ],
      totals: { present: 1, late: 0, excused: 0, absent: 0, unrecorded: 0 },
    };
    const get = { execute: jest.fn().mockResolvedValue(rollCall) };
    const record = { execute: jest.fn().mockResolvedValue(rollCall) };
    const controller = new RollCallController(get as never, record as never);

    await expect(controller.get('sess1', 't1')).resolves.toMatchObject({
      sessaoId: 'sess1',
      origem: RollCallOriginPayload.VAZIA,
      alunos: [{ status: AttendanceStatusPayload.PRESENTE }],
    });
    await controller.record(
      'sess1',
      {
        registros: [{ alunoId: 's1', status: AttendanceStatusPayload.PRESENTE, lugar: 1 }],
      },
      't1',
    );
    expect(record.execute).toHaveBeenCalledWith({
      sessionId: 'sess1',
      tutorId: 't1',
      entries: [
        { studentId: 's1', status: AttendanceStatus.PRESENT, seatNumber: 1, justification: null },
      ],
    });
  });

  it('lists and assigns session roles, mapping role scores and transfers', async () => {
    const list = {
      execute: jest
        .fn()
        .mockResolvedValue([
          { studentId: 's1', name: 'Ana', role: SessionRole.COORDINATOR, roleScore: '8.5' },
        ]),
    };
    const assign = {
      execute: jest
        .fn()
        .mockResolvedValue({ studentId: 's1', role: SessionRole.BOARD_SECRETARY, roleScore: 7 }),
    };
    const controller = new SessionRolesController(list as never, assign as never);

    await expect(controller.list('sess1', 't1')).resolves.toEqual([
      { alunoId: 's1', nome: 'Ana', papel: SessionRolePayload.COORDENADOR, notaPapel: 8.5 },
    ]);
    await expect(
      controller.assign(
        'sess1',
        's1',
        {
          papel: SessionRolePayload.SECRETARIO_QUADRO,
          notaPapel: 7,
          transferir: true,
        },
        't1',
      ),
    ).resolves.toEqual({
      alunoId: 's1',
      papel: SessionRolePayload.SECRETARIO_QUADRO,
      notaPapel: 7,
    });
    expect(assign.execute).toHaveBeenCalledWith({
      sessionId: 'sess1',
      tutorId: 't1',
      studentId: 's1',
      role: SessionRole.BOARD_SECRETARY,
      roleScore: 7,
      transfer: true,
    });
    await controller.assign('sess1', 's1', { papel: null }, 't1');
    expect(assign.execute).toHaveBeenLastCalledWith({
      sessionId: 'sess1',
      tutorId: 't1',
      studentId: 's1',
      role: null,
      roleScore: null,
      transfer: false,
    });
  });

  it('gets and updates self and peer evaluation releases', async () => {
    const releases = {
      self: { released: true, deadline: null, submitted: 2, expected: 3 },
      peer: { released: false, deadline: null, submitted: 1, expected: 2 },
      updatedAt: null,
      updatedBy: null,
    };
    const get = { execute: jest.fn().mockResolvedValue(releases) };
    const update = { execute: jest.fn().mockResolvedValue(releases) };
    const controller = new EvaluationReleasesController(get as never, update as never);

    await expect(controller.get('sess1', 't1')).resolves.toMatchObject({
      autoavaliacao: { liberada: true, enviadas: 2 },
      pares: { liberada: false, esperadas: 2 },
    });
    await controller.update(
      'sess1',
      {
        autoavaliacao: { liberada: true, prazo: '2026-12-01T23:59:00.000Z' },
        pares: { liberada: false },
      },
      't1',
    );
    expect(update.execute).toHaveBeenCalledWith({
      sessionId: 'sess1',
      tutorId: 't1',
      self: { released: true, deadline: new Date('2026-12-01T23:59:00.000Z') },
      peer: { released: false, deadline: null },
    });
  });

  it('lists room sessions and returns a member session with problem context', async () => {
    const date = '2026-04-03';
    const list = {
      execute: jest.fn().mockResolvedValue([
        {
          id: 'sess1',
          title: 'Sessão',
          date,
          orderIndex: 1,
          status: 'PLANNED',
          problemId: 'p1',
          problemTitle: 'Problema',
        },
      ]),
    };
    const session = {
      id: 'sess1',
      title: 'Sessão',
      description: null,
      date,
      orderIndex: 1,
      status: 'PLANNED',
    };
    const get = {
      execute: jest
        .fn()
        .mockResolvedValue({ session, problem: { id: 'p1', title: 'Problema' }, roomId: 'r1' }),
    };
    const controller = new MemberSessionsController(list as never, get as never);
    const member = { id: 's1', type: 'STUDENT' };

    await expect(controller.list('r1', member)).resolves.toMatchObject([
      { id: 'sess1', titulo: 'Sessão', problemaId: 'p1', problemaTitulo: 'Problema' },
    ]);
    expect(list.execute).toHaveBeenCalledWith({ roomId: 'r1', member });
    await expect(controller.get('sess1', member)).resolves.toMatchObject({
      id: 'sess1',
      problemaId: 'p1',
      salaId: 'r1',
      problemaTitulo: 'Problema',
    });
    expect(get.execute).toHaveBeenCalledWith({ sessionId: 'sess1', member });
  });
});
