import type { DataSource, Repository } from 'typeorm';
import { DEFAULT_PASSWORD, runSeed, seedUser } from './seed';
import { SEED_USERS } from './seed-users';

const TEST_ENV = { NODE_ENV: 'test', BCRYPT_ROUNDS: '4' };
import { BehaviorTag } from '@/behavior-tags/domain/entities/behavior-tag.entity';
import { User } from '@/users/domain/entities/user.entity';
import { UserPhoto } from '@/users/domain/entities/user-photo.entity';
import { UserType } from '@/users/domain/enums/user-type.enum';

describe('seed.ts', () => {
  let mockUserRepo: jest.Mocked<Pick<Repository<User>, 'findOneBy' | 'save'>>;
  let mockPhotoRepo: jest.Mocked<Pick<Repository<UserPhoto>, 'save'>>;
  let mockTagRepo: jest.Mocked<Pick<Repository<BehaviorTag>, 'findOneBy' | 'save'>>;
  let mockDataSource: jest.Mocked<Pick<DataSource, 'getRepository' | 'initialize' | 'destroy'>> & {
    isInitialized: boolean;
  };

  beforeEach(() => {
    mockUserRepo = {
      findOneBy: jest.fn(),
      save: jest.fn(),
    };
    mockPhotoRepo = { save: jest.fn() };
    mockTagRepo = { findOneBy: jest.fn().mockResolvedValue(null), save: jest.fn() };

    mockDataSource = {
      isInitialized: false,
      getRepository: jest.fn().mockImplementation((entity: unknown) => {
        if (entity === UserPhoto) return mockPhotoRepo;
        if (entity === BehaviorTag) return mockTagRepo;
        return mockUserRepo;
      }),
      initialize: jest.fn().mockImplementation(() => {
        mockDataSource.isInitialized = true;
        return Promise.resolve();
      }),
      destroy: jest.fn().mockImplementation(() => {
        mockDataSource.isInitialized = false;
        return Promise.resolve();
      }),
    };
  });

  describe('seedUser', () => {
    it('creates a new user when email is not present in database', async () => {
      mockUserRepo.findOneBy.mockResolvedValueOnce(null);
      mockUserRepo.save.mockResolvedValueOnce(new User());

      const data = SEED_USERS[0]!;
      const result = await seedUser(
        data,
        'hashed-password',
        mockDataSource as unknown as DataSource,
      );

      expect(result).toBe(true);
      expect(mockUserRepo.findOneBy).toHaveBeenCalledWith({ email: data.email });
      expect(mockUserRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          name: data.name,
          email: data.email,
          type: UserType.TUTOR,
        }),
      );
    });

    it('stores a placeholder photo for every seeded student', async () => {
      mockUserRepo.findOneBy.mockResolvedValueOnce(null);
      mockUserRepo.save.mockResolvedValueOnce(Object.assign(new User(), { id: 'student-1' }));

      await seedUser(SEED_USERS[2]!, 'hashed-password', mockDataSource as unknown as DataSource);

      expect(mockPhotoRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'student-1', mimeType: 'image/png' }),
      );
    });

    it('stores no photo for a tutor', async () => {
      mockUserRepo.findOneBy.mockResolvedValueOnce(null);
      mockUserRepo.save.mockResolvedValueOnce(new User());

      await seedUser(SEED_USERS[0]!, 'hashed-password', mockDataSource as unknown as DataSource);

      expect(mockPhotoRepo.save).not.toHaveBeenCalled();
    });

    it('skips creation when email is already registered', async () => {
      mockUserRepo.findOneBy.mockResolvedValueOnce(new User());

      const data = SEED_USERS[2]!;
      const result = await seedUser(
        data,
        'hashed-password',
        mockDataSource as unknown as DataSource,
      );

      expect(result).toBe(false);
      expect(mockUserRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('runSeed', () => {
    it('initializes data source, seeds all users, and destroys connection', async () => {
      mockUserRepo.findOneBy.mockResolvedValue(null);
      mockUserRepo.save.mockResolvedValue(new User());

      await runSeed(mockDataSource as unknown as DataSource, TEST_ENV);

      expect(mockDataSource.initialize).toHaveBeenCalled();
      expect(mockUserRepo.save).toHaveBeenCalledTimes(SEED_USERS.length);
      expect(mockDataSource.destroy).toHaveBeenCalled();
    });

    it('does not re-initialize or destroy if data source is already initialized', async () => {
      mockDataSource.isInitialized = true;
      mockUserRepo.findOneBy.mockResolvedValue(null);
      mockUserRepo.save.mockResolvedValue(new User());

      await runSeed(mockDataSource as unknown as DataSource, TEST_ENV);

      expect(mockDataSource.initialize).not.toHaveBeenCalled();
      expect(mockDataSource.destroy).not.toHaveBeenCalled();
    });

    it('refuses to run in production', async () => {
      await expect(
        runSeed(mockDataSource as unknown as DataSource, { NODE_ENV: 'production' }),
      ).rejects.toThrow('never runs in production');

      expect(mockDataSource.initialize).not.toHaveBeenCalled();
    });

    it('destroys the connection even when seeding a user fails', async () => {
      mockUserRepo.findOneBy.mockRejectedValue(new Error('connection lost'));

      await expect(runSeed(mockDataSource as unknown as DataSource, TEST_ENV)).rejects.toThrow(
        'connection lost',
      );

      expect(mockDataSource.destroy).toHaveBeenCalled();
    });
  });

  describe('SEED_USERS constants', () => {
    it('contains default password and initial users for tutors and students', () => {
      expect(DEFAULT_PASSWORD).toBe('senha-secreta');
      expect(SEED_USERS.length).toBeGreaterThanOrEqual(4);

      const tutors = SEED_USERS.filter((u) => u.type === UserType.TUTOR);
      const students = SEED_USERS.filter((u) => u.type === UserType.STUDENT);

      expect(tutors.length).toBeGreaterThan(0);
      expect(students.length).toBeGreaterThan(0);
    });
  });
});
