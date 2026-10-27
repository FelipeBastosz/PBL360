import { NotFoundError } from '@/shared/errors/application.error';
import { User } from '../../domain/entities/user.entity';
import { UserType } from '../../domain/enums/user-type.enum';
import type { UserRepository } from '../../domain/repositories/user.repository';
import { GetUserProfileUseCase } from './get-user-profile.use-case';

describe('GetUserProfileUseCase', () => {
  let useCase: GetUserProfileUseCase;
  let usersRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    usersRepository = {
      searchTutors: jest.fn(),
      findByEmail: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
    };
    useCase = new GetUserProfileUseCase(usersRepository);
  });

  it('returns the user when found', async () => {
    const user = new User();
    user.id = 'user-1';
    user.name = 'Aluno Exemplo';
    user.email = 'aluno@discente.uefs.br';
    user.type = UserType.STUDENT;

    usersRepository.findById.mockResolvedValue(user);

    const result = await useCase.execute({ userId: 'user-1' });

    expect(result).toBe(user);
    expect(usersRepository.findById).toHaveBeenCalledWith('user-1');
  });

  it('throws NotFoundError when user does not exist', async () => {
    usersRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute({ userId: 'missing-user' })).rejects.toThrow(NotFoundError);
    await expect(useCase.execute({ userId: 'missing-user' })).rejects.toThrow(
      'Usuário não encontrado.',
    );
  });
});
