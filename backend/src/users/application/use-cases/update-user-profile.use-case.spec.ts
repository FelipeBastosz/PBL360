import { NotFoundError } from '@/shared/errors/application.error';
import { User } from '../../domain/entities/user.entity';
import { UserType } from '../../domain/enums/user-type.enum';
import { InvalidUserError } from '../../domain/errors/invalid-user.error';
import type { UserRepository } from '../../domain/repositories/user.repository';
import { UpdateUserProfileUseCase } from './update-user-profile.use-case';

describe('UpdateUserProfileUseCase', () => {
  let useCase: UpdateUserProfileUseCase;
  let usersRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    usersRepository = {
      searchTutors: jest.fn(),
      findByEmail: jest.fn(),
      findById: jest.fn(),
      updateName: jest.fn(),
      save: jest.fn(),
    };
    useCase = new UpdateUserProfileUseCase(usersRepository);
  });

  it('updates the user name and saves in repository', async () => {
    const user = new User();
    user.id = 'user-1';
    user.name = 'Nome Antigo';
    user.email = 'prof@uefs.br';
    user.type = UserType.TUTOR;

    usersRepository.findById.mockResolvedValue(user);
    usersRepository.updateName.mockImplementation((userId, name) => {
      user.name = name;
      return Promise.resolve(user);
    });

    const result = await useCase.execute({ userId: 'user-1', name: 'Nome Atualizado' });

    expect(result.name).toBe('Nome Atualizado');
    expect(usersRepository.updateName).toHaveBeenCalledWith('user-1', 'Nome Atualizado');
    expect(usersRepository.save).not.toHaveBeenCalled();
  });

  it('throws NotFoundError when user is not found', async () => {
    usersRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ userId: 'missing-user', name: 'Qualquer Nome' }),
    ).rejects.toThrow(NotFoundError);
  });

  it('rejects invalid names according to user entity rules', async () => {
    const user = new User();
    user.id = 'user-1';
    user.name = 'Nome Antigo';
    user.email = 'prof@uefs.br';
    user.type = UserType.TUTOR;

    usersRepository.findById.mockResolvedValue(user);

    await expect(useCase.execute({ userId: 'user-1', name: 'ab' })).rejects.toThrow(
      InvalidUserError,
    );
    expect(usersRepository.updateName).not.toHaveBeenCalled();
    expect(usersRepository.save).not.toHaveBeenCalled();
  });
});
