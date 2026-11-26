import { test, expect, type Page } from '@playwright/test';
import {
  loginAsStudent,
  loginAsTeacher,
  logout,
  openSeedRoom,
  skipIfBackendUnavailable,
} from './helpers/fullstack';

const TEACHER_NAME = 'Carlos Mendes';
const CO_TUTOR_NAME = 'Maria Santos';
const STUDENT_NAME = 'Ana Souza';
const OTHER_STUDENT_NAME = 'João Silva';

async function openChat(page: Page) {
  await page.getByRole('button', { name: /^Abrir conversas/ }).click();
  const dialog = page.getByRole('dialog', { name: 'Conversas' });
  await expect(dialog).toBeVisible();
  return dialog;
}

async function closeChat(page: Page) {
  await page
    .getByRole('dialog', { name: 'Conversas' })
    .getByRole('button', {
      name: 'Fechar conversas',
    })
    .click();
  await expect(page.getByRole('dialog', { name: 'Conversas' })).toHaveCount(0);
}

async function openConversationWith(page: Page, name: string) {
  const dialog = page.getByRole('dialog', { name: 'Conversas' });
  await dialog.getByRole('button', { name: new RegExp(name) }).click();
  const messages = dialog.getByRole('list', { name: `Mensagens com ${name}` });
  const emptyState = dialog.getByText(/Nenhuma mensagem ainda/);
  await expect(messages.or(emptyState)).toBeVisible({ timeout: 10_000 });
  return { dialog, messages };
}

async function sendMessage(page: Page, recipientName: string, text: string) {
  const dialog = page.getByRole('dialog', { name: 'Conversas' });
  const sent = page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' &&
      /\/api\/conversas\/[^/]+\/mensagens$/.test(new URL(response.url()).pathname) &&
      response.status() === 201,
  );
  await dialog.getByLabel(`Mensagem para ${recipientName}`).fill(text);
  await dialog.getByRole('button', { name: 'Enviar mensagem' }).click();
  const body = (await (await sent).json()) as { texto: string; remetente: { nome: string } };
  expect(body.texto).toBe(text);
  await expect(dialog.getByLabel(`Mensagem para ${recipientName}`)).toHaveValue('');
  await expect(
    dialog.getByRole('list', { name: `Mensagens com ${recipientName}` }).getByText(text),
  ).toBeVisible();
  return body;
}

test.describe('E2E Full-Stack: mensagens privadas entre professor e aluno da turma', () => {
  test.beforeEach(async () => {
    await skipIfBackendUnavailable();
  });

  test('troca mensagens entre professor e aluna e sinaliza a mensagem nova', async ({ page }) => {
    const runId = Date.now().toString().slice(-6);
    const teacherMessage = `Olá, Ana! Mensagem do professor E2E ${runId}`;
    const studentReply = `Recebido, professor! Resposta E2E ${runId}`;

    await loginAsTeacher(page);
    await openSeedRoom(page);
    await openChat(page);
    await openConversationWith(page, STUDENT_NAME);
    const sent = await sendMessage(page, STUDENT_NAME, teacherMessage);
    expect(sent.remetente.nome).toBe(TEACHER_NAME);
    await closeChat(page);
    await logout(page);

    await loginAsStudent(page);
    await openSeedRoom(page);
    await expect(
      page.getByRole('button', { name: 'Abrir conversas, há mensagens novas', exact: true }),
    ).toBeVisible({ timeout: 10_000 });
    const studentDialog = await openChat(page);
    const recent = studentDialog.getByRole('region', { name: 'Recentes' });
    await expect(recent.getByRole('button', { name: new RegExp(TEACHER_NAME) })).toContainText(
      teacherMessage,
    );
    const { messages } = await openConversationWith(page, TEACHER_NAME);
    await expect(messages.getByText(teacherMessage)).toBeVisible();
    await sendMessage(page, TEACHER_NAME, studentReply);
    await closeChat(page);
    // Reading the conversation clears the flag kept for this user in the browser.
    await expect(page.getByRole('button', { name: 'Abrir conversas', exact: true })).toBeVisible();

    await page.reload();
    await openChat(page);
    const reloaded = await openConversationWith(page, TEACHER_NAME);
    await expect(reloaded.messages.getByText(teacherMessage)).toBeVisible();
    await expect(reloaded.messages.getByText(studentReply)).toBeVisible();
    await closeChat(page);
    await logout(page);

    await loginAsTeacher(page);
    await openSeedRoom(page);
    const teacherDialog = await openChat(page);
    await expect(
      teacherDialog
        .getByRole('region', { name: 'Recentes' })
        .getByRole('button', { name: new RegExp(STUDENT_NAME) }),
    ).toContainText(studentReply);
    const teacherThread = await openConversationWith(page, STUDENT_NAME);
    await expect(teacherThread.messages.getByText(studentReply)).toBeVisible();
  });

  test('oferece ao professor os alunos da turma e ao aluno apenas os professores', async ({
    page,
  }) => {
    await loginAsTeacher(page);
    await openSeedRoom(page);
    const teacherDialog = await openChat(page);
    await expect(teacherDialog.getByRole('button', { name: new RegExp(STUDENT_NAME) })).toBeVisible(
      {
        timeout: 10_000,
      },
    );
    await expect(
      teacherDialog.getByRole('button', { name: new RegExp(OTHER_STUDENT_NAME) }),
    ).toBeVisible();
    await expect(
      teacherDialog.getByRole('button', { name: new RegExp(CO_TUTOR_NAME) }),
    ).toHaveCount(0);

    await teacherDialog.getByRole('textbox', { name: 'Buscar aluno' }).fill('joão');
    await expect(
      teacherDialog.getByRole('button', { name: new RegExp(OTHER_STUDENT_NAME) }),
    ).toBeVisible();
    await expect(teacherDialog.getByRole('button', { name: new RegExp(STUDENT_NAME) })).toHaveCount(
      0,
    );
    await closeChat(page);
    await logout(page);

    await loginAsStudent(page);
    await openSeedRoom(page);
    const studentDialog = await openChat(page);
    const teacherItem = studentDialog.getByRole('button', { name: new RegExp(TEACHER_NAME) });
    await expect(teacherItem).toBeVisible({ timeout: 10_000 });
    await expect(
      studentDialog.getByRole('button', { name: new RegExp(CO_TUTOR_NAME) }),
    ).toBeVisible();
    await expect(
      studentDialog.getByRole('button', { name: new RegExp(OTHER_STUDENT_NAME) }),
    ).toHaveCount(0);
    await expect(studentDialog.getByRole('button', { name: new RegExp(STUDENT_NAME) })).toHaveCount(
      0,
    );
  });
});
