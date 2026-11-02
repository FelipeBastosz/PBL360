import type { DataSource, Repository } from 'typeorm';
import { User } from '@/users/domain/entities/user.entity';
import { seedReviewData } from './review.seed';

describe('review.seed.ts', () => {
  let mockUserRepo: jest.Mocked<Pick<Repository<User>, 'findOneBy'>>;
  let mockDataSource: jest.Mocked<Pick<DataSource, 'getRepository' | 'query'>>;

  beforeEach(() => {
    mockUserRepo = {
      findOneBy: jest.fn(),
    };

    mockDataSource = {
      getRepository: jest.fn().mockReturnValue(mockUserRepo),
      query: jest.fn(),
    };
  });

  it('skips seeding if review users do not exist yet', async () => {
    mockUserRepo.findOneBy.mockResolvedValue(null);

    await seedReviewData(mockDataSource as unknown as DataSource);

    expect(mockDataSource.query).not.toHaveBeenCalled();
  });

  it('seeds room, problem, sessions, roles and feedbacks idempotently', async () => {
    const mockTutor = Object.assign(new User(), { id: 'tutor-carlos', email: 'carlos@uefs.br' });
    const mockCoTutor = Object.assign(new User(), { id: 'tutor-maria', email: 'maria@uefs.br' });
    const mockStudent1 = Object.assign(new User(), {
      id: 'student-ana',
      email: '20240001@discente.uefs.br',
    });
    const mockStudent2 = Object.assign(new User(), {
      id: 'student-joao',
      email: '20240002@discente.uefs.br',
    });

    mockUserRepo.findOneBy
      .mockResolvedValueOnce(mockTutor)
      .mockResolvedValueOnce(mockCoTutor)
      .mockResolvedValueOnce(mockStudent1)
      .mockResolvedValueOnce(mockStudent2);

    mockDataSource.query.mockImplementation((sql: string, params?: unknown[]) => {
      if (sql.includes('SELECT id FROM rooms')) return Promise.resolve([]);
      if (sql.includes('INSERT INTO rooms')) return Promise.resolve([{ id: 'room-1' }]);
      if (sql.includes('FROM performance_tables')) return Promise.resolve([{ id: 'table-1' }]);
      if (sql.includes('SELECT id FROM problems')) return Promise.resolve([]);
      if (sql.includes('INSERT INTO problems')) return Promise.resolve([{ id: 'problem-1' }]);
      if (sql.includes('SELECT id FROM sessions')) return Promise.resolve([]);
      if (sql.includes('INSERT INTO sessions')) {
        const order = (params as unknown[])?.[4];
        return Promise.resolve([{ id: `sess-${String(order)}` }]);
      }
      if (sql.includes('INSERT INTO formulas')) return Promise.resolve([{ id: 'formula-1' }]);
      if (sql.includes('SELECT id, nome FROM behavior_tags')) {
        return Promise.resolve([
          { id: 'tag-1', nome: 'Liderança e Proatividade' },
          { id: 'tag-2', nome: 'Síntese e Clareza' },
        ]);
      }
      if (sql.includes('SELECT id FROM observations')) return Promise.resolve([]);
      if (sql.includes('INSERT INTO observations')) return Promise.resolve([{ id: 'obs-1' }]);
      if (sql.includes('SELECT s.id AS session_id, pc.id')) {
        return Promise.resolve([
          { id: 'crit-1', session_id: 'sess-1' },
          { id: 'crit-2', session_id: 'sess-1' },
          { id: 'crit-1', session_id: 'sess-2' },
          { id: 'crit-2', session_id: 'sess-2' },
        ]);
      }
      if (sql.includes('SELECT id FROM feedback')) return Promise.resolve([]);
      return Promise.resolve([]);
    });

    await seedReviewData(mockDataSource as unknown as DataSource, ['extra@discente.uefs.br']);

    expect(mockDataSource.query).toHaveBeenCalled();
    expect(mockDataSource.query).toHaveBeenCalledWith(expect.stringContaining('email = ANY($4)'), [
      'room-1',
      'student-ana',
      'student-joao',
      ['extra@discente.uefs.br'],
    ]);
    expect(mockDataSource.query).toHaveBeenCalledWith(
      expect.stringContaining('VALUES ($1, $7, $2, $3, $4, $5, $6)'),
      [
        'problem-1',
        'Sessão 1 - Abertura',
        'Sessão 1 - Abertura',
        '2026-10-01',
        1,
        'concluida',
        'table-1',
      ],
    );
    expect(mockDataSource.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO attendances'),
      expect.any(Array),
    );
    expect(mockDataSource.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO criterion_grades'),
      expect.any(Array),
    );
  });
});
