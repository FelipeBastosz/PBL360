import { ConflictError, ForbiddenError, NotFoundError } from '@/shared/errors/application.error';
import { BehaviorTag } from '../../domain/entities/behavior-tag.entity';
import type { BehaviorTagRepository } from '../../domain/repositories/behavior-tag.repository';
import { RenameBehaviorTagUseCase } from './rename-behavior-tag.use-case';

describe('RenameBehaviorTagUseCase', () => {
  let repository: jest.Mocked<BehaviorTagRepository>;
  let useCase: RenameBehaviorTagUseCase;

  const customTag = (): BehaviorTag =>
    Object.assign(BehaviorTag.create({ name: 'Liderou', tutorId: 'tutor-1' }), { id: 'tag-1' });

  beforeEach(() => {
    repository = {
      findAvailableForTutor: jest.fn(),
      findById: jest.fn(),
      existsForTutorWithName: jest.fn(),
      save: jest.fn((tag: BehaviorTag) => Promise.resolve(tag)),
    };
    useCase = new RenameBehaviorTagUseCase(repository);
  });

  it('renames a custom tag of the tutor', async () => {
    repository.findById.mockResolvedValue(customTag());
    repository.existsForTutorWithName.mockResolvedValue(false);

    const tag = await useCase.execute({
      id: 'tag-1',
      tutorId: 'tutor-1',
      name: '  Liderou o grupo ',
    });

    expect(tag.name).toBe('Liderou o grupo');
    expect(repository.save).toHaveBeenCalledWith(tag);
  });

  it('ignores the tag itself when checking for duplicates', async () => {
    repository.findById.mockResolvedValue(customTag());
    repository.existsForTutorWithName.mockResolvedValue(false);

    await useCase.execute({ id: 'tag-1', tutorId: 'tutor-1', name: 'Liderou' });

    expect(repository.existsForTutorWithName).toHaveBeenCalledWith('tutor-1', 'Liderou', 'tag-1');
  });

  it('rejects a name used by another tag of the tutor', async () => {
    repository.findById.mockResolvedValue(customTag());
    repository.existsForTutorWithName.mockResolvedValue(true);

    await expect(
      useCase.execute({ id: 'tag-1', tutorId: 'tutor-1', name: 'Outra' }),
    ).rejects.toBeInstanceOf(ConflictError);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('rejects renaming a predefined tag', async () => {
    repository.findById.mockResolvedValue(BehaviorTag.create({ name: 'Atraso' }));

    await expect(
      useCase.execute({ id: 'tag-1', tutorId: 'tutor-1', name: 'X' }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it("rejects renaming another tutor's tag", async () => {
    repository.findById.mockResolvedValue(customTag());

    await expect(
      useCase.execute({ id: 'tag-1', tutorId: 'tutor-2', name: 'X' }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('reports a missing or deactivated tag as not found', async () => {
    const deactivated = customTag();
    deactivated.deactivate();
    repository.findById.mockResolvedValueOnce(null).mockResolvedValueOnce(deactivated);

    await expect(
      useCase.execute({ id: 'tag-1', tutorId: 'tutor-1', name: 'X' }),
    ).rejects.toBeInstanceOf(NotFoundError);
    await expect(
      useCase.execute({ id: 'tag-1', tutorId: 'tutor-1', name: 'X' }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
