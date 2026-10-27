import { Test } from '@nestjs/testing';
import { LockedError, UnprocessableEntityError } from '@/shared/errors/application.error';
import { SessionAccessService } from '@/sessions/application/services/session-access.service';
import { EvaluationStatus } from '../../domain/enums/evaluation-status.enum';
import { EVALUATION_REPOSITORY } from '../../domain/repositories/evaluation.repository';
import { GetPeerEvaluationUseCase } from './get-peer-evaluation.use-case';

describe('GetPeerEvaluationUseCase', () => {
  let useCase: GetPeerEvaluationUseCase;
  const sessionAccess = {
    assertMemberCanAccessSession: jest.fn(),
  };
  const repository = {
    isStudentParticipating: jest.fn(),
    getPeerEvaluation: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        GetPeerEvaluationUseCase,
        { provide: SessionAccessService, useValue: sessionAccess },
        { provide: EVALUATION_REPOSITORY, useValue: repository },
      ],
    }).compile();

    useCase = module.get(GetPeerEvaluationUseCase);
  });

  it('rejects self-evaluation disguised as peer (autoavaliação disfarçada de par)', async () => {
    await expect(useCase.execute('sess-1', 'student-1', 'student-1')).rejects.toThrow(
      UnprocessableEntityError,
    );
    await expect(useCase.execute('sess-1', 'student-1', 'student-1')).rejects.toThrow(
      'Um aluno não pode avaliar a si mesmo como par.',
    );
    expect(sessionAccess.assertMemberCanAccessSession).not.toHaveBeenCalled();
  });

  it('rejects when evaluator did not participate in the session', async () => {
    sessionAccess.assertMemberCanAccessSession.mockResolvedValue({
      session: { id: 'sess-1' },
      problem: { id: 'prob-1' },
      roomId: 'room-1',
    });
    repository.isStudentParticipating.mockResolvedValue(false);

    await expect(useCase.execute('sess-1', 'peer-1', 'student-1')).rejects.toThrow(LockedError);
    await expect(useCase.execute('sess-1', 'peer-1', 'student-1')).rejects.toThrow(
      'Apenas alunos que participaram da sessão podem avaliar colegas.',
    );
    expect(repository.getPeerEvaluation).not.toHaveBeenCalled();
  });

  it('rejects when colleague did not participate in the session', async () => {
    sessionAccess.assertMemberCanAccessSession.mockResolvedValue({
      session: { id: 'sess-1' },
      problem: { id: 'prob-1' },
      roomId: 'room-1',
    });
    repository.isStudentParticipating.mockResolvedValue(true);
    repository.getPeerEvaluation.mockRejectedValue(
      new UnprocessableEntityError('O colega não participou da sessão.'),
    );

    await expect(useCase.execute('sess-1', 'peer-absent', 'student-1')).rejects.toThrow(
      UnprocessableEntityError,
    );
    await expect(useCase.execute('sess-1', 'peer-absent', 'student-1')).rejects.toThrow(
      'O colega não participou da sessão.',
    );
  });

  it('returns pending form with criteria when no evaluation exists yet', async () => {
    sessionAccess.assertMemberCanAccessSession.mockResolvedValue({
      session: { id: 'sess-1' },
      problem: { id: 'prob-1' },
      roomId: 'room-1',
    });
    repository.isStudentParticipating.mockResolvedValue(true);
    repository.getPeerEvaluation.mockResolvedValue({
      peer: { id: 'peer-1', name: 'Maria Santos' },
      config: {
        tableId: 'tbl-1',
        tableName: 'Barema',
        criteria: [
          { id: 'crit-1', name: 'Comunicação', weight: 2, orderIndex: 1 },
          { id: 'crit-2', name: 'Pontualidade', weight: 1, orderIndex: 2 },
        ],
        frozen: false,
      },
      evaluation: null,
    });

    const result = await useCase.execute('sess-1', 'peer-1', 'student-1');

    expect(result).toEqual({
      colega: { alunoId: 'peer-1', nome: 'Maria Santos' },
      status: 'PENDENTE',
      enviadaEm: null,
      criterios: [
        { id: 'crit-1', nome: 'Comunicação', peso: 2, notaMaxima: 10 },
        { id: 'crit-2', nome: 'Pontualidade', peso: 1, notaMaxima: 10 },
      ],
      itens: [],
    });
  });

  it('returns draft form with saved items', async () => {
    sessionAccess.assertMemberCanAccessSession.mockResolvedValue({
      session: { id: 'sess-1' },
      problem: { id: 'prob-1' },
      roomId: 'room-1',
    });
    repository.isStudentParticipating.mockResolvedValue(true);
    repository.getPeerEvaluation.mockResolvedValue({
      peer: { id: 'peer-1', name: 'Maria Santos' },
      config: {
        tableId: 'tbl-1',
        tableName: 'Barema',
        criteria: [{ id: 'crit-1', name: 'Comunicação', weight: 2, orderIndex: 1 }],
        frozen: true,
      },
      evaluation: {
        id: 'eval-1',
        status: EvaluationStatus.DRAFT,
        submittedAt: null,
        items: [{ id: 'item-1', criterionId: 'crit-1', score: 8.5 }],
      },
    });

    const result = await useCase.execute('sess-1', 'peer-1', 'student-1');

    expect(result).toEqual({
      colega: { alunoId: 'peer-1', nome: 'Maria Santos' },
      status: 'RASCUNHO',
      enviadaEm: null,
      criterios: [{ id: 'crit-1', nome: 'Comunicação', peso: 2, notaMaxima: 10 }],
      itens: [{ criterioId: 'crit-1', nota: 8.5 }],
    });
  });

  it('returns submitted evaluation with submittedAt date', async () => {
    const submittedAt = new Date('2026-10-09T12:00:00Z');
    sessionAccess.assertMemberCanAccessSession.mockResolvedValue({
      session: { id: 'sess-1' },
      problem: { id: 'prob-1' },
      roomId: 'room-1',
    });
    repository.isStudentParticipating.mockResolvedValue(true);
    repository.getPeerEvaluation.mockResolvedValue({
      peer: { id: 'peer-1', name: 'Maria Santos' },
      config: {
        tableId: 'tbl-1',
        tableName: 'Barema',
        criteria: [{ id: 'crit-1', name: 'Comunicação', weight: 2, orderIndex: 1 }],
        frozen: true,
      },
      evaluation: {
        id: 'eval-1',
        status: EvaluationStatus.SUBMITTED,
        submittedAt,
        items: [{ id: 'item-1', criterionId: 'crit-1', score: 9 }],
      },
    });

    const result = await useCase.execute('sess-1', 'peer-1', 'student-1');

    expect(result).toEqual({
      colega: { alunoId: 'peer-1', nome: 'Maria Santos' },
      status: 'ENVIADA',
      enviadaEm: submittedAt,
      criterios: [{ id: 'crit-1', nome: 'Comunicação', peso: 2, notaMaxima: 10 }],
      itens: [{ criterioId: 'crit-1', nota: 9 }],
    });
  });
});
