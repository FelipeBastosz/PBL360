import { Test, type TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { AppModule } from '@/app.module';
import { ConflictError } from '@/shared/errors/application.error';
import { User } from '@/users/domain/entities/user.entity';
import { UserType } from '@/users/domain/enums/user-type.enum';
import { buildPhoto, pngPhotoBytes } from '@/users/testing/photo-fixtures';
import { type UserRepository, USER_REPOSITORY } from '@/users/domain/repositories/user.repository';

const MISSING_ID = '00000000-0000-0000-0000-000000000000';

describe('User repository (e2e)', () => {
  let moduleRef: TestingModule;
  let repository: UserRepository;
  let dataSource: DataSource;

  const buildUser = (): User => {
    const user = new User();
    user.name = 'Ana Souza';
    user.email = 'ana@uefs.br';
    user.passwordHash = 'hashed_password';
    user.registrationNumber = '20240001';
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
    repository = moduleRef.get<UserRepository>(USER_REPOSITORY);
    dataSource = moduleRef.get(DataSource);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  beforeEach(async () => {
    await dataSource.query('TRUNCATE performance_criteria, performance_tables, users CASCADE;');
  });

  describe('save, on a user without id', () => {
    it('inserts the row and returns the generated id', async () => {
      const saved = await repository.save(buildUser());

      expect(saved.id).toHaveLength(36);
      expect(await countUsers()).toBe(1);
    });

    it('lets the column defaults fill what the entity leaves unset', async () => {
      const saved = await repository.save(buildUser());

      expect(saved.active).toBe(false);
      expect(saved.createdAt).toBeInstanceOf(Date);
      expect(saved.hasPhoto).toBe(false);
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
      duplicate.registrationNumber = '20240002';

      await expect(repository.save(duplicate)).rejects.toThrow(
        new ConflictError('Já existe uma conta cadastrada com este e-mail.'),
      );
      expect(await countUsers()).toBe(1);
    });

    it('rejects a duplicate registration number', async () => {
      await repository.save(buildUser());
      const duplicate = buildUser();
      duplicate.email = 'outra@discente.uefs.br';

      await expect(repository.save(duplicate)).rejects.toThrow(
        new ConflictError('Já existe uma conta cadastrada com esta matrícula.'),
      );
      expect(await countUsers()).toBe(1);
    });
  });

  describe('photo', () => {
    const storedPhotoOf = async (userId: string) => {
      const rows = await dataSource.query<{ content: Buffer; mimeType: string }[]>(
        'SELECT content, mime_type AS "mimeType" FROM user_photos WHERE user_id = $1;',
        [userId],
      );
      return rows[0];
    };

    it('stores the pending photo bytes with the new user', async () => {
      const user = Object.assign(buildUser(), { pendingPhoto: buildPhoto() });

      const saved = await repository.save(user);
      const stored = await storedPhotoOf(saved.id);

      expect(saved.hasPhoto).toBe(true);
      expect(stored?.mimeType).toBe('image/png');
      expect(stored?.content.equals(pngPhotoBytes())).toBe(true);
    });

    it('reports the stored photo on later lookups', async () => {
      const saved = await repository.save(
        Object.assign(buildUser(), { pendingPhoto: buildPhoto() }),
      );

      expect((await repository.findById(saved.id))?.hasPhoto).toBe(true);
    });

    it('keeps the photo when an unrelated field changes', async () => {
      const saved = await repository.save(
        Object.assign(buildUser(), { pendingPhoto: buildPhoto() }),
      );
      saved.name = 'Ana Souza Lima';

      const updated = await repository.save(saved);

      expect(updated.hasPhoto).toBe(true);
      expect(await storedPhotoOf(saved.id)).toBeDefined();
    });

    it('stores neither user nor photo when the user conflicts', async () => {
      await repository.save(buildUser());
      const duplicate = Object.assign(buildUser(), { pendingPhoto: buildPhoto() });
      duplicate.registrationNumber = '20240002';

      await expect(repository.save(duplicate)).rejects.toBeInstanceOf(ConflictError);

      const [{ total }] = await dataSource.query<[{ total: number }]>(
        'SELECT COUNT(*)::int AS total FROM user_photos;',
      );
      expect(total).toBe(0);
    });
  });

  describe('lookups', () => {
    it('maps every aliased column back onto the entity', async () => {
      const saved = await repository.save(buildUser());

      const found = await repository.findByEmail('ana@uefs.br');

      expect(found?.id).toBe(saved.id);
      expect(found?.passwordHash).toBe('hashed_password');
      expect(found?.registrationNumber).toBe('20240001');
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
