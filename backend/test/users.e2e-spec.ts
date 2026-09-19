import { Test, type TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { AppModule } from '@/app.module';
import { User } from '@/users/domain/entities/user.entity';
import { UserType } from '@/users/domain/enums/user-type.enum';
import {
  type IUserRepository,
  UserRepositoryToken,
} from '@/users/domain/repositories/user.repository.interface';

const MISSING_ID = '00000000-0000-0000-0000-000000000000';

describe('User repository (e2e)', () => {
  let moduleRef: TestingModule;
  let repository: IUserRepository;
  let dataSource: DataSource;

  const buildUser = (): User => {
    const user = new User();
    user.name = 'Ana Souza';
    user.email = 'ana@uefs.br';
    user.passwordHash = 'hashed_password';
    user.registrationNumber = '2024001';
    user.type = UserType.STUDENT;
    return user;
  };

  const countUsers = async (): Promise<number> => {
    const [{ total }] = await dataSource.query<[{ total: number }]>(
      'SELECT COUNT(*)::int AS total FROM users;',
    );
    return total;
  };

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    await moduleRef.init();
    repository = moduleRef.get<IUserRepository>(UserRepositoryToken);
    dataSource = moduleRef.get(DataSource);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  beforeEach(async () => {
    await dataSource.query('DELETE FROM users;');
  });

  describe('save, on a user without id', () => {
    it('inserts the row and returns the generated id', async () => {
      const saved = await repository.save(buildUser());

      expect(saved.id).toHaveLength(36);
      expect(await countUsers()).toBe(1);
    });

    it('lets the column defaults fill what the entity leaves unset', async () => {
      const saved = await repository.save(buildUser());

      expect(saved.active).toBe(true);
      expect(saved.createdAt).toBeInstanceOf(Date);
      expect(saved.photoUrl).toBeNull();
    });

    it('returns a hydrated entity, not a raw row', async () => {
      const saved = await repository.save(buildUser());

      expect(saved).toBeInstanceOf(User);
      expect(saved.isStudent()).toBe(true);
      expect(saved.isTutor()).toBe(false);
    });

    it('rejects a duplicate email', async () => {
      await repository.save(buildUser());
      const duplicate = buildUser();
      duplicate.registrationNumber = '2024002';

      await expect(repository.save(duplicate)).rejects.toThrow('uq_users_email');
      expect(await countUsers()).toBe(1);
    });
  });

  describe('lookups', () => {
    it('maps every aliased column back onto the entity', async () => {
      const saved = await repository.save(buildUser());

      const found = await repository.findByEmail('ana@uefs.br');

      expect(found?.id).toBe(saved.id);
      expect(found?.passwordHash).toBe('hashed_password');
      expect(found?.registrationNumber).toBe('2024001');
      expect(found?.createdAt).toBeInstanceOf(Date);
      expect(found?.isStudent()).toBe(true);
    });

    it('finds a stored user by id', async () => {
      const saved = await repository.save(buildUser());

      expect((await repository.findById(saved.id))?.email).toBe('ana@uefs.br');
    });

    it('returns null when nothing matches', async () => {
      expect(await repository.findByEmail('unknown@uefs.br')).toBeNull();
      expect(await repository.findById(MISSING_ID)).toBeNull();
    });
  });

  describe('save, on a user that already has an id', () => {
    it('updates the stored row instead of inserting a second one', async () => {
      const saved = await repository.save(buildUser());
      saved.name = 'Ana Souza Lima';
      saved.deactivate();

      const updated = await repository.save(saved);

      expect(updated.id).toBe(saved.id);
      expect(updated.name).toBe('Ana Souza Lima');
      expect(updated.active).toBe(false);
      expect(await countUsers()).toBe(1);
    });

    it('persists the change beyond the returned entity', async () => {
      const saved = await repository.save(buildUser());
      saved.name = 'Ana Souza Lima';

      await repository.save(saved);

      expect((await repository.findById(saved.id))?.name).toBe('Ana Souza Lima');
    });

    it('throws when no row matches the id', async () => {
      const ghost = await repository.save(buildUser());
      ghost.id = MISSING_ID;

      await expect(repository.save(ghost)).rejects.toThrow(`User ${MISSING_ID} not found.`);
    });
  });
});
