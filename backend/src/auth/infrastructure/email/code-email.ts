import type { CodeRecipient } from '../../domain/services/code-sender';
import type { MailMessage } from './mail-transport';

export interface CodeEmailTemplate {
  subject: string;
  purpose: string;
  footer?: string;
}

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export const escapeHtml = (value: string): string =>
  value.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);

export const buildCodeEmail = (
  template: CodeEmailTemplate,
  recipient: CodeRecipient,
  expiresInMinutes: number,
): MailMessage => {
  const expiry = `Este código expira em ${expiresInMinutes} minutos.`;
  const footer = template.footer ? ` ${template.footer}` : '';
  const name = escapeHtml(recipient.name);

  return {
    to: recipient.email,
    subject: template.subject,
    text: `Olá ${recipient.name}, o seu código de ${template.purpose} é: ${recipient.code}. ${expiry}${footer}`,
    html:
      `<p>Olá ${name},</p>` +
      `<p>O seu código de ${template.purpose} é: <strong>${recipient.code}</strong></p>` +
      `<p>${expiry}${escapeHtml(footer)}</p>`,
  };
};
