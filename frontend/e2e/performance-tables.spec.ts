import { test, expect } from '@playwright/test';
import { mockAuthenticatedShell } from './helpers/terms';

const mockSharedTable = {
  id: 'table-shared-1',
  professorId: 'user-tutor-titular-1',
  nome: 'Barema de Avaliação PBL',
  descricao: 'Fórmula compartilhada da turma com critérios de avaliação tutorial.',
  isDefault: false,
  autor: {
    id: 'user-tutor-titular-1',
    nome: 'Professor Titular',
  },
  criterios: [
    {
      id: 'crit-1',
      nome: 'Comportamento e Postura',
      descricao: 'Pontualidade, ética e respeito mútuo no grupo.',
      peso: 5,
      ordem: 1,
      notaMaxima: 10,
    },
    {
      id: 'crit-2',
      nome: 'Domínio do Conteúdo',
      descricao: 'Profundidade teórica e articulação dos objetivos.',
      peso: 5,
      ordem: 2,
      notaMaxima: 10,
    },
  ],
  quantidadeProblemas: 1,
  quantidadeSessoes: 2,
  quantidadeSessoesPassadas: 0,
  criadoEm: '2026-03-01T10:00:00.000Z',
  atualizadoEm: '2026-03-01T10:00:00.000Z',
};

const mockOwnTable = {
  ...mockSharedTable,
  id: 'table-own-1',
  professorId: 'user-co-tutor-99',
  nome: 'Minha Fórmula Pessoal',
  autor: {
    id: 'user-co-tutor-99',
    nome: 'Professora Co-tutora',
  },
};

const mockDefaultTable = {
  ...mockSharedTable,
  id: 'table-default-1',
  professorId: null,
  isDefault: true,
  nome: 'Fórmula Padrão do Sistema',
  autor: null,
};

test.describe('Performance Tables - Co-tutor Flow (Closes #457)', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        'pbl360.session',
        JSON.stringify({
          token: 'mock-cotutor-token',
          expiraEm: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          usuario: {
            id: 'user-co-tutor-99',
            nome: 'Professora Co-tutora',
            email: 'cotutora@uefs.br',
            tipo: 'TUTOR',
            ativo: true,
          },
        }),
      );
    });

    await mockAuthenticatedShell(page);
    await page.route('**/api/tabelas-desempenho/table-shared-1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockSharedTable),
      });
    });

    await page.route('**/api/tabelas-desempenho/table-own-1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockOwnTable),
      });
    });

    await page.route('**/api/tabelas-desempenho/table-default-1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockDefaultTable),
      });
    });

    await page.route('**/api/tabelas-desempenho/table-shared-no-author', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ...mockSharedTable,
          id: 'table-shared-no-author',
          autor: undefined,
        }),
      });
    });
  });

  test('co-tutor views shared formula details with criteria, weights and informative banner', async ({
    page,
  }) => {
    await page.goto('/formulas/table-shared-1');

    await expect(
      page.getByRole('heading', { level: 1, name: 'Barema de Avaliação PBL' }),
    ).toBeVisible();

    const sharedBanner = page.getByRole('status');
    await expect(sharedBanner).toBeVisible();
    await expect(sharedBanner).toContainText(
      'Fórmula compartilhada da turma · Criada por Professor Titular.',
    );

    await expect(page.getByRole('heading', { level: 2, name: 'Descrição' })).toBeVisible();
    await expect(
      page.getByText('Fórmula compartilhada da turma com critérios de avaliação tutorial.'),
    ).toBeVisible();

    await expect(page.getByText('Comportamento e Postura')).toBeVisible();
    await expect(page.getByText('Domínio do Conteúdo')).toBeVisible();
    await expect(page.getByText('Pontualidade, ética e respeito mútuo no grupo.')).toBeVisible();

    const weightBadges = page.locator('span.inline-flex:has-text("5")');
    await expect(weightBadges).toHaveCount(2);

    await expect(page.locator('[role="alert"]')).not.toBeVisible();
  });

  test('renders shared banner fallback without author suffix when author is not provided', async ({
    page,
  }) => {
    await page.goto('/formulas/table-shared-no-author');

    await expect(
      page.getByRole('heading', { level: 1, name: 'Barema de Avaliação PBL' }),
    ).toBeVisible();

    const sharedBanner = page.getByRole('status');
    await expect(sharedBanner).toBeVisible();
    await expect(sharedBanner).toHaveText('Fórmula compartilhada da turma.');
  });

  test('does not display shared banner when co-tutor views their own formula', async ({ page }) => {
    await page.goto('/formulas/table-own-1');

    await expect(
      page.getByRole('heading', { level: 1, name: 'Minha Fórmula Pessoal' }),
    ).toBeVisible();
    await expect(page.getByText('Comportamento e Postura')).toBeVisible();

    await expect(page.getByRole('status')).not.toBeVisible();
  });

  test('does not display shared banner when formula is default', async ({ page }) => {
    await page.goto('/formulas/table-default-1');

    await expect(
      page.getByRole('heading', { level: 1, name: 'Fórmula Padrão do Sistema' }),
    ).toBeVisible();
    await expect(page.getByText('Comportamento e Postura')).toBeVisible();

    await expect(page.getByRole('status')).not.toBeVisible();
  });
});
