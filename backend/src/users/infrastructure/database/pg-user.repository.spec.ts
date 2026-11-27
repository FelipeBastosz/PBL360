import { QueryFailedError } from 'typeorm';
import { ConflictError } from '@/shared/errors/application.error';
import { User } from '../../domain/entities/user.entity';
import { UserType } from '../../domain/enums/user-type.enum';
import { PgUserRepository } from './pg-user.repository';

describe('PgUserRepository', () => {
  const row = {
    id: 'u1',
    name: 'Tutor',
    email: 'tutor@uefs.br',
    passwordHash: 'hash',
    registrationNumber: null,
    hasPhoto: false,
    type: UserType.TUTOR,
    active: true,
    tokenVersion: 2,
    createdAt: new Date('2026-01-01T00:00:00Z'),
  };
  const makeUser = (
    id?: string,
    pendingPhoto: { content: Buffer; mimeType: string } | null = null,
  ) =>
    Object.assign(new User(), {
      id,
      name: 'Tutor',
      email: 'tutor@uefs.br',
      passwordHash: 'hash',
      registrationNumber: null,
      type: UserType.TUTOR,
      active: false,
      tokenVersion: 0,
      pendingPhoto,
    });
  const setup = () => {
    const manager = { query: jest.fn() };
    const transaction = jest.fn(async (operation: (manager: never) => Promise<unknown>) =>
      operation(manager as never),
    );
    const create = jest.fn((input: unknown) => input);
    const repository = new PgUserRepository({ create, manager: { transaction } } as never);
    return { repository, manager, transaction, create };
  };

  it('searches tutors and finds users by email or id', async () => {
    const searchResults = [{ id: 'u1', name: 'Tutor', email: 'tutor@uefs.br' }];
    const { repository } = setup();
    const query = jest
      .fn()
      .mockResolvedValueOnce(searchResults)
      .mockResolvedValueOnce([row])
      .mockResolvedValueOnce([]);
    (repository as unknown as { users: { query: typeof query } }).users.query = query;

    await expect(repository.searchTutors('tutor')).resolves.toEqual(searchResults);
    await expect(repository.findByEmail('tutor@uefs.br')).resolves.toMatchObject({
      id: 'u1',
      hasPhoto: false,
    });
    await expect(repository.findById('missing')).resolves.toBeNull();
    expect(query).toHaveBeenNthCalledWith(1, expect.stringContaining("type = 'TUTOR'"), ['tutor']);
    expect(query).toHaveBeenNthCalledWith(2, expect.stringContaining('WHERE email = $1'), [
      'tutor@uefs.br',
    ]);
    expect(query).toHaveBeenNthCalledWith(3, expect.stringContaining('WHERE id = $1'), ['missing']);
  });

  it('updates names and reports missing users', async () => {
    const { repository, create } = setup();
    const query = jest
      .fn()
      .mockResolvedValueOnce([[row], 1])
      .mockResolvedValueOnce([[], 0]);
    (repository as unknown as { users: { query: typeof query } }).users.query = query;

    await expect(repository.updateName('u1', 'Novo nome')).resolves.toMatchObject({ id: 'u1' });
    expect(create).toHaveBeenCalledWith(row);
    await expect(repository.updateName('missing', 'Novo nome')).rejects.toThrow(
      'User missing not found.',
    );
  });

  it('inserts new users, updates existing users and persists pending photos', async () => {
    const { repository, manager } = setup();
    manager.query.mockResolvedValueOnce([row]);
    await expect(repository.save(makeUser())).resolves.toMatchObject({ id: 'u1', hasPhoto: false });
    expect(manager.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO users'), [
      'Tutor',
      'tutor@uefs.br',
      'hash',
      null,
      UserType.TUTOR,
      false,
      0,
    ]);

    manager.query.mockResolvedValueOnce([[row], 1]);
    await expect(repository.save(makeUser('u1'))).resolves.toMatchObject({ id: 'u1' });
    expect(manager.query).toHaveBeenLastCalledWith(expect.stringContaining('UPDATE users'), [
      'u1',
      'Tutor',
      'tutor@uefs.br',
      'hash',
      null,
      UserType.TUTOR,
      false,
      0,
    ]);

    const content = Buffer.from('photo');
    manager.query.mockResolvedValueOnce([row]).mockResolvedValueOnce(undefined);
    await expect(
      repository.save(makeUser(undefined, { content, mimeType: 'image/png' })),
    ).resolves.toMatchObject({ hasPhoto: true });
    expect(manager.query).toHaveBeenLastCalledWith(
      expect.stringContaining('INSERT INTO user_photos'),
      ['u1', content, 'image/png'],
    );
  });

  it('validates the current term and saves the user acceptance transactionally', async () => {
    const { repository, manager } = setup();
    manager.query
      .mockResolvedValueOnce([{ id: 'term1' }])
      .mockResolvedValueOnce([row])
      .mockResolvedValueOnce(undefined);

    await expect(
      repository.saveWithTermAcceptance(makeUser(), 'term1', '1.2'),
    ).resolves.toMatchObject({ id: 'u1' });
    expect(manager.query).toHaveBeenNthCalledWith(1, expect.stringContaining('is_current = TRUE'), [
      'term1',
      '1.2',
    ]);
    expect(manager.query).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('INSERT INTO user_term_acceptances'),
      ['u1', 'term1', '1.2'],
    );

    manager.query.mockResolvedValueOnce([]);
    await expect(repository.saveWithTermAcceptance(makeUser(), 'term1', 'old')).rejects.toThrow(
      new ConflictError('A versão dos termos enviada não corresponde à versão vigente.'),
    );
  });

  it('translates known unique constraints and rethrows unrelated transaction failures', async () => {
    const emailError = new QueryFailedError('insert', [], {
      code: '23505',
      constraint: 'uq_users_email',
    });
    const { repository, transaction } = setup();
    transaction.mockRejectedValueOnce(emailError);
    await expect(repository.save(makeUser())).rejects.toThrow(
      new ConflictError('Já existe uma conta cadastrada com este e-mail.'),
    );

    const unexpected = new Error('database unavailable');
    transaction.mockRejectedValueOnce(unexpected);
    await expect(repository.save(makeUser())).rejects.toBe(unexpected);
  });
});
