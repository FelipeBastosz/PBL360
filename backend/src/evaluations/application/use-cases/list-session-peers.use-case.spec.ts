import { Test } from '@nestjs/testing';
import { SessionAccessService } from '@/sessions/application/services/session-access.service';
import { UserType } from '@/users/domain/enums/user-type.enum';
import { EvaluationStatus } from '../../domain/enums/evaluation-status.enum';
import {
  EVALUATION_REPOSITORY,
  type EvaluationRepository,
} from '../../domain/repositories/evaluation.repository';
import { EvaluationStatusResponse } from '../dtos/session-evaluation-summary-response.dto';
import { ListSessionPeersUseCase } from './list-session-peers.use-case';

describe('ListSessionPeersUseCase', () => {
  let useCase: ListSessionPeersUseCase;
  let sessionAccess: jest.Mocked<SessionAccessService>;
  let repository: jest.Mocked<EvaluationRepository>;

  const deadline = new Date('2026-10-15T23:59:59.000Z');

  beforeEach(async () => {
    sessionAccess = {
      assertMemberCanAccessSession: jest.fn().mockResolvedValue({
        session: { peerEvalReleased: true, peerEvalDeadline: deadline },
      }),
    } as unknown as jest.Mocked<SessionAccessService>;

    repository = {
      listSessionPeers: jest.fn().mockResolvedValue([
        {
          alunoId: 'student-2',
          nome: 'Ana Beatriz Souza',
          status: EvaluationStatus.SUBMITTED,
          papel: null,
        },
        {
          alunoId: 'student-3',
          nome: 'Carlos Eduardo',
          status: EvaluationStatus.DRAFT,
          papel: null,
        },
        { alunoId: 'student-4', nome: 'Daniel', status: EvaluationStatus.SUBMITTED, papel: null },
      ]),
    } as unknown as jest.Mocked<EvaluationRepository>;

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
        {
          alunoId: 'student-2',
          nome: 'Ana Beatriz Souza',
          iniciais: 'AS',
          status: EvaluationStatusResponse.ENVIADA,
          papel: null,
        },
        {
          alunoId: 'student-3',
          nome: 'Carlos Eduardo',
          iniciais: 'CE',
          status: EvaluationStatusResponse.RASCUNHO,
          papel: null,
        },
        {
          alunoId: 'student-4',
          nome: 'Daniel',
          iniciais: 'D',
          status: EvaluationStatusResponse.ENVIADA,
          papel: null,
        },
      ],
    });
  });
});
