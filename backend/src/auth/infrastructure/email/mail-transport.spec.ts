import type { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { MailTransport } from './mail-transport';

jest.mock('nodemailer', () => ({ createTransport: jest.fn() }));

describe('MailTransport', () => {
  const createTransport = nodemailer.createTransport as jest.MockedFunction<
    typeof nodemailer.createTransport
  >;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses SMTP configuration and forwards the message with the project sender', async () => {
    const sendMail = jest.fn().mockResolvedValue(undefined);
    createTransport.mockReturnValue({ sendMail } as unknown as nodemailer.Transporter);
    const config = {
      get: jest.fn((key: string) => (key === 'mail.smtpUser' ? 'pbl360@example.com' : 'secret')),
    } as unknown as ConfigService;
    const transport = new MailTransport(config);
    const message = {
      to: 'ana@example.com',
      subject: 'Código',
      text: 'Seu código é 123456.',
      html: '<p>Seu código é 123456.</p>',
    };

    await transport.send(message);

    expect(createTransport).toHaveBeenCalledWith({
      service: 'gmail',
      auth: { user: 'pbl360@example.com', pass: 'secret' },
    });
    expect(sendMail).toHaveBeenCalledWith({ from: 'PBL360 <pbl360@example.com>', ...message });
  });

  it('uses empty credentials when SMTP settings are absent', () => {
    createTransport.mockReturnValue({ sendMail: jest.fn() } as unknown as nodemailer.Transporter);
    const config = { get: jest.fn().mockReturnValue(undefined) } as unknown as ConfigService;

    new MailTransport(config);

    expect(createTransport).toHaveBeenCalledWith({
      service: 'gmail',
      auth: { user: '', pass: '' },
    });
  });

  it('propagates delivery errors to its caller', async () => {
    const failure = new Error('SMTP unavailable');
    createTransport.mockReturnValue({
      sendMail: jest.fn().mockRejectedValue(failure),
    } as unknown as nodemailer.Transporter);
    const transport = new MailTransport({ get: jest.fn().mockReturnValue('mail') } as never);

    await expect(
      transport.send({ to: 'ana@example.com', subject: 'x', text: 'x', html: 'x' }),
    ).rejects.toBe(failure);
  });
});
