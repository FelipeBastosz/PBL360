import { buildCodeEmail, escapeHtml } from './code-email';

const recipient = {
  userId: 'user-1',
  name: '<a href="https://evil">Clique</a>',
  email: 'ana@discente.uefs.br',
  code: '123456',
};

describe('buildCodeEmail', () => {
  const message = buildCodeEmail(
    { subject: 'Assunto', purpose: 'verificação', footer: 'Ignore se não pediu.' },
    recipient,
    10,
  );

  it('addresses the recipient with the code and the real expiry', () => {
    expect(message.to).toBe('ana@discente.uefs.br');
    expect(message.subject).toBe('Assunto');
    expect(message.html).toContain('<strong>123456</strong>');
    expect(message.html).toContain('Este código expira em 10 minutos.');
    expect(message.text).toContain('Ignore se não pediu.');
  });

  it('never injects the name as markup', () => {
    expect(message.html).not.toContain('<a href');
    expect(message.html).toContain('&lt;a href=&quot;https://evil&quot;&gt;');
  });
});

describe('escapeHtml', () => {
  it('escapes every markup character', () => {
    expect(escapeHtml(`<>&"'`)).toBe('&lt;&gt;&amp;&quot;&#39;');
  });
});
