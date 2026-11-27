import { IsNull, Not, type Repository } from 'typeorm';
import { BehaviorTag } from '../../domain/entities/behavior-tag.entity';
import { PgBehaviorTagRepository } from './pg-behavior-tag.repository';

describe('PgBehaviorTagRepository', () => {
  const setup = () => {
    const repository = {
      find: jest.fn(),
      findOneBy: jest.fn(),
      existsBy: jest.fn(),
      save: jest.fn(),
    };
    return {
      repository,
      subject: new PgBehaviorTagRepository(repository as unknown as Repository<BehaviorTag>),
    };
  };

  it('lists active predefined and tutor owned tags ordered by name', async () => {
    const { repository, subject } = setup();
    const rows = [BehaviorTag.create({ tutorId: 't1', name: 'Participação' })];
    repository.find.mockResolvedValue(rows);
    await expect(subject.findAvailableForTutor('t1')).resolves.toBe(rows);
    expect(repository.find).toHaveBeenCalledWith({
      where: [
        { tutorId: IsNull(), active: true },
        { tutorId: 't1', active: true },
      ],
      order: { name: 'ASC' },
    });
  });

  it('looks up tags, checks name ownership with and without an excluded id, and saves', async () => {
    const { repository, subject } = setup();
    const tag = BehaviorTag.create({ tutorId: 't1', name: 'Comunicação' });
    repository.findOneBy.mockResolvedValue(tag);
    await expect(subject.findById('tag1')).resolves.toBe(tag);
    expect(repository.findOneBy).toHaveBeenCalledWith({ id: 'tag1' });
    repository.existsBy.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    await expect(subject.existsForTutorWithName('t1', 'X')).resolves.toBe(false);
    expect(repository.existsBy).toHaveBeenLastCalledWith({ tutorId: 't1', name: 'X' });
    await expect(subject.existsForTutorWithName('t1', 'X', 'tag1')).resolves.toBe(true);
    expect(repository.existsBy).toHaveBeenLastCalledWith({
      tutorId: 't1',
      name: 'X',
      id: Not('tag1'),
    });
    repository.save.mockResolvedValue(tag);
    await expect(subject.save(tag)).resolves.toBe(tag);
  });
});
