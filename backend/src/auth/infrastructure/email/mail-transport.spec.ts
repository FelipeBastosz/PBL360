import { ConfigService } from '@nestjs/config';
import { MailTransport, type MailMessage } from './mail-transport';

const message: MailMessage = {
  to: 'ana@discente.uefs.br',
  subject: 'Código de Verificação',
  text: 'Código 123456',
  html: '<strong>123456</strong>',
};

const gmailTransport = (): MailTransport =>
  new MailTransport(
    new ConfigService({
      mail: {
        smtpUser: 'pbl360@gmail.com',
        gmailClientId: 'client-id',
        gmailClientSecret: 'client-secret',
        gmailRefreshToken: '1//refresh',
      },
    }),
  );

describe('MailTransport with Gmail API credentials', () => {
  const fetchMock = jest.spyOn(global, 'fetch');

  afterEach(() => fetchMock.mockReset());
  afterAll(() => fetchMock.mockRestore());

  it('sends the message through the Gmail API instead of SMTP', async () => {
    fetchMock
      .mockResolvedValueOnce(Response.json({ access_token: 'access-token' }))
      .mockResolvedValueOnce(Response.json({ id: '1' }));

    await gmailTransport().send(message);

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
    fetchMock.mockResolvedValueOnce(new Response('invalid_grant', { status: 400 }));

    await expect(gmailTransport().send(message)).rejects.toThrow(
      'Google refused the Gmail token (400): invalid_grant',
    );
  });

  it('fails when Gmail refuses the message', async () => {
    fetchMock
      .mockResolvedValueOnce(Response.json({ access_token: 'access-token' }))
      .mockResolvedValueOnce(new Response('quota exceeded', { status: 429 }));

    await expect(gmailTransport().send(message)).rejects.toThrow(
      'Gmail rejected the e-mail (429): quota exceeded',
    );
  });
});
