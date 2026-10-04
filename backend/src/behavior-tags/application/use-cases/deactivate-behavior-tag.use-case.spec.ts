import { ForbiddenError, NotFoundError } from '@/shared/errors/application.error';
import { BehaviorTag } from '../../domain/entities/behavior-tag.entity';
import type { BehaviorTagRepository } from '../../domain/repositories/behavior-tag.repository';
import { DeactivateBehaviorTagUseCase } from './deactivate-behavior-tag.use-case';

describe('DeactivateBehaviorTagUseCase', () => {
  let repository: jest.Mocked<BehaviorTagRepository>;
  let useCase: DeactivateBehaviorTagUseCase;

  const customTag = (): BehaviorTag =>
    Object.assign(BehaviorTag.create({ nome: 'Liderou', tutorId: 'tutor-1' }), { id: 'tag-1' });

  beforeEach(() => {
    repository = {
      findAvailableForTutor: jest.fn(),
      findById: jest.fn(),
      existsForTutorWithName: jest.fn(),
      save: jest.fn((tag: BehaviorTag) => Promise.resolve(tag)),
    };
    useCase = new DeactivateBehaviorTagUseCase(repository);
  });

  it('deactivates a custom tag of the tutor without deleting it', async () => {
    const tag = customTag();
    repository.findById.mockResolvedValue(tag);

    await useCase.execute('tag-1', 'tutor-1');

    expect(tag.ativa).toBe(false);
    expect(repository.save).toHaveBeenCalledWith(tag);
  });

  it('rejects deactivating a predefined tag', async () => {
    repository.findById.mockResolvedValue(BehaviorTag.create({ nome: 'Atraso' }));

    await expect(useCase.execute('tag-1', 'tutor-1')).rejects.toBeInstanceOf(ForbiddenError);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it("rejects deactivating another tutor's tag", async () => {
    repository.findById.mockResolvedValue(customTag());

    await expect(useCase.execute('tag-1', 'tutor-2')).rejects.toBeInstanceOf(ForbiddenError);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('reports a missing or already deactivated tag as not found', async () => {
    const deactivated = customTag();
    deactivated.deactivate();
    repository.findById.mockResolvedValueOnce(null).mockResolvedValueOnce(deactivated);

    await expect(useCase.execute('tag-1', 'tutor-1')).rejects.toBeInstanceOf(NotFoundError);
    await expect(useCase.execute('tag-1', 'tutor-1')).rejects.toBeInstanceOf(NotFoundError);
  });
});
