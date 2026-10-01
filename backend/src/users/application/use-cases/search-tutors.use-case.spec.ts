import { InvalidRequestError } from '@/shared/errors/application.error';
import type { UserRepository } from '../../domain/repositories/user.repository';
import { SearchTutorsUseCase } from './search-tutors.use-case';

describe('SearchTutorsUseCase', () => {
  let users: jest.Mocked<UserRepository>;
  let useCase: SearchTutorsUseCase;

  beforeEach(() => {
    users = {
      searchTutors: jest.fn(),
      findByEmail: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
    };
    useCase = new SearchTutorsUseCase(users);
  });

  it('searches tutors with the trimmed query', async () => {
    const tutors = [{ id: 'tutor-1', name: 'Ana', email: 'ana@uefs.br' }];
    users.searchTutors.mockResolvedValue(tutors);
    await expect(useCase.execute('  ana@uefs.br  ')).resolves.toEqual(tutors);
    expect(users.searchTutors).toHaveBeenCalledWith('ana@uefs.br');
  });

  it.each(['', '  ', 'ab', ' a ', 'a'.repeat(161)])('rejects invalid query %p', async (query) => {
    await expect(useCase.execute(query)).rejects.toBeInstanceOf(InvalidRequestError);
    expect(users.searchTutors).not.toHaveBeenCalled();
  });

  it('returns an empty list when no tutor matches', async () => {
    users.searchTutors.mockResolvedValue([]);
    await expect(useCase.execute('missing')).resolves.toEqual([]);
  });

  it('does not expose extra fields from the repository', async () => {
    const tutor = { id: 'tutor-1', name: 'Ana', email: 'ana@uefs.br', passwordHash: 'secret' };
    users.searchTutors.mockResolvedValue([tutor]);
    await expect(useCase.execute('ana')).resolves.toEqual([
      { id: 'tutor-1', name: 'Ana', email: 'ana@uefs.br' },
    ]);
  });
});
