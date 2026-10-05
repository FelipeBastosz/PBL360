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

    mockDataSource.query
      .mockResolvedValueOnce([]) // select room -> none
      .mockResolvedValueOnce([{ id: 'room-1' }]) // insert room
      .mockResolvedValueOnce([]) // insert room_tutors
      .mockResolvedValueOnce([]) // insert room_students
      .mockResolvedValueOnce([{ id: 'table-1' }]) // select table
      .mockResolvedValueOnce([]) // select problem -> none
      .mockResolvedValueOnce([{ id: 'problem-1' }]) // insert problem
      .mockResolvedValueOnce([]) // select session 1 -> none
      .mockResolvedValueOnce([{ id: 'sess-1' }]) // insert session 1
      .mockResolvedValueOnce([]) // select session 2 -> none
      .mockResolvedValueOnce([{ id: 'sess-2' }]) // insert session 2
      .mockResolvedValueOnce([]) // insert session_roles 1
      .mockResolvedValueOnce([]) // insert session_roles 2
      .mockResolvedValueOnce([]) // select feedbacks -> none
      .mockResolvedValueOnce([]) // insert session feedbacks
      .mockResolvedValueOnce([]) // insert student feedbacks
      .mockResolvedValueOnce([]); // insert general feedback

    await seedReviewData(mockDataSource as unknown as DataSource);

    expect(mockDataSource.query).toHaveBeenCalled();
  });
});
