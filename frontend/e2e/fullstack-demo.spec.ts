import { test, expect } from '@playwright/test';

/**
 * Teste E2E Full-Stack Completo do PBL360
 *
 * FLUXO COMPLETO REAL (Sem mocks - Navegador -> NestJS -> PostgreSQL):
 * 1. Autenticação real com usuário do seed (carlos@uefs.br / senha-secreta)
 * 2. Listagem de turmas do banco de dados PostgreSQL
 * 3. Acesso à turma 'Engenharia de Software - Turma A'
 * 4. Criação de um NOVO PROBLEMA via formulário e persistência no banco (POST /api/salas/:id/problemas)
 * 5. Acesso ao novo problema criado
 * 6. Criação de uma NOVA SESSÃO via modal e persistência no banco (POST /api/salas/:id/problemas/:id/sessoes)
 * 7. Validação visual em tela dos dados recém-gravados no banco PostgreSQL!
 */

test.describe('E2E Full-Stack: Fluxo Contínuo Completo (Login -> Turma -> Criar Problema -> Criar Sessão)', () => {
  test.beforeEach(async () => {
    // Verifica se o backend NestJS está ativo antes de rodar o teste
    try {
      const response = await fetch('http://localhost:3000/api/health', { method: 'GET' });
      if (!response.ok && response.status !== 401 && response.status !== 404) {
        test.skip(true, 'Backend não respondeu com sucesso em http://localhost:3000');
      }
    } catch {
      test.skip(
        true,
        'Backend NestJS não está rodando em http://localhost:3000. Inicie com "npm run dev:backend".',
      );
    }
  });

  test('deve executar o fluxo completo de ponta a ponta gerando logs reais no backend', async ({
    page,
  }) => {
    const runId = Date.now().toString().slice(-4);
    const problemTitle = `Problema E2E ${runId}`;
    const sessionTitle = `Sessão Tutorial ${runId}`;

    // ==========================================
    // ETAPA 1: Login Real do Professor
    // ==========================================
    await page.goto('/entrar');

    const emailInput = page.getByLabel('Email Institucional');
    const senhaInput = page.getByPlaceholder('Informe sua senha');
    const submitBtn = page.getByRole('button', { name: 'Entrar' });

    await expect(emailInput).toBeVisible();
    await emailInput.fill('carlos@uefs.br');
    await senhaInput.fill('senha-secreta');

    // Dispara POST /api/autenticacao/login real
    await submitBtn.click();

    // ==========================================
    // ETAPA 2: Listagem de Turmas Reais
    // ==========================================
    await expect(page).toHaveURL(/\/turmas/, { timeout: 10000 });

    // Dispara GET /api/salas real e localiza a turma seedada no PostgreSQL
    const roomHeading = page.getByRole('heading', {
      level: 3,
      name: 'Engenharia de Software - Turma A',
    });
    await expect(roomHeading).toBeVisible({ timeout: 10000 });

    // ==========================================
    // ETAPA 3: Acessar a Turma
    // ==========================================
    // Dispara GET /api/salas/:id e GET /api/salas/:id/problemas
    await roomHeading.click();
    await expect(page).toHaveURL(/\/turmas\/[a-zA-Z0-9-]+\/problemas/, { timeout: 10000 });

    // Confirma que a tela carregou os dados do banco
    await expect(
      page.getByRole('heading', { level: 3, name: 'Problema 1 - Prontuário Eletrônico' }),
    ).toBeVisible({ timeout: 10000 });

    // ==========================================
    // ETAPA 4: Criar um Novo Problema no Banco de Dados
    // ==========================================
    // Abre o menu flutuante (FAB) de ações de problema
    const problemFabBtn = page.getByRole('button', { name: 'Ações de problema' });
    await expect(problemFabBtn).toBeVisible();
    await problemFabBtn.click();

    // Clica na opção de criar novo problema
    const createProblemOption = page.getByRole('button', { name: 'Criar novo problema' });
    await expect(createProblemOption).toBeVisible();
    await createProblemOption.click();

    // O modal se abre
    const problemModal = page.getByRole('dialog');
    await expect(problemModal).toBeVisible();
    await expect(problemModal.getByRole('heading', { name: 'Criar Problema' })).toBeVisible();

    // Preenche o título do novo problema
    await page.getByLabel('Título do Problema').fill(problemTitle);

    // Submete o formulário -> dispara POST /api/salas/:id/problemas real no NestJS!
    await problemModal.getByRole('button', { name: 'Criar Problema' }).click();

    // Valida que o modal fechou e o novo problema apareceu na lista
    await expect(problemModal).not.toBeVisible();
    const newProblemCard = page.getByRole('heading', { level: 3, name: problemTitle });
    await expect(newProblemCard).toBeVisible({ timeout: 10000 });

    // ==========================================
    // ETAPA 5: Entrar no Novo Problema Criado
    // ==========================================
    // Clica no card do problema recém-persistido no PostgreSQL
    await newProblemCard.click();
    await expect(page).toHaveURL(/\/turmas\/[a-zA-Z0-9-]+\/problemas\/[a-zA-Z0-9-]+/, {
      timeout: 10000,
    });

    // ==========================================
    // ETAPA 6: Criar uma Nova Sessão para o Problema
    // ==========================================
    // Abre o menu flutuante (FAB) de ações da sessão
    const sessionFabBtn = page.getByRole('button', { name: 'Ações da sessão' });
    await expect(sessionFabBtn).toBeVisible();
    await sessionFabBtn.click();

    // Clica em 'Criar nova sessão'
    const createSessionOption = page.getByRole('button', { name: 'Criar nova sessão' });
    await expect(createSessionOption).toBeVisible();
    await createSessionOption.click();

    // O modal de sessão se abre
    const sessionModal = page.getByRole('dialog');
    await expect(sessionModal).toBeVisible();
    await expect(sessionModal.getByRole('heading', { name: 'Criar Sessão' })).toBeVisible();

    // Preenche os campos da sessão
    await page.getByLabel('Título da Sessão').fill(sessionTitle);
    await page
      .getByLabel('Descrição da Sessão')
      .fill('Sessão criada no teste E2E Full-Stack ao vivo.');
    await page.getByLabel('Data da Sessão').fill('25/11/2026');

    // Submete o formulário -> dispara POST /api/salas/:id/problemas/:id/sessoes real no NestJS!
    await sessionModal.getByRole('button', { name: 'Criar sessão' }).click();

    // Valida que o modal fechou
    await expect(sessionModal).not.toBeVisible();

    // ==========================================
    // ETAPA 7: Validar que a Sessão Real Aparece na Tela
    // ==========================================
    await expect(page.getByRole('heading', { level: 3, name: sessionTitle })).toBeVisible({
      timeout: 10000,
    });

    // Valida a data formatada exibida no card da sessão
    await expect(page.getByText('25 nov')).toBeVisible();
  });
});
