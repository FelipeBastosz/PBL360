import { ConflictError, NotFoundError } from '@/shared/errors/application.error';
import { CommitmentTerm } from '../../domain/entities/commitment-term.entity';
import { UserTermAcceptance } from '../../domain/entities/user-term-acceptance.entity';
import type { CommitmentTermRepository } from '../../domain/repositories/commitment-term.repository';
import type { UserTermAcceptanceRepository } from '../../domain/repositories/user-term-acceptance.repository';
import { AcceptCommitmentTermUseCase } from './accept-commitment-term.use-case';

describe('AcceptCommitmentTermUseCase', () => {
  let termsRepo: jest.Mocked<CommitmentTermRepository>;
  let acceptancesRepo: jest.Mocked<UserTermAcceptanceRepository>;
  let useCase: AcceptCommitmentTermUseCase;

  const currentTerm = Object.assign(
    CommitmentTerm.create({
      version: '1.0',
      title: 'Termo Vigente',
      content: 'Texto',
      isCurrent: true,
    }),
    { id: 'term-uuid-1' },
  );

  beforeEach(() => {
    termsRepo = { findCurrent: jest.fn(), findByVersion: jest.fn() };
    acceptancesRepo = { findByUserId: jest.fn(), hasAccepted: jest.fn(), create: jest.fn() };
    useCase = new AcceptCommitmentTermUseCase(termsRepo, acceptancesRepo);
  });

  it('records acceptance when valid and returns acceptance status', async () => {
    termsRepo.findCurrent.mockResolvedValue(currentTerm);
    acceptancesRepo.findByUserId.mockResolvedValue(null);

    const savedDate = new Date('2026-11-16T12:00:00Z');
    acceptancesRepo.create.mockImplementation((acc) =>
      Promise.resolve(Object.assign(acc, { acceptedAt: savedDate })),
    );

    const result = await useCase.execute({ userId: 'user-1', version: '1.0' });

    expect(result).toEqual({
      aceito: true,
      versaoAceita: '1.0',
      aceitoEm: savedDate,
      versaoVigente: '1.0',
    });
    expect(acceptancesRepo.create).toHaveBeenCalledTimes(1);
  });

  it('throws ConflictError (409) if submitted version does not match current version', async () => {
    termsRepo.findCurrent.mockResolvedValue(currentTerm);
    acceptancesRepo.findByUserId.mockResolvedValue(null);

    await expect(useCase.execute({ userId: 'user-1', version: '0.9' })).rejects.toThrow(
      ConflictError,
    );

    expect(acceptancesRepo.create).not.toHaveBeenCalled();
  });

  it('returns existing acceptance idempotently on repeated calls without duplicating or changing date', async () => {
    termsRepo.findCurrent.mockResolvedValue(currentTerm);
    const existingDate = new Date('2026-11-10T08:00:00Z');
    const existing = UserTermAcceptance.create({
      userId: 'user-1',
      termId: 'term-uuid-1',
      termVersion: '1.0',
      acceptedAt: existingDate,
    });
    acceptancesRepo.findByUserId.mockResolvedValue(existing);

    const result = await useCase.execute({ userId: 'user-1', version: '1.0' });

    expect(result).toEqual({
      aceito: true,
      versaoAceita: '1.0',
      aceitoEm: existingDate,
      versaoVigente: '1.0',
    });
    expect(acceptancesRepo.create).not.toHaveBeenCalled();
  });

  it('throws NotFoundError if current term does not exist', async () => {
    termsRepo.findCurrent.mockResolvedValue(null);

    await expect(useCase.execute({ userId: 'user-1', version: '1.0' })).rejects.toThrow(
      NotFoundError,
    );
  });
});
