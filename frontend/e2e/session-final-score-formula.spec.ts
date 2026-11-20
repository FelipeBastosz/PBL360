import { test, expect, type Page } from '@playwright/test';

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
  descricao: 'Estudo de caso.',
  ordem: 1,
  dataInicio: '2026-02-01T00:00:00.000Z',
  dataFim: '2026-02-15T00:00:00.000Z',
  totalSessoes: 2,
};

const mockSession = {
  id: 'sess-1',
  problemaId: 'prob-1',
  titulo: 'Sessão 1 - Abertura',
  descricao: 'Definição das hipóteses.',
  ordem: 1,
  data: '2026-02-01T14:00:00.000Z',
  status: 'PENDENTE',
};

const mockUnlockedEvaluationConfig = {
  tabela: {
    id: 'tab-1',
    nome: 'Tabela Padrão',
    padrao: true,
    criterios: [],
  },
  formula: {
    padrao: true,
    versao: 1,
    componentes: [
      { tipo: 'CRITERIOS' as const, peso: 70 },
      { tipo: 'PAPEL' as const, peso: 30 },
    ],
  },
  bloqueada: false,
};

const mockCustomEvaluationConfig = {
  ...mockUnlockedEvaluationConfig,
  formula: {
    padrao: false,
    versao: 2,
    componentes: [
      { tipo: 'CRITERIOS' as const, peso: 80 },
      { tipo: 'PAPEL' as const, peso: 20 },
    ],
  },
};

const mockLockedEvaluationConfig = {
  ...mockUnlockedEvaluationConfig,
  bloqueada: true,
};

const mockDefaultFormulaResponse = {
  padrao: true,
  versao: 1,
  componentes: [
    { tipo: 'CRITERIOS' as const, peso: 70 },
    { tipo: 'PAPEL' as const, peso: 30 },
  ],
};

async function setupAuth(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem(
      'pbl360.session',
      JSON.stringify({
        token: 'mock-auth-token',
        expiraEm: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        usuario: {
          id: 'user-tutor-1',
          nome: 'Prof. Roberto Tutor',
          email: 'roberto@faculdade.edu.br',
          tipo: 'PROFESSOR',
          ativo: true,
        },
      }),
    );
  });
}

async function setupFormulaRoutes(
  page: Page,
  options: {
    config?: typeof mockUnlockedEvaluationConfig;
  } = {},
) {
  const currentConfig = options.config ?? mockUnlockedEvaluationConfig;

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
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([mockSession]),
    });
  });

  await page.route('**/api/sessoes/sess-1', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockSession),
    });
  });

  await page.route('**/api/sessoes/sess-1/configuracao-avaliacao', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(currentConfig),
    });
  });

  await page.route('**/api/**tabelas-desempenho**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });
}

async function navigateToFinalScoreTab(
  page: Page,
  options: {
    config?: typeof mockUnlockedEvaluationConfig;
  } = {},
) {
  await setupAuth(page);
  await setupFormulaRoutes(page, options);
  await page.goto('/turmas/sala-1/problemas/prob-1/sessoes/sess-1/formulas');
  await page.getByRole('button', { name: 'Fórmula da Nota Final' }).click();
}

