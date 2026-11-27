import { Logger } from '@nestjs/common';
import { CODE_EXPIRATION_MINUTES } from '../../application/services/one-time-code.service';
import type { CodeRecipient } from '../../domain/services/code-sender';
import type { MailTransport } from './mail-transport';
import {
  NodemailerEmailVerificationSender,
  NodemailerPasswordResetSender,
} from './nodemailer-code-sender';

describe('Nodemailer code senders', () => {
  const recipient: CodeRecipient = {
    userId: 'user-1',
    name: 'Ana Souza',
    email: 'ana@example.com',
    code: '123456',
  };
  let transport: jest.Mocked<Pick<MailTransport, 'send'>>;
  let log: jest.SpyInstance;

  beforeEach(() => {
    transport = { send: jest.fn().mockResolvedValue(undefined) };
    log = jest.spyOn(Logger.prototype, 'log').mockImplementation();
  });

  afterEach(() => {
    log.mockRestore();
  });

  it('sends an email verification code with the expiration window', async () => {
    await new NodemailerEmailVerificationSender(transport as unknown as MailTransport).sendCode(
      recipient,
    );

    expect(transport.send).toHaveBeenCalledTimes(1);
    const message = transport.send.mock.calls[0]![0];
    expect(message.to).toBe(recipient.email);
    expect(message.subject).toBe('Código de Verificação - PBL360');
    expect(message.text).toContain(`${CODE_EXPIRATION_MINUTES} minutos`);
    expect(log).toHaveBeenCalledWith('Code e-mail sent to user user-1.');
  });

  it('sends a password reset message with the ignore-if-unrequested footer', async () => {
    await new NodemailerPasswordResetSender(transport as unknown as MailTransport).sendCode(
      recipient,
    );

    expect(transport.send).toHaveBeenCalledTimes(1);
    const message = transport.send.mock.calls[0]![0];
    expect(message.subject).toBe('Recuperação de senha - PBL360');
    expect(message.text).toContain('Se você não pediu essa recuperação, ignore este e-mail.');
    expect(message.html).toContain('Se você não pediu essa recuperação, ignore este e-mail.');
  });

  it('propagates a mail transport failure', async () => {
    const failure = new Error('SMTP unavailable');
    transport.send.mockRejectedValue(failure);

    await expect(
      new NodemailerEmailVerificationSender(transport as unknown as MailTransport).sendCode(
        recipient,
      ),
    ).rejects.toBe(failure);
    expect(log).not.toHaveBeenCalled();
  });
});
