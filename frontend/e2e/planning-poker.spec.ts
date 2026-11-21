import { test, expect, type BrowserContext, type Page } from '@playwright/test';

const API_BASE_URL = 'http://localhost:3000/api';

const TUTOR_CREDENTIALS = {
  email: 'carlos@uefs.br',
  password: 'senha-secreta',
};

const STUDENT_CREDENTIALS = {
  email: '20240001@discente.uefs.br',
  password: 'senha-secreta',
  name: 'Ana Souza',
};

const PEER_VOTER_CREDENTIALS = {
  email: '20240002@discente.uefs.br',
  password: 'senha-secreta',
  name: 'João Silva',
};

async function loginViaApi(email: string, password: string): Promise<string> {
  const loginRes = await fetch(`${API_BASE_URL}/autenticacao/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, senha: password }),
  });
  expect(loginRes.ok).toBe(true);
  const { token } = (await loginRes.json()) as { token: string };
  return token;
}

async function ensureCommitmentTermAccepted(email: string, password: string): Promise<string> {
  const token = await loginViaApi(email, password);
  const termRes = await fetch(`${API_BASE_URL}/termos-compromisso/vigente`);
  if (termRes.ok) {
    const { versao } = (await termRes.json()) as { versao: string };
    await fetch(`${API_BASE_URL}/usuarios/meu-aceite-termo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ versao }),
    });
  }
  return token;
}

async function authenticateViaUi(page: Page, email: string, password: string): Promise<void> {
  await ensureCommitmentTermAccepted(email, password);
  await page.goto('/entrar');

  const emailInput = page.getByLabel('Email Institucional');
  const passwordInput = page.getByPlaceholder('Informe sua senha');
  const submitButton = page.getByRole('button', { name: 'Entrar' });

  await expect(emailInput).toBeVisible();
  await emailInput.fill(email);
  await passwordInput.fill(password);
  await submitButton.click();

  await expect(page).toHaveURL(/\/turmas/, { timeout: 15000 });
}

async function castPeerVoteViaApi(sessionId: string, nota: number): Promise<void> {
  const token = await ensureCommitmentTermAccepted(
    PEER_VOTER_CREDENTIALS.email,
    PEER_VOTER_CREDENTIALS.password,
  );

  const stateRes = await fetch(`${API_BASE_URL}/sessoes/${sessionId}/poker`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(stateRes.ok).toBe(true);
  const state = (await stateRes.json()) as { rodadaAtual: { rodadaId: string } | null };
  const roundId = state.rodadaAtual?.rodadaId;
  expect(roundId).toBeTruthy();

  const voteRes = await fetch(
    `${API_BASE_URL}/sessoes/${sessionId}/poker/rodadas/${roundId}/voto`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ nota }),
    },
  );
  expect(voteRes.ok).toBe(true);
}

