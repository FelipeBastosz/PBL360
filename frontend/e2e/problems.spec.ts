import { test, expect } from '@playwright/test';

const mockRoom = {
  id: 'sala-1',
  nome: 'Turma de Engenharia de Software',
  semestre: '2026.1',
  codigoDisciplina: 'ES101',
  codigoSala: 'SALA-01',
  professorResponsavelId: 'user-tutor-1',
  ativo: true,
  criadoEm: '2026-01-10T10:00:00.000Z',
  totalAlunos: 32,
  totalProblemas: 2,
};

const mockProblems = [
  {
    id: 'prob-1',
    salaId: 'sala-1',
    titulo: 'Problema 1 - Introdução ao PBL',
    descricao: 'Estudo de caso inicial para ambientação com a metodologia.',
    ordem: 1,
    dataInicio: '2026-02-01T00:00:00.000Z',
    dataFim: '2026-02-15T00:00:00.000Z',
    totalSessoes: 3,
  },
  {
    id: 'prob-2',
    salaId: 'sala-1',
    titulo: 'Problema 2 - Arquitetura em Camadas',
    descricao: 'Modelagem de microsserviços e separação de responsabilidades.',
    ordem: 2,
    dataInicio: '2026-02-16T00:00:00.000Z',
    dataFim: '2026-02-28T00:00:00.000Z',
    totalSessoes: 2,
  },
];

const mockImpact = {
  sessoes: 3,
  notas: 24,
  feedbacks: 6,
  avaliacoes: 12,
};

test.describe('Problem Deletion Flow (ManageProblemsPage)', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        'pbl360.session',
        JSON.stringify({
          token: 'mock-auth-token',
          expiraEm: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          usuario: {
            id: 'user-tutor-1',
            nome: 'Carlos Silva',
            email: 'carlos@faculdade.edu.br',
            tipo: 'PROFESSOR',
            ativo: true,
          },
        }),
      );
    });

    await page.route('**/api/salas/sala-1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockRoom),
      });
    });

    await page.route('**/api/salas/sala-1/problemas', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockProblems),
        });
      }
    });

    await page.route('**/api/salas/sala-1/problemas/prob-1/impacto-exclusao', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockImpact),
      });
    });

    await page.goto('/turmas/sala-1/problemas/gerenciar');
  });

  test('should display problem list and open deletion modal with impact metrics', async ({
    page,
  }) => {
    await expect(
      page.getByRole('heading', { level: 3, name: 'Problema 1 - Introdução ao PBL' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { level: 3, name: 'Problema 2 - Arquitetura em Camadas' }),
    ).toBeVisible();

    const deleteBtn = page.getByRole('button', {
      name: 'Excluir Problema 1 - Introdução ao PBL',
    });
    await expect(deleteBtn).toBeVisible();
    await deleteBtn.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('heading', { name: 'Excluir problema?' })).toBeVisible();
    await expect(dialog.getByText('Problema 1 - Introdução ao PBL')).toBeVisible();

    await expect(dialog.getByText(/3 sessões/i)).toBeVisible();
    await expect(dialog.getByText(/24 notas/i)).toBeVisible();
    await expect(dialog.getByText(/12 avaliações/i)).toBeVisible();
  });

  test('should safely cancel deletion without removing problem or calling API', async ({
    page,
  }) => {
    let deleteCalled = false;
    await page.route('**/api/salas/sala-1/problemas/*', async (route) => {
      if (route.request().method() === 'DELETE') {
        deleteCalled = true;
        await route.fulfill({ status: 204 });
      }
    });

    await page.getByRole('button', { name: 'Excluir Problema 1 - Introdução ao PBL' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    await dialog.getByRole('button', { name: 'Cancelar' }).click();

    await expect(dialog).not.toBeVisible();
    expect(deleteCalled).toBe(false);
    await expect(
      page.getByRole('heading', { level: 3, name: 'Problema 1 - Introdução ao PBL' }),
    ).toBeVisible();
  });

  test('should close deletion modal when pressing Escape key', async ({ page }) => {
    await page.getByRole('button', { name: 'Excluir Problema 1 - Introdução ao PBL' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    await page.keyboard.press('Escape');

    await expect(dialog).not.toBeVisible();
    await expect(
      page.getByRole('heading', { level: 3, name: 'Problema 1 - Introdução ao PBL' }),
    ).toBeVisible();
  });

  test('should successfully delete problem, remove card and show toast notification', async ({
    page,
  }) => {
    let deleteCalled = false;
    await page.route('**/api/salas/sala-1/problemas/prob-1', async (route) => {
      if (route.request().method() === 'DELETE') {
        deleteCalled = true;
        await route.fulfill({ status: 204 });
      }
    });

    await page.getByRole('button', { name: 'Excluir Problema 1 - Introdução ao PBL' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    await dialog.getByRole('button', { name: 'Sim, excluir problema' }).click();

    await expect(dialog).not.toBeVisible();
    expect(deleteCalled).toBe(true);

    await expect(page.getByText('Problema excluído com sucesso!')).toBeVisible();
    await expect(
      page.getByRole('heading', { level: 3, name: 'Problema 1 - Introdução ao PBL' }),
    ).not.toBeVisible();
    await expect(
      page.getByRole('heading', { level: 3, name: 'Problema 2 - Arquitetura em Camadas' }),
    ).toBeVisible();
  });

  test('should display error notification and keep problem if deletion fails', async ({ page }) => {
    await page.route('**/api/salas/sala-1/problemas/prob-1', async (route) => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'O problema possui sessões vinculadas e não pode ser excluído.',
          }),
        });
      }
    });

    await page.getByRole('button', { name: 'Excluir Problema 1 - Introdução ao PBL' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    await dialog.getByRole('button', { name: 'Sim, excluir problema' }).click();

    await expect(
      page.getByText('O problema possui sessões vinculadas e não pode ser excluído.'),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { level: 3, name: 'Problema 1 - Introdução ao PBL' }),
    ).toBeVisible();
  });
});
