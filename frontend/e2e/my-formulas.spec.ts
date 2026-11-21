import { test, expect, type Page } from '@playwright/test';
import {
  createIsolatedSession,
  loginAsTeacher,
  skipIfBackendUnavailable,
} from './helpers/fullstack';

test.describe('E2E Full-Stack: fórmulas pessoais do professor', () => {
  test.beforeEach(async () => {
    await skipIfBackendUnavailable();
  });

  test('cria uma fórmula pessoal e aplica sua cópia a uma sessão', async ({ page }) => {
    const runId = Date.now().toString().slice(-4);
    const formulaName = `Fórmula E2E ${runId}`;
    await loginAsTeacher(page);

    await page.goto('/minhas-formulas');
    await page.getByRole('button', { name: 'Ações de fórmula' }).click();
    await page.getByRole('button', { name: 'Criar nova fórmula' }).click();
    await page.getByLabel('Título da Fórmula').fill(formulaName);
    await page.getByRole('button', { name: 'Criar Fórmula' }).click();
    await expect(page).toHaveURL(/\/minhas-formulas\/nova$/);

    await page.getByLabel('Título da Fórmula').fill(formulaName);
    await addCriterion(page, 'Critério A', '6');
    await addCriterion(page, 'Critério B', '3');

    await page.getByRole('button', { name: 'Editar critério Critério B' }).click();
    await page.getByLabel('Peso', { exact: true }).fill('4');
    await page.getByRole('button', { name: 'Salvar Edição' }).click();
    await expect(page.getByText('Critério A')).toBeVisible();
    await expect(page.getByText('Critério B')).toBeVisible();

    const createResponse = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        response.url().includes('/tabelas-desempenho') &&
        response.ok(),
    );
    await page.getByRole('button', { name: 'Salvar Fórmula' }).click();
    await createResponse;
    await expect(page).toHaveURL(/\/minhas-formulas$/);
    await expect(page.getByRole('heading', { name: formulaName })).toBeVisible();

    const session = await createIsolatedSession(page, `Sessão Fórmula E2E ${runId}`);
    await page.getByRole('link', { name: /Fórmulas Critérios e nota final/ }).click();
    await expect(page).toHaveURL(/\/sessoes\/[^/]+\/formulas$/);
    await page.getByRole('link', { name: new RegExp(`${formulaName} Carlos Mendes`) }).click();
    await expect(page.getByRole('heading', { level: 1, name: formulaName })).toBeVisible();
    await expect(page.getByText('Critério A')).toBeVisible();
    await expect(page.getByText('Critério B')).toBeVisible();

    await page.getByRole('button', { name: 'Aplicar fórmula' }).click();
    await page.getByRole('button', { name: 'Confirmar substituição' }).click();
    await expect(page).toHaveURL(
      new RegExp(
        `/turmas/${session.roomId}/problemas/${session.problemId}/sessoes/${session.sessionId}$`,
      ),
    );

    await page.getByRole('link', { name: /Fórmulas Critérios e nota final/ }).click();
    await expect(page.getByText(`Fórmula em uso nesta sessão: ${formulaName}`)).toBeVisible();
    await page.getByRole('link', { name: new RegExp(`${formulaName} Carlos Mendes`) }).click();
    await expect(page.getByText('Critério A')).toBeVisible();
    await expect(page.getByText('Critério B')).toBeVisible();
    await expect(page.getByText('6', { exact: true })).toBeVisible();
    await expect(page.getByText('4', { exact: true })).toBeVisible();
  });
});

async function addCriterion(page: Page, name: string, weight: string) {
  await page.getByRole('button', { name: '+Adicionar critério' }).click();
  await page.getByLabel('Nome do critério').fill(name);
  await page.getByLabel('Peso (1 a 10)').fill(weight);
  await page.getByRole('button', { name: 'Adicionar', exact: true }).click();
}
