import type { EntityManager, Repository } from 'typeorm';
import { EmailVerificationCode } from '../../domain/entities/email-verification-code.entity';
import type { PasswordResetCode } from '../../domain/entities/password-reset-code.entity';
import { PgEmailVerificationCodeRepository } from './pg-email-verification-code.repository';
import { PgOneTimeCodeRepository } from './pg-one-time-code.repository';
import { PgPasswordResetCodeRepository } from './pg-password-reset-code.repository';

const callArgument = (calls: unknown[][], call: number, argument: number): unknown =>
  calls[call]![argument];

describe('Postgres one-time-code repositories', () => {
  const createRepository = () => {
    const manager = { query: jest.fn().mockResolvedValue(undefined) };
    const repository = {
      manager: {
        transaction: jest.fn(async (callback: (manager: EntityManager) => Promise<void>) =>
          callback(manager as unknown as EntityManager),
        ),
      },
      query: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
      create: jest.fn((row: unknown) => row),
    };

    return { manager, repository };
  };

  it('marks previous pending codes as used and inserts the replacement transactionally', async () => {
    const { manager, repository } = createRepository();
    const codes = new PgEmailVerificationCodeRepository(
      repository as unknown as Repository<EmailVerificationCode>,
    );
    const code = EmailVerificationCode.issue({
      userId: 'user-1',
      email: 'ana@example.com',
      code: '123456',
      expiresInMinutes: 10,
    });

    await codes.replacePendingFor(code);

    expect(repository.manager.transaction).toHaveBeenCalledTimes(1);
    expect(manager.query).toHaveBeenCalledTimes(2);
    const managerCalls = manager.query.mock.calls as unknown[][];
    expect(callArgument(managerCalls, 0, 0) as string).toContain('UPDATE email_verification_codes');
    expect(callArgument(managerCalls, 0, 1)).toEqual(['user-1']);
    expect(callArgument(managerCalls, 1, 0) as string).toContain(
      'INSERT INTO email_verification_codes',
    );
    expect(callArgument(managerCalls, 1, 1)).toEqual([
      code.id,
      code.userId,
      code.email,
      code.codeHash,
      code.expiresAt,
      code.createdAt,
    ]);
  });

  it('returns the newest pending code or null when none exists', async () => {
    const { repository } = createRepository();
    const codes = new PgEmailVerificationCodeRepository(
      repository as unknown as Repository<EmailVerificationCode>,
    );
    const row = {
      id: 'code-1',
      userId: 'user-1',
      email: 'ana@example.com',
      codeHash: 'hash',
      expiresAt: new Date(),
      createdAt: new Date(),
      usedAt: null,
      attempts: 0,
    };
    repository.query.mockResolvedValueOnce([row]).mockResolvedValueOnce([]);

    await expect(codes.findPendingByUserId('user-1')).resolves.toBe(row);
    await expect(codes.findPendingByUserId('user-1')).resolves.toBeNull();
    expect(repository.create).toHaveBeenCalledWith(row);
    expect(callArgument(repository.query.mock.calls as unknown[][], 0, 0) as string).toContain(
      'ORDER BY created_at DESC',
    );
  });

  it('reports whether an attempt was consumed and a code was marked used', async () => {
    const { repository } = createRepository();
    const codes = new PgEmailVerificationCodeRepository(
      repository as unknown as Repository<EmailVerificationCode>,
    );
    repository.query
      .mockResolvedValueOnce([[{ id: 'code-1' }], 1])
      .mockResolvedValueOnce([[], 0])
      .mockResolvedValueOnce([[{ id: 'code-1' }], 1])
      .mockResolvedValueOnce([[], 0]);

    await expect(codes.consumeAttempt('code-1')).resolves.toBe(true);
    await expect(codes.consumeAttempt('code-1')).resolves.toBe(false);
    await expect(codes.markAsUsed('code-1')).resolves.toBe(true);
    await expect(codes.markAsUsed('code-1')).resolves.toBe(false);
    const queryCalls = repository.query.mock.calls as unknown[][];
    expect(callArgument(queryCalls, 0, 0) as string).toContain('attempts < $2');
    expect(callArgument(queryCalls, 2, 0) as string).toContain('SET used_at = now()');
  });

  it('returns the issue history and configures the password reset table', async () => {
    const { repository: historyRepository } = createRepository();
    const history = { lastIssuedAt: new Date(), issuedInLastHour: 2 };
    historyRepository.query.mockResolvedValue([history]);
    const emailCodes = new PgEmailVerificationCodeRepository(
      historyRepository as unknown as Repository<EmailVerificationCode>,
    );

    await expect(emailCodes.issueHistoryFor('user-1')).resolves.toBe(history);
    expect(
      callArgument(historyRepository.query.mock.calls as unknown[][], 0, 0) as string,
    ).toContain('COUNT(*) FILTER');

    const { repository } = createRepository();
    const resetCodes = new PgPasswordResetCodeRepository(
      repository as unknown as Repository<PasswordResetCode>,
    );
    repository.query.mockResolvedValue([]);

    await expect(resetCodes.findPendingByUserId('user-2')).resolves.toBeNull();
    expect(callArgument(repository.query.mock.calls as unknown[][], 0, 0) as string).toContain(
      'FROM password_reset_codes',
    );
  });

  it('keeps the generic repository available for other one-time-code types', () => {
    class TestRepository extends PgOneTimeCodeRepository<EmailVerificationCode> {
      constructor(repository: Repository<EmailVerificationCode>) {
        super(repository, 'test_codes');
      }
    }

    const { repository } = createRepository();
    expect(
      new TestRepository(repository as unknown as Repository<EmailVerificationCode>),
    ).toBeInstanceOf(PgOneTimeCodeRepository);
  });
});
