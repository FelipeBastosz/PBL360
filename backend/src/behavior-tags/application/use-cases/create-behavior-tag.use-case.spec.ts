import { ConflictError } from '@/shared/errors/application.error';
import { type BehaviorTag } from '../../domain/entities/behavior-tag.entity';
import type { BehaviorTagRepository } from '../../domain/repositories/behavior-tag.repository';
import { CreateBehaviorTagUseCase } from './create-behavior-tag.use-case';

describe('CreateBehaviorTagUseCase', () => {
  let repository: jest.Mocked<BehaviorTagRepository>;
  let useCase: CreateBehaviorTagUseCase;

  beforeEach(() => {
    repository = {
      findAvailableForTutor: jest.fn(),
      findById: jest.fn(),
      existsForTutorWithName: jest.fn(),
      save: jest.fn((tag: BehaviorTag) => Promise.resolve(tag)),
    };
    useCase = new CreateBehaviorTagUseCase(repository);
  });

  it('creates an active custom tag owned by the tutor', async () => {
    repository.existsForTutorWithName.mockResolvedValue(false);

    const tag = await useCase.execute({ tutorId: 'tutor-1', name: 'Liderou o grupo' });

    expect(tag.tutorId).toBe('tutor-1');
    expect(tag.name).toBe('Liderou o grupo');
    expect(tag.active).toBe(true);
    expect(repository.save).toHaveBeenCalledWith(tag);
  });

  it('checks the trimmed name for duplicates', async () => {
    repository.existsForTutorWithName.mockResolvedValue(false);

    await useCase.execute({ tutorId: 'tutor-1', name: '  Liderou o grupo  ' });

    expect(repository.existsForTutorWithName).toHaveBeenCalledWith('tutor-1', 'Liderou o grupo');
  });

  it('rejects a name the tutor already uses', async () => {
    repository.existsForTutorWithName.mockResolvedValue(true);

    await expect(
      useCase.execute({ tutorId: 'tutor-1', name: 'Liderou o grupo' }),
    ).rejects.toBeInstanceOf(ConflictError);
    expect(repository.save).not.toHaveBeenCalled();
  });
});
