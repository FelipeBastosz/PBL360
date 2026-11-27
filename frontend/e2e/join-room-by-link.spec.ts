import { test, expect, type Page } from '@playwright/test';
import {
  loginAsStudent,
  loginAsTeacher,
  logout,
  skipIfBackendUnavailable,
} from './helpers/fullstack';

const STUDENT_EMAIL = '20240001@discente.uefs.br';
const PASSWORD = 'senha-secreta';

async function createRoomViaApi(page: Page, name: string): Promise<{ codigoSala: string }> {
  return page.evaluate(async (targetName) => {
    const stored = localStorage.getItem('pbl360.session');
    if (!stored) throw new Error('Authenticated teacher session not found.');
    const token = (JSON.parse(stored) as { token?: string }).token;
    if (!token) throw new Error('Authenticated teacher token not found.');

    const response = await fetch('/api/salas', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: targetName,
        codigoDisciplina: 'EXA123',
        semestre: '2026.2',
      }),
    });
    if (!response.ok) throw new Error(`Failed to create room: HTTP ${response.status}.`);
    return (await response.json()) as { codigoSala: string };
  }, name);
}

test.describe('E2E Full-Stack: ingresso na turma via link de convite', () => {
  test.beforeEach(async () => {
    await skipIfBackendUnavailable();
  });

  test('redireciona deslogado para login, matricula automaticamente e persiste após reload', async ({
    page,
  }) => {
    const runId = Date.now().toString().slice(-5);
    const roomName = `Turma Link Deslogado ${runId}`;

    await loginAsTeacher(page);
    const { codigoSala } = await createRoomViaApi(page, roomName);
    expect(codigoSala).toMatch(/^[A-Za-z0-9]{8}$/);
    await logout(page);

    // Ensures commitment terms are accepted before testing the unauthenticated redirect flow.
    await loginAsStudent(page);
    await logout(page);

    await page.goto(`/salas/${codigoSala}`);
    await expect(page).toHaveURL(/\/entrar$/);

    const joinResponse = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        new URL(response.url()).pathname === '/api/salas/ingressar/codigo' &&
        response.ok(),
    );

    await page.getByLabel('Email Institucional').fill(STUDENT_EMAIL);
    await page.getByPlaceholder('Informe sua senha').fill(PASSWORD);
    await page.getByRole('button', { name: 'Entrar' }).click();

    await joinResponse;
    await expect(page).toHaveURL(/\/turmas$/, { timeout: 10_000 });
    await expect(page.getByText('Pronto! Você entrou na turma.')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('heading', { level: 3, name: roomName })).toBeVisible({
      timeout: 10_000,
    });

    await page.reload();
    await expect(page.getByRole('heading', { level: 3, name: roomName })).toBeVisible({
      timeout: 10_000,
    });
  });

  test('matricula aluno já autenticado e trata reingresso, código inexistente e código inválido', async ({
    page,
  }) => {
    const runId = Date.now().toString().slice(-5);
    const roomName = `Turma Link Logado ${runId}`;

    await loginAsTeacher(page);
    const { codigoSala } = await createRoomViaApi(page, roomName);
    await logout(page);

    await loginAsStudent(page);

    await page.goto(`/salas/${codigoSala}`);
    await expect(page).toHaveURL(/\/turmas$/, { timeout: 10_000 });
    await expect(page.getByText('Pronto! Você entrou na turma.')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('heading', { level: 3, name: roomName })).toBeVisible({
      timeout: 10_000,
    });

    // Opening the same invite link again is idempotent and returns the student to /turmas.
    await page.goto(`/salas/${codigoSala}`);
    await expect(page).toHaveURL(/\/turmas$/, { timeout: 10_000 });
    await expect(page.getByRole('heading', { level: 3, name: roomName })).toBeVisible({
      timeout: 10_000,
    });

    // Valid 8-char format but nonexistent room returns 404 alert.
    await page.goto('/salas/ZzZz9999');
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 10_000 });

    // Malformed code is rejected client-side with a clear message and recovery link.
    await page.goto('/salas/codigo-invalido');
    await expect(page.getByRole('alert')).toContainText('O link de convite informado é inválido.');
    await page.getByRole('link', { name: 'Ir para minhas turmas' }).click();
    await expect(page).toHaveURL(/\/turmas$/);
  });

  test('impede professor autenticado de usar link de ingresso de aluno', async ({ page }) => {
    const runId = Date.now().toString().slice(-5);
    const roomName = `Turma Link Professor ${runId}`;

    await loginAsTeacher(page);
    const { codigoSala } = await createRoomViaApi(page, roomName);

    let joinCalled = false;
    page.on('request', (request) => {
      if (new URL(request.url()).pathname === '/api/salas/ingressar/codigo') {
        joinCalled = true;
      }
    });

    await page.goto(`/salas/${codigoSala}`);
    await expect(page.getByRole('alert')).toContainText(
      'Apenas alunos podem entrar em uma turma por link de convite.',
    );
    expect(joinCalled).toBe(false);

    await page.getByRole('link', { name: 'Ir para minhas turmas' }).click();
    await expect(page).toHaveURL(/\/turmas$/);
  });
});
