import { NotFoundError } from '@/shared/errors/application.error';
import { CommitmentTerm } from '../../domain/entities/commitment-term.entity';
import { UserTermAcceptance } from '../../domain/entities/user-term-acceptance.entity';
import type { CommitmentTermRepository } from '../../domain/repositories/commitment-term.repository';
import type { UserTermAcceptanceRepository } from '../../domain/repositories/user-term-acceptance.repository';
import { GetUserTermAcceptanceUseCase } from './get-user-term-acceptance.use-case';

describe('GetUserTermAcceptanceUseCase', () => {
  let termsRepo: jest.Mocked<CommitmentTermRepository>;
  let acceptancesRepo: jest.Mocked<UserTermAcceptanceRepository>;
  let useCase: GetUserTermAcceptanceUseCase;

  const currentTerm = CommitmentTerm.create({
    version: '1.0',
    title: 'Termo Vigente',
    content: 'Texto',
    isCurrent: true,
  });

  beforeEach(() => {
    termsRepo = { findCurrent: jest.fn(), findByVersion: jest.fn() };
    acceptancesRepo = {
      findByUserId: jest.fn(),
      findByUserIdAndTermId: jest.fn(),
      hasAccepted: jest.fn(),
      create: jest.fn(),
    };
    useCase = new GetUserTermAcceptanceUseCase(termsRepo, acceptancesRepo);
  });

  it('returns false and null values when user has not accepted', async () => {
    termsRepo.findCurrent.mockResolvedValue(currentTerm);
    acceptancesRepo.findByUserId.mockResolvedValue(null);
    acceptancesRepo.hasAccepted.mockResolvedValue(false);

    const result = await useCase.execute('user-1');

    expect(result).toEqual({
      aceito: false,
      versaoAceita: null,
      aceitoEm: null,
      versaoVigente: '1.0',
    });
  });

  it('returns acceptance details when user has accepted', async () => {
    termsRepo.findCurrent.mockResolvedValue(currentTerm);
    const acceptance = UserTermAcceptance.create({
      userId: 'user-1',
      termId: 'term-1',
      termVersion: '1.0',
      acceptedAt: new Date('2026-11-16T10:00:00Z'),
    });
    acceptancesRepo.findByUserId.mockResolvedValue(acceptance);
    acceptancesRepo.hasAccepted.mockResolvedValue(true);

    const result = await useCase.execute('user-1');

    expect(result).toEqual({
      aceito: true,
      versaoAceita: '1.0',
      aceitoEm: new Date('2026-11-16T10:00:00Z'),
      versaoVigente: '1.0',
    });
  });

  it('returns aceito: false when user accepted an older version', async () => {
    termsRepo.findCurrent.mockResolvedValue(currentTerm);
    const acceptance = UserTermAcceptance.create({
      userId: 'user-1',
      termId: 'term-old',
      termVersion: '0.9',
      acceptedAt: new Date('2026-11-01T10:00:00Z'),
    });
    acceptancesRepo.findByUserId.mockResolvedValue(acceptance);
    acceptancesRepo.hasAccepted.mockResolvedValue(false);

    const result = await useCase.execute('user-1');

    expect(result).toEqual({
      aceito: false,
      versaoAceita: '0.9',
      aceitoEm: new Date('2026-11-01T10:00:00Z'),
      versaoVigente: '1.0',
    });
  });

  it('throws NotFoundError if there is no current term', async () => {
    termsRepo.findCurrent.mockResolvedValue(null);

    await expect(useCase.execute('user-1')).rejects.toThrow(NotFoundError);
  });
});
