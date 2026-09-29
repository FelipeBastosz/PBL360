import type { DataSource, Repository } from 'typeorm';
import { PerformanceTable } from '@/performance-tables/domain/entities/performance-table.entity';
import { CriterionCategory } from '@/performance-tables/domain/enums/criterion-category.enum';
import { User } from '@/users/domain/entities/user.entity';
import {
  SEED_PERFORMANCE_TABLES,
  seedAllPerformanceTables,
  seedPerformanceTable,
} from './performance-tables.seed';

describe('performance-tables.seed', () => {
  let userRepo: jest.Mocked<Pick<Repository<User>, 'findOneBy'>>;
  let tableRepo: jest.Mocked<Pick<Repository<PerformanceTable>, 'findOneBy' | 'save'>>;
  let dataSource: DataSource;

  beforeEach(() => {
    userRepo = { findOneBy: jest.fn() };
    tableRepo = { findOneBy: jest.fn(), save: jest.fn() };
    dataSource = {
      getRepository: jest
        .fn()
        .mockImplementation((entity: unknown) => (entity === User ? userRepo : tableRepo)),
    } as unknown as DataSource;
  });

  it('creates a table with criteria in the three categories', async () => {
    userRepo.findOneBy.mockResolvedValueOnce(Object.assign(new User(), { id: 'tutor-1' }));
    tableRepo.findOneBy.mockResolvedValueOnce(null);

    const created = await seedPerformanceTable(SEED_PERFORMANCE_TABLES[0]!, dataSource);

    const saved = tableRepo.save.mock.calls[0]![0] as PerformanceTable;
    expect(created).toBe(true);
    expect(saved.tutorId).toBe('tutor-1');
    expect(saved.criteria).toHaveLength(6);
    expect(new Set(saved.criteria.map((criterion) => criterion.category))).toEqual(
      new Set(Object.values(CriterionCategory)),
    );
  });

  it('skips a table that already exists', async () => {
    userRepo.findOneBy.mockResolvedValueOnce(Object.assign(new User(), { id: 'tutor-1' }));
    tableRepo.findOneBy.mockResolvedValueOnce(new PerformanceTable());

    const created = await seedPerformanceTable(SEED_PERFORMANCE_TABLES[0]!, dataSource);

    expect(created).toBe(false);
    expect(tableRepo.save).not.toHaveBeenCalled();
  });

  it('skips a table whose tutor does not exist', async () => {
    userRepo.findOneBy.mockResolvedValueOnce(null);

    const created = await seedPerformanceTable(SEED_PERFORMANCE_TABLES[0]!, dataSource);

    expect(created).toBe(false);
    expect(tableRepo.save).not.toHaveBeenCalled();
  });

  it('seeds every configured table', async () => {
    userRepo.findOneBy.mockResolvedValue(Object.assign(new User(), { id: 'tutor-1' }));
    tableRepo.findOneBy.mockResolvedValue(null);

    await seedAllPerformanceTables(dataSource);

    expect(tableRepo.save).toHaveBeenCalledTimes(SEED_PERFORMANCE_TABLES.length);
  });
});
