import { Test } from '@nestjs/testing';
import {
  ConflictError,
  InvalidRequestError,
  LockedError,
  UnprocessableEntityError,
} from '@/shared/errors/application.error';
import { SessionAccessService } from '@/sessions/application/services/session-access.service';
import { AttendanceStatus } from '@/sessions/domain/enums/attendance-status.enum';
import { ATTENDANCE_REPOSITORY } from '@/sessions/domain/repositories/attendance.repository';
import { EvaluationStatus } from '../../domain/enums/evaluation-status.enum';
import { EVALUATION_REPOSITORY } from '../../domain/repositories/evaluation.repository';
import { SavePeerEvaluationUseCase } from './save-peer-evaluation.use-case';

describe('SavePeerEvaluationUseCase', () => {
  let useCase: SavePeerEvaluationUseCase;
  const sessionAccess = {
    assertMemberCanAccessSession: jest.fn(),
  };
  const repository = {
    isStudentParticipating: jest.fn(),
    recordPeerEvaluation: jest.fn(),
  };
  const attendances = {
    findBySession: jest.fn(),
  };

  const now = new Date('2026-10-20T15:00:00Z');

  const activeSession = {
    id: 'sess-1',
    peerEvalReleased: true,
    peerEvalDeadline: new Date('2099-10-20T23:59:59Z'),
  };
  const problem = { id: 'prob-1' };

  beforeEach(async () => {
    jest.resetAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        SavePeerEvaluationUseCase,
        { provide: SessionAccessService, useValue: sessionAccess },
        { provide: EVALUATION_REPOSITORY, useValue: repository },
        { provide: ATTENDANCE_REPOSITORY, useValue: attendances },
      ],
    }).compile();

    useCase = module.get(SavePeerEvaluationUseCase);

    attendances.findBySession.mockResolvedValue([
      { studentId: 'student-1', status: AttendanceStatus.PRESENT },
      { studentId: 'peer-1', status: AttendanceStatus.PRESENT },
    ]);
  });

  it('rejects self-evaluation disguised as peer (autoavaliação disfarçada de par)', async () => {
    await expect(
      useCase.execute({
        sessionId: 'sess-1',
        peerId: 'student-1',
        studentId: 'student-1',
        itens: [{ criterionId: 'crit-1', score: 9 }],
        enviar: true,
        now,
      }),
    ).rejects.toThrow(UnprocessableEntityError);
    await expect(
      useCase.execute({
        sessionId: 'sess-1',
        peerId: 'student-1',
        studentId: 'student-1',
        itens: [{ criterionId: 'crit-1', score: 9 }],
        enviar: true,
        now,
      }),
    ).rejects.toThrow('Um aluno não pode avaliar a si mesmo como par.');
    expect(sessionAccess.assertMemberCanAccessSession).not.toHaveBeenCalled();
    expect(attendances.findBySession).not.toHaveBeenCalled();
    expect(repository.recordPeerEvaluation).not.toHaveBeenCalled();
  });

  it('rejects when peer evaluation is not released (liberação desligada)', async () => {
    sessionAccess.assertMemberCanAccessSession.mockResolvedValue({
      session: { ...activeSession, peerEvalReleased: false },
      problem,
      roomId: 'room-1',
    });

    await expect(
      useCase.execute({
        sessionId: 'sess-1',
        peerId: 'peer-1',
        studentId: 'student-1',
        itens: [],
        enviar: false,
        now,
      }),
    ).rejects.toThrow(LockedError);
    await expect(
      useCase.execute({
        sessionId: 'sess-1',
        peerId: 'peer-1',
        studentId: 'student-1',
        itens: [],
        enviar: false,
        now,
      }),
    ).rejects.toThrow('A avaliação entre pares não está liberada.');
  });

  it.each([new Date('2026-10-01T12:00:00Z'), now])(
    'rejects when the deadline has been reached or passed: %s',
    async (expiredDeadline) => {
      sessionAccess.assertMemberCanAccessSession.mockResolvedValue({
        session: { ...activeSession, peerEvalDeadline: expiredDeadline },
        problem,
        roomId: 'room-1',
      });

      await expect(
        useCase.execute({
          sessionId: 'sess-1',
          peerId: 'peer-1',
          studentId: 'student-1',
          itens: [{ criterionId: 'crit-1', score: 8 }],
          enviar: true,
          now,
        }),
      ).rejects.toThrow(LockedError);
      await expect(
        useCase.execute({
          sessionId: 'sess-1',
          peerId: 'peer-1',
          studentId: 'student-1',
          itens: [{ criterionId: 'crit-1', score: 8 }],
          enviar: true,
          now,
        }),
      ).rejects.toThrow('O prazo para avaliação entre pares expirou.');
      expect(attendances.findBySession).not.toHaveBeenCalled();
      expect(repository.recordPeerEvaluation).not.toHaveBeenCalled();
    },
  );

  it('rejects when roll call has not been recorded by professor', async () => {
    sessionAccess.assertMemberCanAccessSession.mockResolvedValue({
      session: activeSession,
      problem,
      roomId: 'room-1',
    });
    attendances.findBySession.mockResolvedValue([]);

    await expect(
      useCase.execute({
        sessionId: 'sess-1',
        peerId: 'peer-1',
        studentId: 'student-1',
        itens: [],
        enviar: false,
        now,
      }),
    ).rejects.toThrow(LockedError);
    await expect(
      useCase.execute({
        sessionId: 'sess-1',
        peerId: 'peer-1',
        studentId: 'student-1',
        itens: [],
        enviar: false,
        now,
      }),
    ).rejects.toThrow('A chamada da sessão ainda não foi realizada pelo professor.');
  });

  it('rejects when evaluating student did not participate (avaliador que não participou)', async () => {
    sessionAccess.assertMemberCanAccessSession.mockResolvedValue({
      session: activeSession,
      problem,
      roomId: 'room-1',
    });
    attendances.findBySession.mockResolvedValue([
      { studentId: 'student-absent', status: AttendanceStatus.ABSENT },
      { studentId: 'peer-1', status: AttendanceStatus.PRESENT },
    ]);

    await expect(
      useCase.execute({
        sessionId: 'sess-1',
        peerId: 'peer-1',
        studentId: 'student-absent',
        itens: [],
        enviar: false,
        now,
      }),
    ).rejects.toThrow(LockedError);
    await expect(
      useCase.execute({
        sessionId: 'sess-1',
        peerId: 'peer-1',
        studentId: 'student-absent',
        itens: [],
        enviar: false,
        now,
      }),
    ).rejects.toThrow('Apenas alunos que participaram da sessão podem avaliar colegas.');
  });

  it('rejects when peer student did not participate (colega ausente na sessão)', async () => {
    sessionAccess.assertMemberCanAccessSession.mockResolvedValue({
      session: activeSession,
      problem,
      roomId: 'room-1',
    });
    attendances.findBySession.mockResolvedValue([
      { studentId: 'student-1', status: AttendanceStatus.PRESENT },
      { studentId: 'peer-absent', status: AttendanceStatus.ABSENT },
    ]);

    await expect(
      useCase.execute({
        sessionId: 'sess-1',
        peerId: 'peer-absent',
        studentId: 'student-1',
        itens: [],
        enviar: false,
        now,
      }),
    ).rejects.toThrow(InvalidRequestError);
    await expect(
      useCase.execute({
        sessionId: 'sess-1',
        peerId: 'peer-absent',
        studentId: 'student-1',
        itens: [],
        enviar: false,
        now,
      }),
    ).rejects.toThrow('Não é possível avaliar um aluno que não esteve presente nesta sessão.');
  });

  it('propagates 409 conflict when evaluation is already submitted', async () => {
    sessionAccess.assertMemberCanAccessSession.mockResolvedValue({
      session: activeSession,
      problem,
      roomId: 'room-1',
    });
    repository.recordPeerEvaluation.mockRejectedValue(
      new ConflictError('A avaliação deste colega já foi enviada e não pode ser alterada.'),
    );

    await expect(
      useCase.execute({
        sessionId: 'sess-1',
        peerId: 'peer-1',
        studentId: 'student-1',
        itens: [{ criterionId: 'crit-1', score: 10 }],
        enviar: true,
        now,
      }),
    ).rejects.toThrow(ConflictError);
  });

  it('propagates 422 when items validation fails (e.g. invalid criterion or score out of bounds)', async () => {
    sessionAccess.assertMemberCanAccessSession.mockResolvedValue({
      session: activeSession,
      problem,
      roomId: 'room-1',
    });
    repository.recordPeerEvaluation.mockRejectedValue(
      new UnprocessableEntityError('A nota do critério deve estar entre 0 e 10.'),
    );

    await expect(
      useCase.execute({
        sessionId: 'sess-1',
        peerId: 'peer-1',
        studentId: 'student-1',
        itens: [{ criterionId: 'crit-1', score: 12 }],
        enviar: false,
        now,
      }),
    ).rejects.toThrow(UnprocessableEntityError);
  });

  it('saves draft successfully', async () => {
    sessionAccess.assertMemberCanAccessSession.mockResolvedValue({
      session: activeSession,
      problem,
      roomId: 'room-1',
    });
    repository.recordPeerEvaluation.mockResolvedValue({
      peer: { id: 'peer-1', name: 'Lucas' },
      config: {
        tableId: 'tbl-1',
        tableName: 'Tabela',
        criteria: [{ id: 'crit-1', name: 'Critério 1', weight: 1, orderIndex: 1 }],
        frozen: true,
      },
      evaluation: {
        id: 'eval-1',
        status: EvaluationStatus.DRAFT,
        submittedAt: null,
        items: [{ id: 'item-1', criterionId: 'crit-1', score: 7 }],
      },
    });

    const result = await useCase.execute({
      sessionId: 'sess-1',
      peerId: 'peer-1',
      studentId: 'student-1',
      itens: [{ criterionId: 'crit-1', score: 7 }],
      enviar: false,
      now,
    });

    expect(result).toEqual({
      colega: { alunoId: 'peer-1', nome: 'Lucas' },
      status: 'RASCUNHO',
      enviadaEm: null,
      criterios: [{ id: 'crit-1', nome: 'Critério 1', peso: 1, notaMaxima: 10 }],
      itens: [{ criterioId: 'crit-1', nota: 7 }],
    });
  });

  it('submits evaluation successfully', async () => {
    const submittedAt = new Date('2026-10-10T15:00:00Z');
    sessionAccess.assertMemberCanAccessSession.mockResolvedValue({
      session: activeSession,
      problem,
      roomId: 'room-1',
    });
    repository.recordPeerEvaluation.mockResolvedValue({
      peer: { id: 'peer-1', name: 'Lucas' },
      config: {
        tableId: 'tbl-1',
        tableName: 'Tabela',
        criteria: [{ id: 'crit-1', name: 'Critério 1', weight: 1, orderIndex: 1 }],
        frozen: true,
      },
      evaluation: {
        id: 'eval-1',
        status: EvaluationStatus.SUBMITTED,
        submittedAt,
        items: [{ id: 'item-1', criterionId: 'crit-1', score: 9.5 }],
      },
    });

    const result = await useCase.execute({
      sessionId: 'sess-1',
      peerId: 'peer-1',
      studentId: 'student-1',
      itens: [{ criterionId: 'crit-1', score: 9.5 }],
      enviar: true,
      now,
    });

    expect(result).toEqual({
      colega: { alunoId: 'peer-1', nome: 'Lucas' },
      status: 'ENVIADA',
      enviadaEm: submittedAt,
      criterios: [{ id: 'crit-1', nome: 'Critério 1', peso: 1, notaMaxima: 10 }],
      itens: [{ criterioId: 'crit-1', nota: 9.5 }],
    });
  });
});
