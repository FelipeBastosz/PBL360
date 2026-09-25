import { Logger } from '@nestjs/common';
import { EmailVerificationCode } from '../../domain/entities/email-verification-code.entity';
import type { EmailVerificationCodeRepository } from '../../domain/repositories/email-verification-code.repository';
import type { CodeSender } from '../../domain/services/code-sender';
import { buildStudent } from '../../testing/auth-fixtures';
import { EmailVerificationCodes } from './email-verification-codes';
import {
  canIssueAnotherCode,
  CODE_EXPIRATION_MINUTES,
  generateOneTimeCode,
  MAX_CODES_PER_HOUR,
  REQUEST_COOLDOWN_SECONDS,
} from './one-time-code.service';

const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

describe('OneTimeCodeService', () => {
  let codes: jest.Mocked<EmailVerificationCodeRepository>;
  let sender: jest.Mocked<CodeSender>;
  let service: EmailVerificationCodes;

  beforeEach(() => {
    codes = {
      replacePendingFor: jest.fn().mockResolvedValue(undefined),
      findPendingByUserId: jest.fn(),
      consumeAttempt: jest.fn().mockResolvedValue(true),
      markAsUsed: jest.fn().mockResolvedValue(true),
      issueHistoryFor: jest.fn().mockResolvedValue({ lastIssuedAt: null, issuedInLastHour: 0 }),
    };
    sender = { sendCode: jest.fn().mockResolvedValue(undefined) };
    service = new EmailVerificationCodes(codes, sender);
  });

  describe('issueFor', () => {
    it('stores only the hash of the code it e-mails', async () => {
      await expect(service.issueFor(buildStudent())).resolves.toBe(true);
      await flushPromises();

      const stored = codes.replacePendingFor.mock.calls[0]![0];
      const { code } = sender.sendCode.mock.calls[0]![0];
      expect(code).toMatch(/^\d{6}$/);
      expect(stored.codeHash).not.toContain(code);
      expect(stored.matches(code)).toBe(true);
      expect(stored).toMatchObject({ userId: 'user-1', email: 'ana@discente.uefs.br' });
    });

    it('expires the code after the configured window', async () => {
      const before = Date.now();

      await service.issueFor(buildStudent());

      const { expiresAt } = codes.replacePendingFor.mock.calls[0]![0];
      expect(expiresAt.getTime()).toBeGreaterThanOrEqual(before + CODE_EXPIRATION_MINUTES * 60_000);
    });

    it('does not issue while the cooldown is running', async () => {
      codes.issueHistoryFor.mockResolvedValue({ lastIssuedAt: new Date(), issuedInLastHour: 1 });

      await expect(service.issueFor(buildStudent())).resolves.toBe(false);
      expect(codes.replacePendingFor).not.toHaveBeenCalled();
      expect(sender.sendCode).not.toHaveBeenCalled();
    });

    it('keeps the account usable when the e-mail provider fails', async () => {
      const logError = jest.spyOn(Logger.prototype, 'error').mockImplementation();
      sender.sendCode.mockRejectedValue(new Error('smtp is down'));

      await expect(service.issueFor(buildStudent())).resolves.toBe(true);
      await flushPromises();

      expect(logError).toHaveBeenCalledWith(
        'Could not send a code to user user-1.',
        expect.any(String),
      );
      logError.mockRestore();
    });
  });

  describe('redeem', () => {
    const pending = (code = '123456') =>
      EmailVerificationCode.issue({
        userId: 'user-1',
        email: 'ana@discente.uefs.br',
        code,
        expiresInMinutes: 10,
      });

    it('returns the code when it matches and marks it as used', async () => {
      const code = pending();
      codes.findPendingByUserId.mockResolvedValue(code);

      await expect(service.redeem('user-1', '123456')).resolves.toBe(code);
      expect(codes.consumeAttempt).toHaveBeenCalledWith(code.id);
      expect(codes.markAsUsed).toHaveBeenCalledWith(code.id);
    });

    it('spends an attempt on a wrong code', async () => {
      codes.findPendingByUserId.mockResolvedValue(pending());

      await expect(service.redeem('user-1', '000000')).resolves.toBeNull();
      expect(codes.consumeAttempt).toHaveBeenCalled();
      expect(codes.markAsUsed).not.toHaveBeenCalled();
    });

    it('refuses even the right code once the attempts are exhausted', async () => {
      codes.findPendingByUserId.mockResolvedValue(pending());
      codes.consumeAttempt.mockResolvedValue(false);

      await expect(service.redeem('user-1', '123456')).resolves.toBeNull();
      expect(codes.markAsUsed).not.toHaveBeenCalled();
    });

    it('refuses a code another request already used', async () => {
      codes.findPendingByUserId.mockResolvedValue(pending());
      codes.markAsUsed.mockResolvedValue(false);

      await expect(service.redeem('user-1', '123456')).resolves.toBeNull();
    });

    it('refuses when there is no pending code', async () => {
      codes.findPendingByUserId.mockResolvedValue(null);

      await expect(service.redeem('user-1', '123456')).resolves.toBeNull();
      expect(codes.consumeAttempt).not.toHaveBeenCalled();
    });
  });
});

describe('generateOneTimeCode', () => {
  it('always has six digits, leading zeros included', () => {
    const codes = Array.from({ length: 200 }, generateOneTimeCode);

    expect(codes.every((code) => /^\d{6}$/.test(code))).toBe(true);
  });
});

describe('canIssueAnotherCode', () => {
  const now = Date.now();

  it('allows the first code', () => {
    expect(canIssueAnotherCode({ lastIssuedAt: null, issuedInLastHour: 0 }, now)).toBe(true);
  });

  it('waits for the cooldown between codes', () => {
    const recent = new Date(now - (REQUEST_COOLDOWN_SECONDS - 1) * 1000);
    const old = new Date(now - REQUEST_COOLDOWN_SECONDS * 1000);

    expect(canIssueAnotherCode({ lastIssuedAt: recent, issuedInLastHour: 1 }, now)).toBe(false);
    expect(canIssueAnotherCode({ lastIssuedAt: old, issuedInLastHour: 1 }, now)).toBe(true);
  });

  it('caps how many codes an account gets per hour', () => {
    const old = new Date(now - 10 * 60_000);

    expect(
      canIssueAnotherCode({ lastIssuedAt: old, issuedInLastHour: MAX_CODES_PER_HOUR }, now),
    ).toBe(false);
  });
});
