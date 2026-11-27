import type { PasswordResetCodeRepository } from '../../domain/repositories/password-reset-code.repository';
import type { CodeSender } from '../../domain/services/code-sender';
import { buildStudent } from '../../testing/auth-fixtures';
import { PasswordResetCodes } from './password-reset-codes';

describe('PasswordResetCodes', () => {
  let codes: jest.Mocked<PasswordResetCodeRepository>;
  let sender: jest.Mocked<CodeSender>;
  let service: PasswordResetCodes;

  beforeEach(() => {
    codes = {
      replacePendingFor: jest.fn().mockResolvedValue(undefined),
      findPendingByUserId: jest.fn().mockResolvedValue(null),
      consumeAttempt: jest.fn().mockResolvedValue(true),
      markAsUsed: jest.fn().mockResolvedValue(true),
      issueHistoryFor: jest.fn().mockResolvedValue({ lastIssuedAt: null, issuedInLastHour: 0 }),
    };
    sender = { sendCode: jest.fn().mockResolvedValue(undefined) };
    service = new PasswordResetCodes(codes, sender);
  });

  it('builds and stores a password reset code for the recipient', async () => {
    await expect(service.issueFor(buildStudent())).resolves.toBe(true);

    expect(codes.replacePendingFor).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-1', email: 'ana@discente.uefs.br' }),
    );
  });

  it('redeems a pending password reset code', async () => {
    const code = {
      id: 'code-1',
      matches: jest.fn().mockReturnValue(true),
    };
    codes.findPendingByUserId.mockResolvedValue(code as never);

    await expect(service.redeem('user-1', '123456')).resolves.toBe(code);
    expect(codes.consumeAttempt).toHaveBeenCalledWith('code-1');
    expect(codes.markAsUsed).toHaveBeenCalledWith('code-1');
  });
});