test.describe('Planning Poker - Fluxo E2E Multi-Usuário e Persistente', () => {
  test.beforeEach(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/saude`, { method: 'GET' });
      if (!response.ok) {
        test.skip(true, 'Backend não respondeu com sucesso em http://localhost:3000/api/saude');
      }
    } catch {
      test.skip(
        true,
        'Backend NestJS não está rodando em http://localhost:3000. Inicie com "npm run dev:backend".',
      );
    }
  });

  test('deve executar o fluxo completo de Planning Poker em tempo real entre tutor e discente com persistência no PostgreSQL', async ({
    browser,
    baseURL,
  }) => {
    test.setTimeout(90000);

    const appBaseUrl = baseURL ?? 'http://localhost:5173';
    const runId = `${Date.now().toString().slice(-5)}-${Math.floor(Math.random() * 900 + 100)}`;
    const sessionTitle = `Sessão Poker E2E ${runId}`;

    const contexts: BrowserContext[] = [];

    try {
      const tutorContext = await browser.newContext({ baseURL: appBaseUrl });
      contexts.push(tutorContext);
      const tutorPage = await tutorContext.newPage();

      let sessionHubPath = '';
      let sessionId = '';

      await test.step('Passo 1: Setup, Isolamento e Bloqueio Inicial (Contexto Professor)', async () => {
        await authenticateViaUi(tutorPage, TUTOR_CREDENTIALS.email, TUTOR_CREDENTIALS.password);

        const roomHeading = tutorPage.getByRole('heading', {
          level: 3,
          name: 'Engenharia de Software - Turma A',
        });
        await expect(roomHeading).toBeVisible({ timeout: 10000 });
        await roomHeading.click();

        await expect(tutorPage).toHaveURL(/\/turmas\/[a-zA-Z0-9-]+\/problemas/, {
          timeout: 10000,
        });

        const problemHeading = tutorPage.getByRole('heading', {
          level: 3,
          name: 'Problema 1 - Prontuário Eletrônico',
        });
        await expect(problemHeading).toBeVisible({ timeout: 10000 });
        await problemHeading.click();

        await expect(tutorPage).toHaveURL(/\/turmas\/[a-zA-Z0-9-]+\/problemas\/[a-zA-Z0-9-]+$/, {
          timeout: 10000,
        });

        const sessionFabBtn = tutorPage.getByRole('button', { name: 'Ações da sessão' });
        await expect(sessionFabBtn).toBeVisible();
        await sessionFabBtn.click();

        const createSessionOption = tutorPage.getByRole('button', { name: 'Criar nova sessão' });
        await expect(createSessionOption).toBeVisible();
        await createSessionOption.click();

        const sessionModal = tutorPage.getByRole('dialog');
        await expect(sessionModal).toBeVisible();
        await expect(sessionModal.getByRole('heading', { name: 'Criar Sessão' })).toBeVisible();

        await tutorPage.getByLabel('Título da Sessão').fill(sessionTitle);
        await tutorPage
          .getByLabel('Descrição da Sessão')
          .fill(`Sessão isolada para teste E2E do Planning Poker (${runId}).`);
        await tutorPage.getByLabel('Data da Sessão').fill('25/11/2026');

        await sessionModal.getByRole('button', { name: 'Criar sessão' }).click();
        await expect(sessionModal).not.toBeVisible();

        const createdSessionCard = tutorPage.getByRole('heading', {
          level: 3,
          name: new RegExp(sessionTitle),
        });
        await expect(createdSessionCard).toBeVisible({ timeout: 10000 });
        await createdSessionCard.click();

        await expect(tutorPage).toHaveURL(
          /\/turmas\/[a-zA-Z0-9-]+\/problemas\/[a-zA-Z0-9-]+\/sessoes\/[a-zA-Z0-9-]+$/,
          { timeout: 10000 },
        );

        sessionHubPath = new URL(tutorPage.url()).pathname;
        sessionId = sessionHubPath.split('/').pop() ?? '';
        expect(sessionId).toBeTruthy();

        await expect(tutorPage.getByText('Salve a chamada para começar.')).toBeVisible();

        await tutorPage.getByRole('link', { name: /Chamada/i }).click();
        await expect(tutorPage).toHaveURL(`${sessionHubPath}/chamada`);

        const saveRollCallButton = tutorPage.getByRole('button', { name: 'Salvar chamada' });
        await expect(saveRollCallButton).toBeVisible();

        const seatEveryoneButton = tutorPage.getByRole('button', { name: 'Todos presentes' });
        if (await seatEveryoneButton.isEnabled()) {
          await seatEveryoneButton.click();
        }

        await expect(saveRollCallButton).toBeEnabled();
        await saveRollCallButton.click();
        await expect(tutorPage.getByText('Chamada salva.')).toBeVisible();

        await tutorPage.getByRole('button', { name: 'Voltar' }).click();
        await expect(tutorPage).toHaveURL(sessionHubPath);

        const pokerHubButton = tutorPage.getByRole('button', { name: /Planning poker/i });
        await expect(pokerHubButton).toBeVisible();
        await pokerHubButton.click();

        const startPokerModal = tutorPage.getByRole('dialog', {
          name: 'Iniciar planning poker',
        });
        await expect(startPokerModal).toBeVisible();

        await startPokerModal.getByRole('radio', { name: /Com nomes/i }).click();
        await startPokerModal.getByRole('radio', { name: /Sequencial/i }).click();
        await startPokerModal.getByRole('button', { name: 'Iniciar' }).click();

        await expect(tutorPage).toHaveURL(`${sessionHubPath}/planning-poker`);

        await tutorPage.getByRole('button', { name: 'Voltar' }).click();
        await expect(tutorPage).toHaveURL(sessionHubPath);

        await expect(tutorPage.getByText('Bloqueado')).toBeVisible();
        await expect(tutorPage.getByText('Planning poker em andamento na mesa.')).toBeVisible();
        await expect(tutorPage.getByRole('link', { name: /Avaliar alunos/i })).toHaveCount(0);

        await tutorPage.goto(`${sessionHubPath}/avaliar`);
        await expect(
          tutorPage.getByRole('heading', { name: 'Planning poker em andamento' }),
        ).toBeVisible();
        await expect(
          tutorPage.getByText(
            'A avaliação direta do tutor está bloqueada enquanto o planning poker estiver ativo nesta sessão.',
          ),
        ).toBeVisible();

        const disabledEvalButtons = tutorPage.getByRole('button', { name: 'Avaliar' });
        await expect(disabledEvalButtons.first()).toBeDisabled();
      });

      await test.step('Passo 2: Abertura da Mesa e Início da Rodada (Contexto Professor)', async () => {
        await tutorPage.goto(`${sessionHubPath}/planning-poker`);

        await expect(tutorPage.getByText('Ao vivo')).toBeVisible();
        await expect(tutorPage.getByText('Com nomes')).toBeVisible();
        await expect(tutorPage.getByText('Pronto para a rodada 1')).toBeVisible();

        const tutorialTable = tutorPage.getByRole('group', { name: 'Mesa tutorial' });
        await expect(tutorialTable).toBeVisible();
        await expect(
          tutorialTable.getByRole('img', { name: STUDENT_CREDENTIALS.name }),
        ).toBeVisible();

        await tutorPage.getByRole('button', { name: 'Editar fila' }).click();
        const queueDialog = tutorPage.getByRole('dialog', { name: 'Editar fila' });
        await expect(queueDialog).toBeVisible();
        await queueDialog
          .getByRole('button', { name: `Descer ${STUDENT_CREDENTIALS.name}` })
          .click();
        await queueDialog.getByRole('button', { name: 'Salvar fila' }).click();
        await expect(queueDialog).not.toBeVisible();

        await tutorPage.getByRole('button', { name: 'Próximo aluno' }).click();

        await expect(tutorPage.getByText(/Rodada 1 de \d+/)).toBeVisible();
        await expect(tutorialTable.getByText('Em avaliação')).toBeVisible();
        await expect(tutorPage.getByText(/0 de \d+ votaram/)).toBeVisible();
        await expect(
          tutorialTable.getByRole('img', {
            name: `${STUDENT_CREDENTIALS.name}, aguardando voto`,
          }),
        ).toBeVisible();
        await expect(tutorPage.getByRole('button', { name: 'Revelar votos' })).toBeDisabled();
      });

      await test.step('Passo 3: Votação em Tempo Real (Multi-Contexto Browser)', async () => {
        const studentContext = await browser.newContext({ baseURL: appBaseUrl });
        contexts.push(studentContext);
        const studentPage = await studentContext.newPage();

        await authenticateViaUi(
          studentPage,
          STUDENT_CREDENTIALS.email,
          STUDENT_CREDENTIALS.password,
        );

        await studentPage.goto(sessionHubPath);
        await expect(studentPage.getByText('Planning poker em andamento')).toBeVisible();
        await studentPage.getByRole('button', { name: 'Participar' }).click();

        await expect(studentPage).toHaveURL(`${sessionHubPath}/planning-poker`);
        await expect(studentPage.getByText('Ao vivo')).toBeVisible();
        await expect(studentPage.getByText('Sua nota', { exact: true })).toBeVisible();

        const card85 = studentPage.getByRole('button', { name: '8,5', exact: true });
        await expect(card85).toBeVisible();
        await card85.click();
        await expect(card85).toHaveAttribute('aria-pressed', 'true');

        await studentPage.getByRole('button', { name: 'Votar' }).click();

        await expect(
          studentPage.getByText('Voto enviado — você pode trocar até o tutor revelar'),
        ).toBeVisible();
        await expect(studentPage.getByText(/1 de \d+ colegas votaram/)).toBeVisible();

        const tutorialTable = tutorPage.getByRole('group', { name: 'Mesa tutorial' });
        await expect(tutorPage.getByText(/1 de \d+ votaram/)).toBeVisible();
        await expect(
          tutorialTable.getByRole('img', { name: `${STUDENT_CREDENTIALS.name}, já votou` }),
        ).toBeVisible();
        await expect(tutorPage.getByRole('button', { name: 'Revelar votos' })).toBeEnabled();
      });

      await test.step('Passo 4: Revelação, Consenso e Persistência (DECIDED)', async () => {
        const tutorialTable = tutorPage.getByRole('group', { name: 'Mesa tutorial' });

        await tutorPage.getByRole('button', { name: 'Revelar votos' }).click();

        const confirmRevealModal = tutorPage.getByRole('dialog', {
          name: 'Revelar votos agora?',
        });
        await expect(confirmRevealModal).toBeVisible();
        await expect(confirmRevealModal.getByText(/ainda não (votou|votaram)/)).toBeVisible();
        await confirmRevealModal.getByRole('button', { name: 'Revelar mesmo assim' }).click();
        await expect(confirmRevealModal).not.toBeVisible();

        await expect(tutorPage.getByText('Distribuição dos votos')).toBeVisible();
        await expect(tutorPage.getByText('1 voto · de 8,5 a 8,5')).toBeVisible();
        await expect(tutorialTable.getByText('Média', { exact: true })).toBeVisible();
        await expect(tutorialTable.getByText('8,5', { exact: true }).first()).toBeVisible();
        await expect(tutorialTable.getByText('Ana', { exact: true })).toBeVisible();

        await tutorPage.getByRole('button', { name: 'Aceitar média' }).click();
        await expect(tutorPage.getByText('Média aceita.')).toBeVisible();
        await expect(tutorPage.getByText(/1 de \d+ avaliados/)).toBeVisible();
        await expect(tutorialTable.getByText('8,5', { exact: true })).toBeVisible();

        await expect(tutorPage.getByText('Pronto para a rodada 2')).toBeVisible();
        await expect(tutorPage.getByText('Próximo: Ana')).toBeVisible();
        await tutorPage.getByRole('button', { name: 'Próximo aluno' }).click();

        await expect(tutorialTable.getByText(STUDENT_CREDENTIALS.name)).toBeVisible();
        await expect(tutorialTable.getByText('Em avaliação')).toBeVisible();

        await castPeerVoteViaApi(sessionId, 9);
        await expect(tutorPage.getByText(/1 de \d+ votaram/)).toBeVisible();

        await tutorPage.getByRole('button', { name: 'Revelar votos' }).click();
        const confirmSecondReveal = tutorPage.getByRole('dialog', {
          name: 'Revelar votos agora?',
        });
        await expect(confirmSecondReveal).toBeVisible();
        await confirmSecondReveal.getByRole('button', { name: 'Revelar mesmo assim' }).click();
        await expect(confirmSecondReveal).not.toBeVisible();

        await expect(tutorialTable.getByText('9,0', { exact: true }).first()).toBeVisible();
        await tutorPage.getByRole('button', { name: 'Aceitar média' }).click();
        await expect(tutorPage.getByText(/2 de \d+ avaliados/)).toBeVisible();
        await expect(tutorialTable.getByText('9,0', { exact: true })).toBeVisible();

        await tutorPage.reload();

        const reloadedTable = tutorPage.getByRole('group', { name: 'Mesa tutorial' });
        await expect(reloadedTable).toBeVisible();
        await expect(tutorPage.getByText(/2 de \d+ avaliados/)).toBeVisible();
        await expect(reloadedTable.getByText('8,5', { exact: true })).toBeVisible();
        await expect(reloadedTable.getByText('9,0', { exact: true })).toBeVisible();

        await tutorPage.getByRole('button', { name: 'Progresso' }).click();
        const progressDialog = tutorPage.getByRole('dialog', { name: 'Progresso' });
        await expect(progressDialog).toBeVisible();
        await expect(progressDialog.getByText(STUDENT_CREDENTIALS.name)).toBeVisible();
        await expect(progressDialog.getByText('9,0', { exact: true })).toBeVisible();
        await progressDialog.getByRole('button', { name: 'Fechar' }).click();
        await expect(progressDialog).not.toBeVisible();

        await tutorPage.getByRole('button', { name: 'Encerrar planning poker' }).click();
        const endPokerDialog = tutorPage.getByRole('dialog', {
          name: 'Encerrar planning poker?',
        });
        await expect(endPokerDialog).toBeVisible();
        await endPokerDialog.getByRole('button', { name: 'Sim, encerrar' }).click();

        await expect(tutorPage).toHaveURL(sessionHubPath);
        await expect(tutorPage.getByText('Bloqueado')).toHaveCount(0);
        await expect(tutorPage.getByText('Planning poker em andamento na mesa.')).toHaveCount(0);

        const evaluateStudentsLink = tutorPage.getByRole('link', { name: /Avaliar alunos/i });
        await expect(evaluateStudentsLink).toBeVisible();
        await evaluateStudentsLink.click();

        await expect(tutorPage).toHaveURL(`${sessionHubPath}/avaliar`);
        await expect(
          tutorPage.getByRole('heading', { name: 'Planning poker em andamento' }),
        ).toHaveCount(0);
        await expect(tutorPage.getByText('Avaliada · 9,0')).toBeVisible();
        await expect(tutorPage.getByText('Avaliada · 8,5')).toBeVisible();
        await expect(tutorPage.getByRole('link', { name: 'Avaliar' }).first()).toBeVisible();
      });
    } finally {
      await Promise.allSettled(contexts.map((context) => context.close()));
    }
  });
});
