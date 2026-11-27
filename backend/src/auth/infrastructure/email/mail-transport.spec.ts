import { ConfigService } from '@nestjs/config';
import type { ConfigService as ConfigServiceType } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { MailTransport, type MailMessage } from './mail-transport';

jest.mock('nodemailer', () => ({ createTransport: jest.fn() }));

const message: MailMessage = {
  to: 'ana@discente.uefs.br',
  subject: 'Código de Verificação',
  text: 'Código 123456',
  html: '<strong>123456</strong>',
};

const createTransport = nodemailer.createTransport as jest.MockedFunction<
  typeof nodemailer.createTransport
>;

describe('MailTransport', () => {
  const fetchMock = jest.spyOn(global, 'fetch');

  beforeEach(() => {
    jest.clearAllMocks();
    createTransport.mockReturnValue({
      sendMail: jest.fn().mockResolvedValue(undefined),
    } as unknown as nodemailer.Transporter);
  });

  afterEach(() => fetchMock.mockReset());
  afterAll(() => fetchMock.mockRestore());

  it('uses SMTP when Gmail API credentials are absent', async () => {
    const sendMail = jest.fn().mockResolvedValue(undefined);
    createTransport.mockReturnValue({ sendMail } as unknown as nodemailer.Transporter);
    const config = {
      get: jest.fn((key: string) => {
        if (key === 'mail.smtpUser') return 'pbl360@example.com';
        if (key === 'mail.smtpPass') return 'secret';
        return undefined;
      }),
    } as unknown as ConfigServiceType;
    const transport = new MailTransport(config);

    await transport.send(message);

    expect(createTransport).toHaveBeenCalledWith({
      service: 'gmail',
      auth: { user: 'pbl360@example.com', pass: 'secret' },
    });
    expect(sendMail).toHaveBeenCalledWith({
      from: 'PBL360 <pbl360@example.com>',
      ...message,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('uses empty SMTP credentials when settings are absent', () => {
    const config = { get: jest.fn().mockReturnValue(undefined) } as unknown as ConfigServiceType;

    new MailTransport(config);

    expect(createTransport).toHaveBeenCalledWith({
      service: 'gmail',
      auth: { user: '', pass: '' },
    });
  });

  it('propagates SMTP delivery errors to its caller', async () => {
    const failure = new Error('SMTP unavailable');
    createTransport.mockReturnValue({
      sendMail: jest.fn().mockRejectedValue(failure),
    } as unknown as nodemailer.Transporter);
    const transport = new MailTransport({
      get: (key: string) => (key === 'mail.smtpUser' ? 'pbl360@example.com' : undefined),
    } as unknown as ConfigServiceType);

    await expect(transport.send(message)).rejects.toBe(failure);
  });

  it('sends through Gmail API and includes the encoded message', async () => {
    const transport = new MailTransport(
      new ConfigService({
        mail: {
          smtpUser: 'pbl360@gmail.com',
          gmailClientId: 'client-id',
          gmailClientSecret: 'client-secret',
          gmailRefreshToken: '1//refresh',
        },
      }),
    );
    fetchMock
      .mockResolvedValueOnce(Response.json({ access_token: 'access-token' }))
      .mockResolvedValueOnce(Response.json({ id: '1' }));

    await transport.send(message);

    const [tokenUrl, tokenInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(tokenUrl).toBe('https://oauth2.googleapis.com/token');
    expect(Object.fromEntries(tokenInit.body as URLSearchParams)).toEqual({
      client_id: 'client-id',
      client_secret: 'client-secret',
      refresh_token: '1//refresh',
      grant_type: 'refresh_token',
    });

    const [sendUrl, sendInit] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(sendUrl).toBe('https://gmail.googleapis.com/gmail/v1/users/me/messages/send');
    expect(sendInit.headers).toMatchObject({ authorization: 'Bearer access-token' });

    const { raw } = JSON.parse(sendInit.body as string) as { raw: string };
    const mime = Buffer.from(raw, 'base64url').toString();
    expect(mime).toContain('From: PBL360 <pbl360@gmail.com>');
    expect(mime).toContain('To: ana@discente.uefs.br');
    expect(mime).toContain('Subject: =?UTF-8?');
    expect(mime).toContain('text/html');
  });

  it('fails when Google refuses the refresh token', async () => {
    const transport = new MailTransport(
      new ConfigService({
        mail: { gmailClientId: 'client-id', gmailClientSecret: 'secret', gmailRefreshToken: 'bad' },
      }),
    );
    fetchMock.mockResolvedValueOnce(new Response('invalid_grant', { status: 400 }));

    await expect(transport.send(message)).rejects.toThrow(
      'Google refused the Gmail token (400): invalid_grant',
    );
  });

  it('fails when Gmail refuses the message', async () => {
    const transport = new MailTransport(
      new ConfigService({
        mail: { gmailClientId: 'client-id', gmailClientSecret: 'secret', gmailRefreshToken: 'ok' },
      }),
    );
    fetchMock
      .mockResolvedValueOnce(Response.json({ access_token: 'access-token' }))
      .mockResolvedValueOnce(new Response('quota exceeded', { status: 429 }));

    await expect(transport.send(message)).rejects.toThrow(
      'Gmail rejected the e-mail (429): quota exceeded',
    );
  });
});
