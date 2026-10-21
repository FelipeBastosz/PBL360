import { Test } from '@nestjs/testing';
import {
  ConflictError,
  LockedError,
  UnprocessableEntityError,
} from '@/shared/errors/application.error';
import { SessionAccessService } from '@/sessions/application/services/session-access.service';
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

  const activeSession = {
    id: 'sess-1',
    peerEvalReleased: true,
    peerEvalDeadline: new Date('2099-12-31T23:59:59Z'),
  };
  const problem = { id: 'prob-1' };

  beforeEach(async () => {
    jest.resetAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        SavePeerEvaluationUseCase,
        { provide: SessionAccessService, useValue: sessionAccess },
        { provide: EVALUATION_REPOSITORY, useValue: repository },
      ],
    }).compile();

    useCase = module.get(SavePeerEvaluationUseCase);
  });

  it('rejects self-evaluation disguised as peer (autoavaliação disfarçada de par)', async () => {
    await expect(
      useCase.execute({
        sessionId: 'sess-1',
        peerId: 'student-1',
        studentId: 'student-1',
        itens: [{ criterionId: 'crit-1', score: 9 }],
        enviar: true,
      }),
    ).rejects.toThrow(UnprocessableEntityError);
    await expect(
      useCase.execute({
        sessionId: 'sess-1',
        peerId: 'student-1',
        studentId: 'student-1',
        itens: [{ criterionId: 'crit-1', score: 9 }],
        enviar: true,
      }),
    ).rejects.toThrow('Um aluno não pode avaliar a si mesmo como par.');
    expect(sessionAccess.assertMemberCanAccessSession).not.toHaveBeenCalled();
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
      }),
    ).rejects.toThrow(LockedError);
    await expect(
      useCase.execute({
        sessionId: 'sess-1',
        peerId: 'peer-1',
        studentId: 'student-1',
        itens: [],
        enviar: false,
      }),
    ).rejects.toThrow('A avaliação entre pares não está liberada.');
  });

  it('rejects when deadline has passed (prazo vencido)', async () => {
    const expiredDeadline = new Date('2026-10-01T12:00:00Z');
    sessionAccess.assertMemberCanAccessSession.mockResolvedValue({
      session: { ...activeSession, peerEvalDeadline: expiredDeadline },
      problem,
      roomId: 'room-1',
    });

    const now = new Date('2026-10-09T10:00:00Z');
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
  });

  it('rejects when evaluating student did not participate (avaliador que não participou)', async () => {
    sessionAccess.assertMemberCanAccessSession.mockResolvedValue({
      session: activeSession,
      problem,
      roomId: 'room-1',
    });
    repository.isStudentParticipating.mockImplementation((_sessId, studentId) => {
      if (studentId === 'student-absent') return Promise.resolve(false);
      return Promise.resolve(true);
    });

    await expect(
      useCase.execute({
        sessionId: 'sess-1',
        peerId: 'peer-1',
        studentId: 'student-absent',
        itens: [],
        enviar: false,
      }),
    ).rejects.toThrow(LockedError);
    await expect(
      useCase.execute({
        sessionId: 'sess-1',
        peerId: 'peer-1',
        studentId: 'student-absent',
        itens: [],
        enviar: false,
      }),
    ).rejects.toThrow('Apenas alunos que participaram da sessão podem avaliar colegas.');
  });

  it('rejects when peer student did not participate (colega ausente na sessão)', async () => {
    sessionAccess.assertMemberCanAccessSession.mockResolvedValue({
      session: activeSession,
      problem,
      roomId: 'room-1',
    });
    repository.isStudentParticipating.mockImplementation((_sessId, studentId) => {
      if (studentId === 'peer-absent') return Promise.resolve(false);
      return Promise.resolve(true);
    });

    await expect(
      useCase.execute({
        sessionId: 'sess-1',
        peerId: 'peer-absent',
        studentId: 'student-1',
        itens: [],
        enviar: false,
      }),
    ).rejects.toThrow(UnprocessableEntityError);
    await expect(
      useCase.execute({
        sessionId: 'sess-1',
        peerId: 'peer-absent',
        studentId: 'student-1',
        itens: [],
        enviar: false,
      }),
    ).rejects.toThrow('O colega não participou da sessão.');
  });

  it('propagates 409 conflict when evaluation is already submitted', async () => {
    sessionAccess.assertMemberCanAccessSession.mockResolvedValue({
      session: activeSession,
      problem,
      roomId: 'room-1',
    });
    repository.isStudentParticipating.mockResolvedValue(true);
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
      }),
    ).rejects.toThrow(ConflictError);
  });

  it('propagates 422 when items validation fails (e.g. invalid criterion or score out of bounds)', async () => {
    sessionAccess.assertMemberCanAccessSession.mockResolvedValue({
      session: activeSession,
      problem,
      roomId: 'room-1',
    });
    repository.isStudentParticipating.mockResolvedValue(true);
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
      }),
    ).rejects.toThrow(UnprocessableEntityError);
  });

  it('saves draft successfully', async () => {
    sessionAccess.assertMemberCanAccessSession.mockResolvedValue({
      session: activeSession,
      problem,
      roomId: 'room-1',
    });
    repository.isStudentParticipating.mockResolvedValue(true);
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
    repository.isStudentParticipating.mockResolvedValue(true);
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
