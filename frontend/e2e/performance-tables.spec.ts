import { test, expect, type Page } from '@playwright/test';
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

const mockPermissions = {
  podeEditarCriterios: true,
  motivo: '',
  sessoesQueUsam: [
    { sessaoId: 'sess-1', rotulo: 'P1S1', jaAconteceu: false },
    { sessaoId: 'sess-2', rotulo: 'P1S2', jaAconteceu: false },
  ],
};

async function setupTeacherAuth(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem(
      'pbl360.session',
      JSON.stringify({
        token: 'mock-teacher-token',
        expiraEm: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        usuario: {
          id: 'user-tutor-titular-1',
          nome: 'Professor Titular',
          email: 'titular@uefs.br',
          tipo: 'TUTOR',
          ativo: true,
        },
      }),
    );
  });
}

async function setupCoTutorAuth(page: Page) {
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
}

async function setupBaseRoutes(page: Page) {
  await page.route('**/api/tabelas-desempenho', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([mockSharedTable, mockOwnTable, mockDefaultTable]),
      });
    } else {
      await route.fallback();
    }
  });

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

  await page.route('**/api/sessoes/sess-1/tabela/permissoes-edicao', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockPermissions),
    });
  });
}

test.describe('Performance Tables - Creation and Weight Rules', () => {
  test.beforeEach(async ({ page }) => {
    await setupTeacherAuth(page);
    await setupBaseRoutes(page);
  });

  test('keeps save button disabled and displays balance warning while total weight is not 10', async ({
    page,
  }) => {
    await page.goto('/formulas/nova');

    await expect(page.getByRole('heading', { level: 1, name: /nova fórmula/i })).toBeVisible();
    await expect(page.getByText('Soma dos pesos', { exact: true })).toBeVisible();
    await expect(page.getByText('0 / 10')).toBeVisible();
    await expect(
      page.getByText('A soma dos pesos deve ser exatamente 10 (atual: 0).'),
    ).toBeVisible();

    const saveButton = page.getByRole('button', { name: 'Salvar Fórmula' });
    await expect(saveButton).toBeDisabled();
  });

  test('enforces weight bounds [0, 10] and formats typed dot to comma with at most one decimal place', async ({
    page,
  }) => {
    await page.goto('/formulas/nova');

    await page.getByRole('button', { name: '+Adicionar critério' }).click();
    await expect(page.getByRole('heading', { level: 2, name: 'Novo Critério' })).toBeVisible();

    const nameInput = page.getByLabel('Nome do critério');
    const weightInput = page.getByLabel('Peso (0 a 10)');

    await expect(weightInput).toHaveAttribute('min', '0');
    await expect(weightInput).toHaveAttribute('max', '10');

    await nameInput.fill('Critério Teste');
    await weightInput.fill('4.55');
    await expect(weightInput).toHaveValue('4,5');

    await weightInput.fill('15');
    await page.getByRole('button', { name: 'Adicionar', exact: true }).click();

    await expect(page.getByText('O peso do critério deve estar entre 0 e 10.')).toBeVisible();
  });

  test('allows adding criteria exceeding 10 without blocking and enables save once balanced at 10', async ({
    page,
  }) => {
    await page.goto('/formulas/nova');

    await page.getByRole('button', { name: '+Adicionar critério' }).click();
    await page.getByLabel('Nome do critério').fill('Critério 1');
    const weightInput1 = page.getByLabel('Peso (0 a 10)');
    await weightInput1.fill('6.5');
    await expect(weightInput1).toHaveValue('6,5');
    await page.getByRole('button', { name: 'Adicionar', exact: true }).click();

    await expect(page.getByText('Critério 1')).toBeVisible();
    await expect(page.getByText('6,5', { exact: true })).toBeVisible();
    await expect(page.getByText('6,5 / 10')).toBeVisible();
    await expect(
      page.getByText('A soma dos pesos deve ser exatamente 10 (atual: 6,5).'),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Salvar Fórmula' })).toBeDisabled();

    await page.getByRole('button', { name: '+Adicionar critério' }).click();
    await page.getByLabel('Nome do critério').fill('Critério 2');
    const weightInput2 = page.getByLabel('Peso (0 a 10)');
    await weightInput2.fill('5.5');
    await expect(weightInput2).toHaveValue('5,5');
    await page.getByRole('button', { name: 'Adicionar', exact: true }).click();

    await expect(page.getByText('Critério 2')).toBeVisible();
    await expect(page.getByText('12 / 10')).toBeVisible();
    await expect(page.getByText('A soma dos pesos ultrapassou 10 (total: 12).')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Salvar Fórmula' })).toBeDisabled();

    await page.getByRole('button', { name: 'Editar critério Critério 2' }).click();
    const editWeight = page.getByLabel('Peso');
    await editWeight.fill('3.5');
    await expect(editWeight).toHaveValue('3,5');
    await page.getByRole('button', { name: 'Salvar Edição' }).click();

    await expect(page.getByText('10 / 10')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Salvar Fórmula' })).toBeEnabled();
  });

  test('submits new performance table successfully when weights equal 10', async ({ page }) => {
    let capturedPayload: unknown = null;

    await page.route('**/api/tabelas-desempenho', async (route) => {
      if (route.request().method() === 'POST') {
        capturedPayload = route.request().postDataJSON();
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            ...mockSharedTable,
            id: 'table-new-1',
            nome: 'Fórmula Completa',
          }),
        });
      } else {
        await route.fallback();
      }
    });

    await page.goto('/formulas/nova');

    await page.locator('#title-input').fill('Fórmula Completa');

    await page.getByRole('button', { name: '+Adicionar critério' }).click();
    await page.getByLabel('Nome do critério').fill('Critério Único');
    await page.getByLabel('Peso (0 a 10)').fill('10');
    await page.getByRole('button', { name: 'Adicionar', exact: true }).click();

    const saveButton = page.getByRole('button', { name: 'Salvar Fórmula' });
    await expect(saveButton).toBeEnabled();
    await saveButton.click();

    await expect(page).toHaveURL(/\/formulas/);
    expect(capturedPayload).toMatchObject({
      nome: 'Fórmula Completa',
      criterios: [
        expect.objectContaining({
          nome: 'Critério Único',
          peso: 10,
        }),
      ],
    });
  });
});

