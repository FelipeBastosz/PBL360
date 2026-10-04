import { BehaviorTag } from '../../domain/entities/behavior-tag.entity';
import type { BehaviorTagRepository } from '../../domain/repositories/behavior-tag.repository';
import { ListBehaviorTagsUseCase } from './list-behavior-tags.use-case';

describe('ListBehaviorTagsUseCase', () => {
  it('lists the tags available to the authenticated tutor', async () => {
    const tags = [
      BehaviorTag.create({ nome: 'Atraso' }),
      BehaviorTag.create({ nome: 'Liderou o grupo', tutorId: 'tutor-1' }),
    ];
    const repository: jest.Mocked<BehaviorTagRepository> = {
      findAvailableForTutor: jest.fn(),
      findById: jest.fn(),
      existsForTutorWithName: jest.fn(),
      save: jest.fn(),
    };
    repository.findAvailableForTutor.mockResolvedValue(tags);

    const useCase = new ListBehaviorTagsUseCase(repository);

    await expect(useCase.execute('tutor-1')).resolves.toEqual(tags);
    expect(repository.findAvailableForTutor).toHaveBeenCalledWith('tutor-1');
  });
});
