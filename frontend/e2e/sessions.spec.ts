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
  totalProblemas: 1,
};

const mockProblem = {
  id: 'prob-1',
  salaId: 'sala-1',
  titulo: 'Problema 1 - Introdução ao PBL',
  descricao: 'Estudo de caso clínico/prático.',
  ordem: 1,
  dataInicio: '2026-02-01T00:00:00.000Z',
  dataFim: '2026-02-15T00:00:00.000Z',
  totalSessoes: 2,
};

const mockSessions = [
  {
    id: 'sess-1',
    problemaId: 'prob-1',
    titulo: 'Sessão 1 - Abertura',
    descricao: 'Definição das hipóteses.',
    ordem: 1,
    data: '2026-02-01T14:00:00.000Z',
    status: 'CONCLUIDA',
  },
  {
    id: 'sess-2',
    problemaId: 'prob-1',
    titulo: 'Sessão 2 - Fechamento',
    descricao: 'Apresentação dos resultados.',
    ordem: 2,
    data: '2026-02-08T14:00:00.000Z',
    status: 'PENDENTE',
  },
];

const mockSessionImpact = {
  podeExcluir: false,
  chamada: 0,
  papeis: 2,
  observacoes: 0,
  avaliacoes: 5,
  feedbacks: 3,
};

test.describe('Session Deletion Flow & Conflict Handling (ManageSessionsPage)', () => {
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

    await page.route('**/api/salas/sala-1/problemas/prob-1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockProblem),
      });
    });

    await page.route('**/api/salas/sala-1/problemas/prob-1/sessoes', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockSessions),
        });
      }
    });

    await page.route(
      '**/api/salas/sala-1/problemas/prob-1/sessoes/sess-1/impacto-exclusao',
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockSessionImpact),
        });
      },
    );

    await page.goto('/turmas/sala-1/problemas/prob-1/sessoes/gerenciar');
  });

  test('should display contextual message when session deletion returns 409 Conflict with detalhes', async ({
    page,
  }) => {
    await page.route('**/api/salas/sala-1/problemas/prob-1/sessoes/sess-1', async (route) => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({
            statusCode: 409,
            message: 'A sessão não pode ser excluída pois possui registros vinculados.',
            error: 'Conflict',
            detalhes: {
              feedbacks: 3,
              avaliacoes: 5,
            },
          }),
        });
      }
    });

    const deleteBtn = page.getByRole('button', { name: 'Excluir Sessão 1 - Abertura' });
    await expect(deleteBtn).toBeVisible();
    await deleteBtn.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('heading', { name: 'Excluir sessão?' })).toBeVisible();

    const confirmBtn = dialog.getByRole('button', { name: 'Sim, excluir sessão' });
    await expect(confirmBtn).toBeVisible();
    await confirmBtn.click();

    const expectedMessage =
      'Não é possível excluir: existem 3 feedbacks e 5 avaliações vinculados a esta sessão.';

    await expect(dialog.getByRole('alert')).toHaveTextContent(expectedMessage);
    await expect(page.getByText(expectedMessage)).toBeVisible();
    await expect(
      dialog.getByRole('heading', { name: 'Não é possível excluir a sessão' }),
    ).toBeVisible();

    const entendiBtn = dialog.getByRole('button', { name: 'Entendi' });
    await expect(entendiBtn).toBeVisible();
    await entendiBtn.click();

    await expect(dialog).not.toBeVisible();
  });

  test('should successfully delete session when API returns 204', async ({ page }) => {
    await page.route('**/api/salas/sala-1/problemas/prob-1/sessoes/sess-1', async (route) => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({ status: 204 });
      }
    });

    const deleteBtn = page.getByRole('button', { name: 'Excluir Sessão 1 - Abertura' });
    await deleteBtn.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    await dialog.getByRole('button', { name: 'Sim, excluir sessão' }).click();

    await expect(dialog).not.toBeVisible();
    await expect(page.getByText('Sessão excluída com sucesso!')).toBeVisible();
  });
});