test.describe('Session Final Score Formula', () => {
  test.describe('Authentication and Access Control', () => {
    test('redirects unauthenticated users to login', async ({ page }) => {
      await page.goto('/turmas/sala-1/problemas/prob-1/sessoes/sess-1/formulas');
      await expect(page).toHaveURL(/\/entrar/);
    });
  });

  test.describe('Navigation and Initial Render', () => {
    test('loads tabs, switches to final score formula and displays essential components', async ({
      page,
    }) => {
      await navigateToFinalScoreTab(page);

      await expect(page.getByRole('heading', { name: 'Fórmulas', exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Fórmulas de Desempenho' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Fórmula da Nota Final' })).toBeVisible();

      await expect(
        page.getByRole('textbox', { name: 'Nota de Desempenho na Sessão' }),
      ).toBeVisible();
      await expect(
        page.getByRole('textbox', { name: 'Nota de Desempenho no Cargo' }),
      ).toBeVisible();

      await expect(
        page.getByText(
          'Ajuste automático: a soma dos pesos é sempre mantida em 10,0 (mínimo de 1,0 por peso).',
        ),
      ).toBeVisible();
      await expect(page.getByText('Soma dos pesos', { exact: true })).not.toBeVisible();

      await expect(page.getByRole('button', { name: 'Restaurar padrão' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Salvar fórmula' })).toBeVisible();
    });

    test('navigates back when clicking the header back button', async ({ page }) => {
      await setupAuth(page);
      await setupFormulaRoutes(page);
      await page.goto('/turmas/sala-1/problemas/prob-1/sessoes');
      await page.goto('/turmas/sala-1/problemas/prob-1/sessoes/sess-1/formulas');
      await page.getByRole('button', { name: 'Fórmula da Nota Final' }).click();

      await page.getByRole('button', { name: 'Voltar' }).click();
      await expect(page).toHaveURL('/turmas/sala-1/problemas/prob-1/sessoes');
    });
  });

  test.describe('Business Rules and Auto-adjust Weights', () => {
    test('automatically recalculates role weight when session weight is changed with stepper buttons', async ({
      page,
    }) => {
      await navigateToFinalScoreTab(page);

      const sessionInput = page.getByRole('textbox', { name: 'Nota de Desempenho na Sessão' });
      const roleInput = page.getByRole('textbox', { name: 'Nota de Desempenho no Cargo' });

      await expect(sessionInput).toHaveValue('7,0');
      await expect(roleInput).toHaveValue('3,0');

      await page.getByRole('button', { name: 'Aumentar nota de Desempenho na Sessão' }).click();
      await expect(sessionInput).toHaveValue('8,0');
      await expect(roleInput).toHaveValue('2,0');

      await page.getByRole('button', { name: 'Diminuir nota de Desempenho na Sessão' }).click();
      await expect(sessionInput).toHaveValue('7,0');
      await expect(roleInput).toHaveValue('3,0');
    });

    test('automatically recalculates session weight when role weight is changed directly in the input', async ({
      page,
    }) => {
      await navigateToFinalScoreTab(page);

      const sessionInput = page.getByRole('textbox', { name: 'Nota de Desempenho na Sessão' });
      const roleInput = page.getByRole('textbox', { name: 'Nota de Desempenho no Cargo' });

      await roleInput.fill('4,0');
      await roleInput.blur();

      await expect(roleInput).toHaveValue('4,0');
      await expect(sessionInput).toHaveValue('6,0');
    });

    test('enforces minimum of 1.0 and maximum of 9.0 by disabling stepper buttons at bounds', async ({
      page,
    }) => {
      await navigateToFinalScoreTab(page);

      const sessionInput = page.getByRole('textbox', { name: 'Nota de Desempenho na Sessão' });
      const roleInput = page.getByRole('textbox', { name: 'Nota de Desempenho no Cargo' });
      const decSessionBtn = page.getByRole('button', {
        name: 'Diminuir nota de Desempenho na Sessão',
      });
      const incRoleBtn = page.getByRole('button', {
        name: 'Aumentar nota de Desempenho no Cargo',
      });

      await sessionInput.fill('1,0');
      await sessionInput.blur();

      await expect(sessionInput).toHaveValue('1,0');
      await expect(roleInput).toHaveValue('9,0');
      await expect(decSessionBtn).toBeDisabled();
      await expect(incRoleBtn).toBeDisabled();
    });

    test('clamps values outside bounds to 1.0 and 9.0 when manually typed', async ({ page }) => {
      await navigateToFinalScoreTab(page);

      const sessionInput = page.getByRole('textbox', { name: 'Nota de Desempenho na Sessão' });
      const roleInput = page.getByRole('textbox', { name: 'Nota de Desempenho no Cargo' });

      await sessionInput.fill('0');
      await sessionInput.blur();
      await expect(sessionInput).toHaveValue('1,0');
      await expect(roleInput).toHaveValue('9,0');

      await sessionInput.fill('15');
      await sessionInput.blur();
      await expect(sessionInput).toHaveValue('9,0');
      await expect(roleInput).toHaveValue('1,0');
    });
  });

  test.describe('Save Scope Modal and Data Persistence', () => {
    test('opens scope modal and cancels without making a PUT request', async ({ page }) => {
      await navigateToFinalScoreTab(page);

      let putRequestTriggered = false;
      await page.route('**/api/sessoes/sess-1/formula', async (route) => {
        if (route.request().method() === 'PUT') {
          putRequestTriggered = true;
          await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
          return;
        }
        await route.continue();
      });

      await page.getByRole('button', { name: 'Aumentar nota de Desempenho na Sessão' }).click();
      await page.getByRole('button', { name: 'Salvar fórmula' }).click();

      await expect(page.getByRole('heading', { name: 'Salvar fórmula da nota' })).toBeVisible();
      await page.getByRole('button', { name: 'Cancelar' }).click();

      await expect(page.getByRole('heading', { name: 'Salvar fórmula da nota' })).not.toBeVisible();
      expect(putRequestTriggered).toBe(false);
    });

    test('saves formula for current session only and confirms persisted values upon reload', async ({
      page,
    }) => {
      let savedPayload: unknown = null;
      let activeConfig = { ...mockUnlockedEvaluationConfig };

      await setupAuth(page);

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
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([mockSession]),
        });
      });
      await page.route('**/api/sessoes/sess-1', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockSession),
        });
      });
      await page.route('**/api/**tabelas-desempenho**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      });

      await page.route('**/api/sessoes/sess-1/configuracao-avaliacao', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(activeConfig),
        });
      });

      await page.route('**/api/sessoes/sess-1/formula', async (route) => {
        if (route.request().method() === 'PUT') {
          savedPayload = route.request().postDataJSON();
          activeConfig = {
            ...activeConfig,
            formula: {
              padrao: false,
              versao: 2,
              componentes: [
                { tipo: 'CRITERIOS', peso: 80 },
                { tipo: 'PAPEL', peso: 20 },
              ],
            },
          };
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(activeConfig.formula),
          });
          return;
        }
        await route.continue();
      });

      await page.goto('/turmas/sala-1/problemas/prob-1/sessoes/sess-1/formulas');
      await page.getByRole('button', { name: 'Fórmula da Nota Final' }).click();

      const sessionInput = page.getByRole('textbox', { name: 'Nota de Desempenho na Sessão' });
      const roleInput = page.getByRole('textbox', { name: 'Nota de Desempenho no Cargo' });

      await page.getByRole('button', { name: 'Aumentar nota de Desempenho na Sessão' }).click();
      await expect(sessionInput).toHaveValue('8,0');
      await expect(roleInput).toHaveValue('2,0');

      await page.getByRole('button', { name: 'Salvar fórmula' }).click();

      const scopeCurrentRadio = page.getByRole('radio', { name: /Aplicar só nesta sessão/i });
      await scopeCurrentRadio.click();

      await page.getByRole('button', { name: 'Confirmar e salvar' }).click();

      await expect(page.getByText('Fórmula da nota final salva com sucesso.')).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Salvar fórmula da nota' })).not.toBeVisible();

      expect(savedPayload).toEqual({
        componentes: [
          { tipo: 'CRITERIOS', peso: 80 },
          { tipo: 'PAPEL', peso: 20 },
        ],
        aplicarNasSeguintes: false,
      });

      await page.reload();
      await page.getByRole('button', { name: 'Fórmula da Nota Final' }).click();

      await expect(page.getByRole('textbox', { name: 'Nota de Desempenho na Sessão' })).toHaveValue(
        '8,0',
      );
      await expect(page.getByRole('textbox', { name: 'Nota de Desempenho no Cargo' })).toHaveValue(
        '2,0',
      );
    });

    test('saves formula for current and following sessions', async ({ page }) => {
      let savedPayload: unknown = null;

      await setupAuth(page);
      await setupFormulaRoutes(page);

      await page.route('**/api/sessoes/sess-1/formula', async (route) => {
        if (route.request().method() === 'PUT') {
          savedPayload = route.request().postDataJSON();
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(mockCustomEvaluationConfig.formula),
          });
          return;
        }
        await route.continue();
      });

      await page.goto('/turmas/sala-1/problemas/prob-1/sessoes/sess-1/formulas');
      await page.getByRole('button', { name: 'Fórmula da Nota Final' }).click();

      await page.getByRole('button', { name: 'Aumentar nota de Desempenho na Sessão' }).click();
      await page.getByRole('button', { name: 'Salvar fórmula' }).click();

      const scopeFollowingRadio = page.getByRole('radio', { name: /Nesta e nas seguintes/i });
      await scopeFollowingRadio.click();

      await page.getByRole('button', { name: 'Confirmar e salvar' }).click();

      await expect(page.getByText('Fórmula da nota final salva com sucesso.')).toBeVisible();
      expect(savedPayload).toEqual({
        componentes: [
          { tipo: 'CRITERIOS', peso: 80 },
          { tipo: 'PAPEL', peso: 20 },
        ],
        aplicarNasSeguintes: true,
      });
    });

    test('displays warning when the session is locked with existing evaluations', async ({
      page,
    }) => {
      await navigateToFinalScoreTab(page, { config: mockLockedEvaluationConfig });

      await page.getByRole('button', { name: 'Aumentar nota de Desempenho na Sessão' }).click();
      await page.getByRole('button', { name: 'Salvar fórmula' }).click();

      await expect(page.getByText('Atenção: esta sessão já possui avaliações')).toBeVisible();
    });
  });

  test.describe('Formula Reset and Error Handling', () => {
    test('restores default formula values and displays success toast', async ({ page }) => {
      let restoreTriggered = false;

      await setupAuth(page);
      await setupFormulaRoutes(page, { config: mockCustomEvaluationConfig });

      await page.route('**/api/sessoes/sess-1/formula/restaurar-padrao', async (route) => {
        if (route.request().method() === 'POST') {
          restoreTriggered = true;
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(mockDefaultFormulaResponse),
          });
          return;
        }
        await route.continue();
      });

      await page.goto('/turmas/sala-1/problemas/prob-1/sessoes/sess-1/formulas');
      await page.getByRole('button', { name: 'Fórmula da Nota Final' }).click();

      const sessionInput = page.getByRole('textbox', { name: 'Nota de Desempenho na Sessão' });
      const roleInput = page.getByRole('textbox', { name: 'Nota de Desempenho no Cargo' });

      await expect(sessionInput).toHaveValue('8,0');
      await expect(roleInput).toHaveValue('2,0');

      await page.getByRole('button', { name: 'Restaurar padrão' }).click();

      await expect(page.getByText('Fórmula padrão (7,0 / 3,0) restaurada.')).toBeVisible();
      expect(restoreTriggered).toBe(true);

      await expect(sessionInput).toHaveValue('7,0');
      await expect(roleInput).toHaveValue('3,0');
    });

    test('retains open modal when the server responds with an error', async ({ page }) => {
      await setupAuth(page);
      await setupFormulaRoutes(page);

      await page.route('**/api/sessoes/sess-1/formula', async (route) => {
        if (route.request().method() === 'PUT') {
          await route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ mensagem: 'Falha interna no servidor.' }),
          });
          return;
        }
        await route.continue();
      });

      await page.goto('/turmas/sala-1/problemas/prob-1/sessoes/sess-1/formulas');
      await page.getByRole('button', { name: 'Fórmula da Nota Final' }).click();

      await page.getByRole('button', { name: 'Aumentar nota de Desempenho na Sessão' }).click();
      await page.getByRole('button', { name: 'Salvar fórmula' }).click();

      await page.getByRole('button', { name: 'Confirmar e salvar' }).click();

      await expect(page.getByText('Fórmula da nota final salva com sucesso.')).not.toBeVisible();
      await expect(page.getByRole('heading', { name: 'Salvar fórmula da nota' })).toBeVisible();
    });
  });

  test.describe('Edge Cases and User Input Resilience', () => {
    test('rejects non-numeric characters in stepper inputs', async ({ page }) => {
      await navigateToFinalScoreTab(page);

      const sessionInput = page.getByRole('textbox', { name: 'Nota de Desempenho na Sessão' });
      await sessionInput.fill('abc');
      await sessionInput.blur();

      await expect(sessionInput).toHaveValue('7,0');
    });

    test('falls back to minimum value 1.0 when input is cleared and blurred', async ({ page }) => {
      await navigateToFinalScoreTab(page);

      const sessionInput = page.getByRole('textbox', { name: 'Nota de Desempenho na Sessão' });
      const roleInput = page.getByRole('textbox', { name: 'Nota de Desempenho no Cargo' });

      await sessionInput.fill('');
      await sessionInput.blur();

      await expect(sessionInput).toHaveValue('1,0');
      await expect(roleInput).toHaveValue('9,0');
    });

    test('dismisses scope modal without saving when clicking cancel button', async ({ page }) => {
      let putRequestTriggered = false;

      await setupAuth(page);
      await setupFormulaRoutes(page);

      await page.route('**/api/sessoes/sess-1/formula', async (route) => {
        if (route.request().method() === 'PUT') {
          putRequestTriggered = true;
          await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
          return;
        }
        await route.continue();
      });

      await page.goto('/turmas/sala-1/problemas/prob-1/sessoes/sess-1/formulas');
      await page.getByRole('button', { name: 'Fórmula da Nota Final' }).click();

      await page.getByRole('button', { name: 'Aumentar nota de Desempenho na Sessão' }).click();
      await page.getByRole('button', { name: 'Salvar fórmula' }).click();

      const modalHeading = page.getByRole('heading', { name: 'Salvar fórmula da nota' });
      await expect(modalHeading).toBeVisible();

      await page.getByRole('button', { name: 'Cancelar' }).click();
      await expect(modalHeading).not.toBeVisible();
      expect(putRequestTriggered).toBe(false);
    });

    test('preserves formula state when switching between tabs before saving', async ({ page }) => {
      await navigateToFinalScoreTab(page);

      const sessionInput = page.getByRole('textbox', { name: 'Nota de Desempenho na Sessão' });
      const roleInput = page.getByRole('textbox', { name: 'Nota de Desempenho no Cargo' });

      await page.getByRole('button', { name: 'Aumentar nota de Desempenho na Sessão' }).click();
      await expect(sessionInput).toHaveValue('8,0');
      await expect(roleInput).toHaveValue('2,0');

      const perfTab = page.getByRole('button', { name: 'Fórmulas de Desempenho' });
      const finalTab = page.getByRole('button', { name: 'Fórmula da Nota Final' });

      await perfTab.click();
      await expect(perfTab).toHaveClass(/border-white/);

      await finalTab.click();
      await expect(finalTab).toHaveClass(/border-white/);

      await expect(sessionInput).toBeVisible();
      await expect(roleInput).toBeVisible();
    });
  });
});
