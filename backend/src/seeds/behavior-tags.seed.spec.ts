import { IsNull } from 'typeorm';
import type { DataSource, Repository } from 'typeorm';
import { BehaviorTag } from '@/behavior-tags/domain/entities/behavior-tag.entity';
import { SEED_BEHAVIOR_TAGS, seedAllBehaviorTags, seedBehaviorTag } from './behavior-tags.seed';

describe('behavior-tags.seed', () => {
  let tagRepo: jest.Mocked<Pick<Repository<BehaviorTag>, 'findOneBy' | 'save'>>;
  let dataSource: DataSource;

  beforeEach(() => {
    tagRepo = { findOneBy: jest.fn(), save: jest.fn() };
    dataSource = { getRepository: jest.fn().mockReturnValue(tagRepo) } as unknown as DataSource;
  });

  it('creates a predefined tag that does not exist yet', async () => {
    tagRepo.findOneBy.mockResolvedValueOnce(null);

    const created = await seedBehaviorTag('Atraso', dataSource);

    const saved = tagRepo.save.mock.calls[0]![0] as BehaviorTag;
    expect(created).toBe(true);
    expect(saved.nome).toBe('Atraso');
    expect(saved.isPredefined()).toBe(true);
  });

  it('looks up only predefined tags with that name', async () => {
    tagRepo.findOneBy.mockResolvedValueOnce(null);

    await seedBehaviorTag('Atraso', dataSource);

    expect(tagRepo.findOneBy).toHaveBeenCalledWith({ nome: 'Atraso', tutorId: IsNull() });
  });

  it('skips a tag that already exists', async () => {
    tagRepo.findOneBy.mockResolvedValueOnce(BehaviorTag.create({ nome: 'Atraso' }));

    const created = await seedBehaviorTag('Atraso', dataSource);

    expect(created).toBe(false);
    expect(tagRepo.save).not.toHaveBeenCalled();
  });

  it('seeds the four predefined tags from the design', async () => {
    tagRepo.findOneBy.mockResolvedValue(null);

    await seedAllBehaviorTags(dataSource);

    expect(SEED_BEHAVIOR_TAGS).toHaveLength(4);
    expect(tagRepo.save).toHaveBeenCalledTimes(SEED_BEHAVIOR_TAGS.length);
  });
});
