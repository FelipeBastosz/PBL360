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

  const provideReviewUsers = () => {
    mockUserRepo.findOneBy
      .mockResolvedValueOnce(Object.assign(new User(), { id: 'tutor-1' }))
      .mockResolvedValueOnce(Object.assign(new User(), { id: 'tutor-2' }))
      .mockResolvedValueOnce(Object.assign(new User(), { id: 'student-1' }))
      .mockResolvedValueOnce(Object.assign(new User(), { id: 'student-2' }));
  };

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
      if (sql.includes('FROM behavior_tags')) {
        return Promise.resolve([
          { id: 'tag-1', name: 'Liderança e Proatividade' },
          { id: 'tag-2', name: 'Síntese e Clareza' },
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

  it('reuses existing room, problem and sessions when already seeded', async () => {
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

    mockDataSource.query.mockImplementation((sql: string) => {
      if (sql.includes('SELECT id FROM rooms')) return Promise.resolve([{ id: 'existing-room' }]);
      if (sql.includes('FROM performance_tables')) return Promise.resolve([{ id: 'table-1' }]);
      if (sql.includes('SELECT id FROM problems')) {
        return Promise.resolve([{ id: 'existing-problem' }]);
      }
      if (sql.includes('SELECT id FROM sessions')) {
        return Promise.resolve([{ id: 'existing-session' }]);
      }
      if (sql.includes('SELECT id FROM formulas')) return Promise.resolve([{ id: 'formula-1' }]);
      if (sql.includes('SELECT id FROM observations')) return Promise.resolve([{ id: 'obs-1' }]);
      if (sql.includes('SELECT id FROM feedback')) return Promise.resolve([{ id: 'fb-1' }]);
      return Promise.resolve([]);
    });

    await seedReviewData(mockDataSource as unknown as DataSource);

    expect(mockDataSource.query).not.toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO rooms'),
      expect.anything(),
    );
    expect(mockDataSource.query).not.toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO sessions'),
      expect.anything(),
    );
  });

  it.each([
    {
      route: 'the review table is unavailable',
      query: (sql: string, _params?: unknown[]) => {
        if (sql.includes('SELECT id FROM problems')) return Promise.resolve([{ id: 'problem-1' }]);
        if (sql.includes('FROM performance_tables')) return Promise.resolve([]);
        return Promise.resolve([]);
      },
      error: 'A tabela Barema PBL não está disponível para a turma.',
    },
    {
      route: 'the review problem insert returns no id',
      query: (sql: string, _params?: unknown[]) => {
        if (sql.includes('SELECT id FROM problems')) return Promise.resolve([]);
        if (sql.includes('INSERT INTO problems')) return Promise.resolve([]);
        return Promise.resolve([]);
      },
      error: 'Falha ao criar o problema de revisão.',
    },
    {
      route: 'the review session insert returns no id',
      query: (sql: string, _params?: unknown[]) => {
        if (sql.includes('SELECT id FROM problems')) return Promise.resolve([{ id: 'problem-1' }]);
        if (sql.includes('FROM performance_tables')) return Promise.resolve([{ id: 'table-1' }]);
        if (sql.includes('SELECT id FROM sessions')) return Promise.resolve([]);
        if (sql.includes('INSERT INTO sessions')) return Promise.resolve([]);
        return Promise.resolve([]);
      },
      error: 'Falha ao criar uma sessão de revisão.',
    },
    {
      route: 'the default session formula insert returns no id',
      query: (sql: string, _params?: unknown[]) => {
        if (sql.includes('SELECT id FROM problems')) return Promise.resolve([{ id: 'problem-1' }]);
        if (sql.includes('FROM performance_tables')) return Promise.resolve([{ id: 'table-1' }]);
        if (sql.includes('SELECT id FROM sessions')) return Promise.resolve([]);
        if (sql.includes('INSERT INTO sessions')) return Promise.resolve([{ id: 'session-1' }]);
        if (sql.includes('SELECT id FROM formulas')) return Promise.resolve([]);
        if (sql.includes('INSERT INTO formulas')) return Promise.resolve([]);
        return Promise.resolve([]);
      },
      error: 'Falha ao criar a fórmula padrão da sessão de revisão.',
    },
  ])('reports setup errors when $route', async ({ query, error }) => {
    provideReviewUsers();
    mockDataSource.query.mockImplementation((sql: string, params?: unknown[]) => {
      if (sql.includes('SELECT id FROM rooms')) return Promise.resolve([{ id: 'room-1' }]);
      if (sql.includes('INSERT INTO room_tutors') || sql.includes('INSERT INTO room_students'))
        return Promise.resolve([]);
      return query(sql, params);
    });

    await expect(seedReviewData(mockDataSource as unknown as DataSource)).rejects.toThrow(error);
  });
});