test.describe('Performance Tables - Edition Flow and Scope', () => {
  test.beforeEach(async ({ page }) => {
    await setupTeacherAuth(page);
    await setupBaseRoutes(page);
  });

  test('disables concluding edit when criterion deletion breaks balance and enables when weights equal 10', async ({
    page,
  }) => {
    await page.goto('/formulas/table-shared-1/editar');

    await expect(
      page.getByRole('heading', { level: 1, name: 'Barema de Avaliação PBL' }),
    ).toBeVisible();
    await expect(page.getByText('10 / 10')).toBeVisible();

    const concludeButton = page.getByRole('button', { name: 'Concluir edição' });
    await expect(concludeButton).toBeEnabled();

    await page.getByRole('button', { name: 'Excluir critério Domínio do Conteúdo' }).click();
    await expect(page.getByRole('heading', { name: 'Excluir critério?' })).toBeVisible();
    await page.getByRole('button', { name: 'Sim, excluir critério' }).click();

    await expect(concludeButton).toBeDisabled();
    await expect(page.getByText('5 / 10')).toBeVisible();
    await expect(
      page.getByText('A soma dos pesos deve ser exatamente 10 (atual: 5).'),
    ).toBeVisible();

    await page.getByRole('button', { name: 'Editar critério Comportamento e Postura' }).click();
    const editWeight = page.getByLabel('Peso');
    await editWeight.fill('10');
    await page.getByRole('button', { name: 'Salvar Edição' }).click();

    await expect(page.getByText('10 / 10')).toBeVisible();
    await expect(concludeButton).toBeEnabled();
  });

  test('formats decimal weight with comma when editing criterion', async ({ page }) => {
    await page.goto('/formulas/table-shared-1/editar');

    await expect(
      page.getByRole('heading', { level: 1, name: 'Barema de Avaliação PBL' }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Editar critério Comportamento e Postura' }).click();

    const weightInput = page.getByLabel('Peso');
    await expect(weightInput).toHaveValue('5');

    await weightInput.fill('4.55');
    await expect(weightInput).toHaveValue('4,5');

    await page.getByRole('button', { name: 'Salvar Edição' }).click();

    await expect(page.getByText('4,5', { exact: true })).toBeVisible();
    await expect(page.getByText('9,5 / 10')).toBeVisible();
  });

  test('saves edited table with warning modal and confirms update', async ({ page }) => {
    let capturedPut: unknown = null;

    await mockAuthenticatedShell(page);
    await page.route('**/api/tabelas-desempenho/table-shared-1', async (route) => {
      if (route.request().method() === 'PUT') {
        capturedPut = route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockSharedTable),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockSharedTable),
        });
      }
    });

    await page.goto('/formulas/table-shared-1/editar');

    await expect(
      page.getByRole('heading', { level: 1, name: 'Barema de Avaliação PBL' }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Concluir edição' }).click();

    await expect(
      page.getByRole('heading', { name: 'Salvar alterações na fórmula?' }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Confirmar e salvar' }).click();

    await expect(page).toHaveURL(/\/formulas/);
    expect(capturedPut).toMatchObject({
      nome: 'Barema de Avaliação PBL',
      criterios: [
        expect.objectContaining({ nome: 'Comportamento e Postura', peso: 5 }),
        expect.objectContaining({ nome: 'Domínio do Conteúdo', peso: 5 }),
      ],
    });
  });
});

test.describe('Performance Tables - My Formulas Flow', () => {
  test.beforeEach(async ({ page }) => {
    await setupTeacherAuth(page);
    await setupBaseRoutes(page);
  });

  test('creates personal formula in My Formulas with decimal weights and comma formatting', async ({
    page,
  }) => {
    let capturedCreate: unknown = null;

    await page.route('**/api/tabelas-desempenho', async (route) => {
      if (route.request().method() === 'POST') {
        capturedCreate = route.request().postDataJSON();
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            ...mockOwnTable,
            id: 'table-new-personal',
            nome: 'Fórmula Pessoal de Algoritmos',
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([mockOwnTable]),
        });
      }
    });

    await page.goto('/minhas-formulas/nova');

    await expect(page.getByRole('heading', { level: 1, name: 'Nova fórmula' })).toBeVisible();
    await page.locator('#title-input').fill('Fórmula Pessoal de Algoritmos');

    await page.getByRole('button', { name: '+Adicionar critério' }).click();
    await page.getByLabel('Nome do critério').fill('Raciocínio');
    const weight1 = page.getByLabel('Peso (0 a 10)');
    await weight1.fill('4.5');
    await expect(weight1).toHaveValue('4,5');
    await page.getByRole('button', { name: 'Adicionar', exact: true }).click();

    await expect(page.getByText('4,5', { exact: true })).toBeVisible();
    await expect(page.getByText('4,5 / 10')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Salvar Fórmula' })).toBeDisabled();

    await page.getByRole('button', { name: '+Adicionar critério' }).click();
    await page.getByLabel('Nome do critério').fill('Implementação');
    const weight2 = page.getByLabel('Peso (0 a 10)');
    await weight2.fill('5.5');
    await expect(weight2).toHaveValue('5,5');
    await page.getByRole('button', { name: 'Adicionar', exact: true }).click();

    await expect(page.getByText('10 / 10')).toBeVisible();
    const saveBtn = page.getByRole('button', { name: 'Salvar Fórmula' });
    await expect(saveBtn).toBeEnabled();
    await saveBtn.click();

    await expect(page).toHaveURL(/\/minhas-formulas/);
    expect(capturedCreate).toMatchObject({
      nome: 'Fórmula Pessoal de Algoritmos',
      criterios: [
        expect.objectContaining({ nome: 'Raciocínio', peso: 4.5 }),
        expect.objectContaining({ nome: 'Implementação', peso: 5.5 }),
      ],
    });
  });

  test('edits personal formula in My Formulas, displays scope warning modal and saves successfully', async ({
    page,
  }) => {
    let capturedUpdate: unknown = null;

    await page.route('**/api/tabelas-desempenho/table-own-1', async (route) => {
      if (route.request().method() === 'PUT') {
        capturedUpdate = route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockOwnTable),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockOwnTable),
        });
      }
    });

    await page.goto('/minhas-formulas/table-own-1/editar');

    await expect(
      page.getByRole('heading', { level: 1, name: 'Minha Fórmula Pessoal' }),
    ).toBeVisible();
    await expect(page.getByText('10 / 10')).toBeVisible();

    await page.getByRole('button', { name: 'Concluir edição' }).click();

    await expect(page.getByText('Salvar alterações na fórmula?')).toBeVisible();
    await expect(page.getByText(/apenas na sua fórmula original/i)).toBeVisible();

    await page.getByRole('button', { name: 'Confirmar e salvar' }).click();

    await expect(page).toHaveURL(/\/minhas-formulas/);
    expect(capturedUpdate).toMatchObject({
      nome: 'Minha Fórmula Pessoal',
      criterios: [
        expect.objectContaining({ nome: 'Comportamento e Postura', peso: 5 }),
        expect.objectContaining({ nome: 'Domínio do Conteúdo', peso: 5 }),
      ],
    });
  });
});

test.describe('Performance Tables - Co-tutor Flow (Closes #457)', () => {
  test.beforeEach(async ({ page }) => {
    await setupCoTutorAuth(page);
    await setupBaseRoutes(page);

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
