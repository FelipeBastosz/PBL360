import { Logger } from '@nestjs/common';
import { randomInt } from 'node:crypto';
import type { User } from '@/users/domain/entities/user.entity';
import type { NewOneTimeCode, OneTimeCode } from '../../domain/entities/one-time-code';
import type {
  IssueHistory,
  OneTimeCodeRepository,
} from '../../domain/repositories/one-time-code.repository';
import type { CodeSender } from '../../domain/services/code-sender';

export const CODE_EXPIRATION_MINUTES = 10;
export const REQUEST_COOLDOWN_SECONDS = 60;
export const MAX_CODES_PER_HOUR = 5;

export const generateOneTimeCode = (): string =>
  randomInt(0, 1_000_000).toString().padStart(6, '0');

export const canIssueAnotherCode = (history: IssueHistory, now: number = Date.now()): boolean =>
  history.issuedInLastHour < MAX_CODES_PER_HOUR &&
  (history.lastIssuedAt === null ||
    now - history.lastIssuedAt.getTime() >= REQUEST_COOLDOWN_SECONDS * 1000);

export abstract class OneTimeCodeService<T extends OneTimeCode> {
  private readonly logger = new Logger(this.constructor.name);

  protected constructor(
    private readonly codes: OneTimeCodeRepository<T>,
    private readonly sender: CodeSender,
  ) {}

  protected abstract build(props: NewOneTimeCode): T;

  async issueFor(user: User): Promise<boolean> {
    if (!canIssueAnotherCode(await this.codes.issueHistoryFor(user.id))) {
      return false;
    }

    const code = generateOneTimeCode();
    await this.codes.replacePendingFor(
      this.build({
        userId: user.id,
        email: user.email,
        code,
        expiresInMinutes: CODE_EXPIRATION_MINUTES,
      }),
    );
    void this.notify(user, code);

    return true;
  }

  async redeem(userId: string, code: string): Promise<T | null> {
    const pending = await this.codes.findPendingByUserId(userId);

    if (!pending || !(await this.codes.consumeAttempt(pending.id)) || !pending.matches(code)) {
      return null;
    }

    return (await this.codes.markAsUsed(pending.id)) ? pending : null;
  }

  private async notify(user: User, code: string): Promise<void> {
    try {
      await this.sender.sendCode({ userId: user.id, name: user.name, email: user.email, code });
    } catch (error) {
      this.logger.error(
        `Could not send a code to user ${user.id}.`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
