import type { Repository } from 'typeorm';
import { PgUserRepository } from './pg-user.repository';
import { User } from '../../domain/entities/user.entity';
import { UserType } from '../../domain/enums/user-type.enum';

describe('PgUserRepository', () => {
  let repository: PgUserRepository;
  let usersMock: jest.Mocked<Pick<Repository<User>, 'query' | 'create'>>;

  const rowMock = {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    name: 'Felipe Bastos',
    email: 'felipe@uefs.br',
    passwordHash: 'hashed_password',
    registrationNumber: '20201010',
    photoUrl: null,
    type: UserType.STUDENT,
    active: true,
    createdAt: new Date(),
  };

  const buildUser = (): User => {
    const user = new User();
    user.name = rowMock.name;
    user.email = rowMock.email;
    user.passwordHash = rowMock.passwordHash;
    user.registrationNumber = rowMock.registrationNumber;
    user.photoUrl = rowMock.photoUrl;
    user.type = UserType.STUDENT;
    return user;
  };

  const lastCall = (): [string, unknown[]] =>
    usersMock.query.mock.calls.at(-1) as unknown as [string, unknown[]];

  beforeEach(() => {
    usersMock = {
      query: jest.fn(),
      create: jest.fn((row: unknown) => Object.assign(new User(), row)),
    } as unknown as jest.Mocked<Pick<Repository<User>, 'query' | 'create'>>;

    repository = new PgUserRepository(usersMock as unknown as Repository<User>);
  });

  describe('findByEmail', () => {
    it('should hydrate a User from the returned row', async () => {
      usersMock.query.mockResolvedValueOnce([rowMock]);

      const result = await repository.findByEmail(rowMock.email);

      expect(lastCall()[0]).toContain('WHERE email = $1');
      expect(lastCall()[1]).toEqual([rowMock.email]);
      expect(result).toBeInstanceOf(User);
      expect(result?.passwordHash).toBe(rowMock.passwordHash);
      expect(result?.registrationNumber).toBe(rowMock.registrationNumber);
      expect(result?.isStudent()).toBe(true);
    });

    it('should return null when user is not found', async () => {
      usersMock.query.mockResolvedValueOnce([]);

      expect(await repository.findByEmail('unknown@uefs.br')).toBeNull();
    });
  });

  describe('findById', () => {
    it('should hydrate a User from the returned row', async () => {
      usersMock.query.mockResolvedValueOnce([rowMock]);

      const result = await repository.findById(rowMock.id);

      expect(lastCall()[0]).toContain('WHERE id = $1');
      expect(lastCall()[1]).toEqual([rowMock.id]);
      expect(result?.id).toBe(rowMock.id);
    });

    it('should return null when user is not found', async () => {
      usersMock.query.mockResolvedValueOnce([]);

      expect(await repository.findById('random-id')).toBeNull();
    });
  });

  describe('save, on a user without id', () => {
    it('should insert and return the persisted User', async () => {
      usersMock.query.mockResolvedValueOnce([rowMock]);
      const newUser = buildUser();
      newUser.active = true;

      const result = await repository.save(newUser);

      const [sql, params] = lastCall();
      expect(sql).toContain('INSERT INTO users');
      expect(sql).not.toContain('UPDATE users');
      expect(params).toEqual([
        newUser.name,
        newUser.email,
        newUser.passwordHash,
        newUser.registrationNumber,
        newUser.photoUrl,
        newUser.type,
        true,
      ]);
      expect(result).toBeInstanceOf(User);
      expect(result.id).toBe(rowMock.id);
    });

    it('should let the column default apply when active is unset', async () => {
      usersMock.query.mockResolvedValueOnce([rowMock]);

      await repository.save(buildUser());

      const [sql, params] = lastCall();
      expect(sql).toContain('COALESCE($7, TRUE)');
      expect(params[6]).toBeUndefined();
    });

    it('should throw when the insert returns no row', async () => {
      usersMock.query.mockResolvedValueOnce([]);

      await expect(repository.save(buildUser())).rejects.toThrow(
        'Failed to persist user in database.',
      );
    });
  });

  describe('save, on a user that already has an id', () => {
    const updateResult = (rows: unknown[]): [unknown[], number] => [rows, rows.length];

    const buildStoredUser = (): User => {
      const user = buildUser();
      user.id = rowMock.id;
      user.active = true;
      return user;
    };

    it('should update instead of inserting a duplicate', async () => {
      usersMock.query.mockResolvedValueOnce(updateResult([rowMock]));

      const result = await repository.save(buildStoredUser());

      const [sql, params] = lastCall();
      expect(sql).toContain('UPDATE users');
      expect(sql).not.toContain('INSERT INTO users');
      expect(sql).toContain('WHERE id = $1');
      expect(params[0]).toBe(rowMock.id);
      expect(result).toBeInstanceOf(User);
      expect(result.id).toBe(rowMock.id);
      expect(result.name).toBe(rowMock.name);
      expect(result.isStudent()).toBe(true);
    });

    it('should carry the changed fields into the statement', async () => {
      usersMock.query.mockResolvedValueOnce(updateResult([rowMock]));
      const stored = buildStoredUser();
      stored.name = 'Felipe Bastos Souza';
      stored.deactivate();

      await repository.save(stored);

      const [, params] = lastCall();
      expect(params).toEqual([
        rowMock.id,
        'Felipe Bastos Souza',
        stored.email,
        stored.passwordHash,
        stored.registrationNumber,
        stored.photoUrl,
        stored.type,
        false,
      ]);
    });

    it('should throw when no row matches the id', async () => {
      usersMock.query.mockResolvedValueOnce(updateResult([]));

      await expect(repository.save(buildStoredUser())).rejects.toThrow(
        `User ${rowMock.id} not found.`,
      );
    });
  });
});
