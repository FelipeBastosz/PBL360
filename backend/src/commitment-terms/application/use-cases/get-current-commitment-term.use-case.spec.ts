import { NotFoundError } from '@/shared/errors/application.error';
import { CommitmentTerm } from '../../domain/entities/commitment-term.entity';
import type { CommitmentTermRepository } from '../../domain/repositories/commitment-term.repository';
import { GetCurrentCommitmentTermUseCase } from './get-current-commitment-term.use-case';

describe('GetCurrentCommitmentTermUseCase', () => {
  let repository: jest.Mocked<CommitmentTermRepository>;
  let useCase: GetCurrentCommitmentTermUseCase;

  beforeEach(() => {
    repository = {
      findCurrent: jest.fn(),
      findByVersion: jest.fn(),
    };
    useCase = new GetCurrentCommitmentTermUseCase(repository);
  });

  it('returns current commitment term when it exists', async () => {
    const term = CommitmentTerm.create({
      version: '1.0',
      title: 'Termo Vigente',
      content: 'Texto do termo',
      isCurrent: true,
    });
    repository.findCurrent.mockResolvedValue(term);

    const result = await useCase.execute();

    expect(result.version).toBe('1.0');
    expect(result.title).toBe('Termo Vigente');
  });

  it('throws NotFoundError when no current term is found', async () => {
    repository.findCurrent.mockResolvedValue(null);

    await expect(useCase.execute()).rejects.toThrow(NotFoundError);
  });
});
