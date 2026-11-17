import { ConfigService } from '@nestjs/config';
import { MailTransport, type MailMessage } from './mail-transport';

const message: MailMessage = {
  to: 'ana@discente.uefs.br',
  subject: 'Assunto',
  text: 'Código 123456',
  html: '<strong>123456</strong>',
};

const transport = (mail: Record<string, string>): MailTransport =>
  new MailTransport(new ConfigService({ mail: { smtpUser: 'pbl360@gmail.com', ...mail } }));

describe('MailTransport with a Brevo key', () => {
  const fetchMock = jest.spyOn(global, 'fetch');

  afterEach(() => fetchMock.mockReset());
  afterAll(() => fetchMock.mockRestore());

  it('sends the message through the Brevo API instead of SMTP', async () => {
    fetchMock.mockResolvedValue(new Response('{"messageId":"1"}', { status: 201 }));

    await transport({ brevoApiKey: 'xkeysib-test' }).send(message);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.brevo.com/v3/smtp/email');
    expect(init.headers).toMatchObject({ 'api-key': 'xkeysib-test' });
    expect(JSON.parse(init.body as string)).toEqual({
      sender: { name: 'PBL360', email: 'pbl360@gmail.com' },
      to: [{ email: 'ana@discente.uefs.br' }],
      subject: 'Assunto',
      textContent: 'Código 123456',
      htmlContent: '<strong>123456</strong>',
    });
  });

  it('fails when Brevo refuses the message', async () => {
    fetchMock.mockResolvedValue(new Response('sender not verified', { status: 400 }));

    await expect(transport({ brevoApiKey: 'xkeysib-test' }).send(message)).rejects.toThrow(
      'Brevo rejected the e-mail (400): sender not verified',
    );
  });
});
