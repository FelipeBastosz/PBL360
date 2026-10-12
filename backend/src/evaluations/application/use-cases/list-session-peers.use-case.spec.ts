import { Test } from '@nestjs/testing';
import { ForbiddenError, NotFoundError } from '@/shared/errors/application.error';
import { SessionAccessService } from '@/sessions/application/services/session-access.service';
import { UserType } from '@/users/domain/enums/user-type.enum';
import { EvaluationStatus } from '../../domain/enums/evaluation-status.enum';
import { EVALUATION_REPOSITORY } from '../../domain/repositories/evaluation.repository';
import { ListSessionPeersUseCase } from './list-session-peers.use-case';

describe('ListSessionPeersUseCase', () => {
  let useCase: ListSessionPeersUseCase;
  const sessionAccess = {
    assertMemberCanAccessSession: jest.fn(),
  };
  const repository = {
    listSessionPeers: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        ListSessionPeersUseCase,
        { provide: SessionAccessService, useValue: sessionAccess },
        { provide: EVALUATION_REPOSITORY, useValue: repository },
      ],
    }).compile();

    useCase = module.get(ListSessionPeersUseCase);
  });

  it('returns peers with initials and status when session is released', async () => {
    const deadline = new Date('2026-10-15T23:59:59Z');
    sessionAccess.assertMemberCanAccessSession.mockResolvedValue({
      session: {
        id: 'sess-1',
        peerEvalReleased: true,
        peerEvalDeadline: deadline,
      },
      problem: { id: 'prob-1' },
      roomId: 'room-1',
    });

    repository.listSessionPeers.mockResolvedValue([
      { alunoId: 'student-2', nome: 'Ana Beatriz Souza', status: null },
      { alunoId: 'student-3', nome: 'Carlos Eduardo', status: EvaluationStatus.DRAFT },
      { alunoId: 'student-4', nome: 'Daniel', status: EvaluationStatus.SUBMITTED },
    ]);

    const result = await useCase.execute('sess-1', 'student-1');

    expect(sessionAccess.assertMemberCanAccessSession).toHaveBeenCalledWith('sess-1', {
      id: 'student-1',
      type: UserType.STUDENT,
    });
    expect(repository.listSessionPeers).toHaveBeenCalledWith('sess-1', 'student-1');
    expect(result).toEqual({
      liberada: true,
      prazo: deadline,
      colegas: [
        { alunoId: 'student-2', nome: 'Ana Beatriz Souza', iniciais: 'AS', status: 'PENDENTE' },
        { alunoId: 'student-3', nome: 'Carlos Eduardo', iniciais: 'CE', status: 'RASCUNHO' },
        { alunoId: 'student-4', nome: 'Daniel', iniciais: 'D', status: 'ENVIADA' },
      ],
    });
  });

  it('returns empty list if repository returns no peers (e.g. absent evaluator)', async () => {
    sessionAccess.assertMemberCanAccessSession.mockResolvedValue({
      session: {
        id: 'sess-1',
        peerEvalReleased: false,
        peerEvalDeadline: null,
      },
      problem: { id: 'prob-1' },
      roomId: 'room-1',
    });
    repository.listSessionPeers.mockResolvedValue([]);

    const result = await useCase.execute('sess-1', 'student-1');

    expect(result).toEqual({
      liberada: false,
      prazo: null,
      colegas: [],
    });
  });

  it('fails if student does not belong to the room', async () => {
    sessionAccess.assertMemberCanAccessSession.mockRejectedValue(
      new ForbiddenError('Aluno sem vínculo com a sala.'),
    );

    await expect(useCase.execute('sess-1', 'student-outsider')).rejects.toThrow(ForbiddenError);
    expect(repository.listSessionPeers).not.toHaveBeenCalled();
  });

  it('fails if session is not found', async () => {
    sessionAccess.assertMemberCanAccessSession.mockRejectedValue(
      new NotFoundError('Sessão não encontrada.'),
    );

    await expect(useCase.execute('sess-unknown', 'student-1')).rejects.toThrow(NotFoundError);
  });
});
