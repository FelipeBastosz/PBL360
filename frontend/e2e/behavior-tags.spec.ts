import { test, expect, type Page } from '@playwright/test';

const TEACHER_CREDENTIALS = {
  email: 'carlos@uefs.br',
  password: 'senha-secreta',
};

const TARGET_STUDENT = {
  name: 'Ana Souza',
  email: '20240001@discente.uefs.br',
  password: 'senha-secreta',
  registrationNumber: '20240001',
};

function futureSessionDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return [date.getDate(), date.getMonth() + 1, date.getFullYear()]
    .map((part, index) => (index < 2 ? String(part).padStart(2, '0') : String(part)))
    .join('/');
}

async function setupIsolatedRoomWithStudent(page: Page, roomName: string): Promise<void> {
  await page.evaluate(
    async ({ targetRoomName, student }) => {
      const storedSession = localStorage.getItem('pbl360.session');
      if (!storedSession) {
        throw new Error('A sessão autenticada do professor não foi persistida no navegador.');
      }

      const tutorToken = (JSON.parse(storedSession) as { token?: string }).token;
      if (!tutorToken) {
        throw new Error('A sessão autenticada do professor não contém token.');
      }

      const acceptTermsIfPending = async (token: string) => {
        const headers = { Authorization: `Bearer ${token}` };
        const statusRes = await fetch('/api/usuarios/meu-aceite-termo', { headers });
        if (!statusRes.ok) {
          throw new Error(`Falha ao consultar termo de compromisso: HTTP ${statusRes.status}.`);
        }

        const status = (await statusRes.json()) as {
          aceito: boolean;
          versaoVigente: string;
        };
        if (status.aceito) return;

        const acceptRes = await fetch('/api/usuarios/meu-aceite-termo', {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ versao: status.versaoVigente }),
        });
        if (!acceptRes.ok) {
          throw new Error(`Falha ao aceitar termo de compromisso: HTTP ${acceptRes.status}.`);
        }
      };

      await acceptTermsIfPending(tutorToken);

      const roomRes = await fetch('/api/salas', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tutorToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome: targetRoomName,
          codigoDisciplina: 'EXA123',
          semestre: '2026.2',
        }),
      });
      if (!roomRes.ok) {
        throw new Error(`Falha ao criar turma isolada: HTTP ${roomRes.status}.`);
      }

      const room = (await roomRes.json()) as { codigoSala?: string };
      if (!room.codigoSala) {
        throw new Error('A resposta de criação da turma não retornou codigoSala.');
      }

      const studentLoginRes = await fetch('/api/autenticacao/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: student.email, senha: student.password }),
      });
      if (!studentLoginRes.ok) {
        throw new Error(
          `Falha ao autenticar discente ${student.email}: HTTP ${studentLoginRes.status}.`,
        );
      }

      const { token: studentToken } = (await studentLoginRes.json()) as { token?: string };
      if (!studentToken) {
        throw new Error(`Token ausente na autenticação do discente ${student.email}.`);
      }

      await acceptTermsIfPending(studentToken);

      const joinRes = await fetch('/api/salas/ingressar/codigo', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${studentToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ codigoSala: room.codigoSala }),
      });
      if (!joinRes.ok) {
        throw new Error(
          `Falha ao ingressar discente ${student.email} na turma: HTTP ${joinRes.status}.`,
        );
      }
    },
    { targetRoomName: roomName, student: TARGET_STUDENT },
  );
}

async function loginAsTeacher(page: Page, isolatedRoomName: string): Promise<void> {
  await page.goto('/entrar');

  const emailInput = page.getByLabel('Email Institucional');
  const senhaInput = page.getByPlaceholder('Informe sua senha');
  const submitBtn = page.getByRole('button', { name: 'Entrar' });

  await expect(emailInput).toBeVisible();
  await emailInput.fill(TEACHER_CREDENTIALS.email);
  await senhaInput.fill(TEACHER_CREDENTIALS.password);
  await submitBtn.click();

  await expect(page).toHaveURL(/\/turmas/, { timeout: 10000 });
  await setupIsolatedRoomWithStudent(page, isolatedRoomName);
  await page.reload();
}

async function createIsolatedProblemAndSession(
  page: Page,
  roomName: string,
  problemTitle: string,
  sessionTitle: string,
): Promise<{ roomId: string; problemId: string; sessionId: string }> {
  await page.getByPlaceholder('Pesquisar turma').fill(roomName);
  const roomHeading = page.getByRole('heading', { level: 3, name: roomName });
  await expect(roomHeading).toBeVisible({ timeout: 10000 });
  await roomHeading.click();
  await expect(page).toHaveURL(/\/turmas\/[a-zA-Z0-9-]+\/problemas/, { timeout: 10000 });

  await page.getByRole('button', { name: 'Ações de problema' }).click();
  await page.getByRole('button', { name: 'Criar novo problema' }).click();

  const problemModal = page.getByRole('dialog');
  await expect(problemModal).toBeVisible();
  await expect(problemModal.getByRole('heading', { name: 'Criar Problema' })).toBeVisible();
  await page.getByLabel('Título do Problema').fill(problemTitle);
  await problemModal.getByRole('button', { name: 'Criar Problema' }).click();
  await expect(problemModal).not.toBeVisible();

  const newProblemCard = page.getByRole('heading', { level: 3, name: problemTitle });
  await expect(newProblemCard).toBeVisible({ timeout: 10000 });
  await newProblemCard.click();
  await expect(page).toHaveURL(/\/turmas\/[a-zA-Z0-9-]+\/problemas\/[a-zA-Z0-9-]+$/, {
    timeout: 10000,
  });

  await page.getByRole('button', { name: 'Ações da sessão' }).click();
  await page.getByRole('button', { name: 'Criar nova sessão' }).click();

  const sessionModal = page.getByRole('dialog');
  await expect(sessionModal).toBeVisible();
  await expect(sessionModal.getByRole('heading', { name: 'Criar Sessão' })).toBeVisible();

  await page.getByLabel('Título da Sessão').fill(sessionTitle);
  await page
    .getByLabel('Descrição da Sessão')
    .fill('Sessão criada no teste E2E de tags de comportamento.');
  await page.getByLabel('Data da Sessão').fill(futureSessionDate());
  await sessionModal.getByRole('button', { name: 'Criar sessão' }).click();
  await expect(sessionModal).not.toBeVisible();

  const sessionCard = page.getByRole('heading', { level: 3, name: new RegExp(sessionTitle) });
  await expect(sessionCard).toBeVisible({ timeout: 10000 });
  await sessionCard.click();
  await expect(page).toHaveURL(
    /\/turmas\/[a-zA-Z0-9-]+\/problemas\/[a-zA-Z0-9-]+\/sessoes\/[a-zA-Z0-9-]+$/,
    { timeout: 10000 },
  );

  const match = new URL(page.url()).pathname.match(
    /^\/turmas\/([^/]+)\/problemas\/([^/]+)\/sessoes\/([^/]+)$/,
  );
  expect(match).not.toBeNull();

  return {
    roomId: match![1],
    problemId: match![2],
    sessionId: match![3],
  };
}

async function recordTargetStudentPresent(page: Page): Promise<void> {
  await page.getByRole('link', { name: /Chamada/i }).click();
  await expect(page.getByRole('region', { name: 'Chamada na mesa' })).toBeVisible({
    timeout: 10000,
  });

  const studentChip = page.getByRole('button', { name: `${TARGET_STUDENT.name}, fora da mesa` });
  await expect(studentChip).toBeVisible({ timeout: 10000 });
  await studentChip.click();

  const tutorialTable = page.getByRole('group', { name: 'Mesa tutorial' });
  await tutorialTable.getByRole('button', { name: 'Lugar 1, livre' }).click();
  await expect(
    tutorialTable.getByRole('button', { name: `Lugar 1: ${TARGET_STUDENT.name}, Presente` }),
  ).toBeVisible();

  const markRemainingAbsentBtn = page.getByRole('button', { name: 'Restantes ausentes' });
  if (await markRemainingAbsentBtn.isEnabled()) {
    await markRemainingAbsentBtn.click();
  }

  const saveButton = page.getByRole('button', { name: 'Salvar chamada' });
  await expect(saveButton).toBeEnabled();
  await saveButton.click();
  await expect(page.getByText('Chamada salva.')).toBeVisible({ timeout: 10000 });

  await page.getByRole('button', { name: 'Voltar' }).click();
}

test.describe('E2E Full-Stack: Tags de Comportamento na Avaliação', () => {
  test.beforeEach(async () => {
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

  test('deve atribuir, incrementar e criar tags de comportamento com persistência no PostgreSQL e validar a sessão em /relatorio', async ({
    page,
  }) => {
    test.setTimeout(60000);

    const runId = Date.now().toString().slice(-4);
    const roomName = `Turma Tags E2E ${runId}`;
    const problemTitle = `Problema Tags E2E ${runId}`;
    const sessionTitle = `Sessão Tags E2E ${runId}`;
    const customTagName = `Iniciativa E2E ${runId}`;

    let roomId = '';
    let problemId = '';
    let sessionId = '';
    let studentId = '';
    let selectedTagName = '';

    await test.step('Etapa 1: Login real como professor e criação de sessão ativa isolada', async () => {
      await loginAsTeacher(page, roomName);

      const ids = await createIsolatedProblemAndSession(page, roomName, problemTitle, sessionTitle);
      roomId = ids.roomId;
      problemId = ids.problemId;
      sessionId = ids.sessionId;

      await recordTargetStudentPresent(page);
      await expect(page).toHaveURL(`/turmas/${roomId}/problemas/${problemId}/sessoes/${sessionId}`);
    });

    await test.step('Etapa 2: Acessar a tela de marcações do estudante e atribuir/criar tags', async () => {
      await page.getByRole('link', { name: /Avaliar alunos/i }).click();
      await expect(page).toHaveURL(
        `/turmas/${roomId}/problemas/${problemId}/sessoes/${sessionId}/avaliar`,
      );

      await expect(page.getByRole('heading', { level: 3, name: TARGET_STUDENT.name })).toBeVisible({
        timeout: 10000,
      });
      const evaluateLink = page.getByRole('link', { name: 'Avaliar' });
      await expect(evaluateLink).toHaveCount(1);
      await evaluateLink.click();

      await expect(page).toHaveURL(new RegExp(`/sessoes/${sessionId}/avaliacao/[^/]+$`), {
        timeout: 10000,
      });
      studentId = new URL(page.url()).pathname.split('/').pop() ?? '';
      expect(studentId).toBeTruthy();

      await expect(
        page.getByRole('heading', { level: 2, name: `Notas do aluno: ${TARGET_STUDENT.name}` }),
      ).toBeVisible();
      await expect(page.getByText('Nenhuma marcação atribuída ainda.')).toBeVisible();

      await page.getByRole('button', { name: 'Ver outras marcações' }).click();
      await expect(page).toHaveURL(`/sessoes/${sessionId}/avaliacao/${studentId}/marcacoes`);
      await expect(
        page.getByRole('heading', { level: 2, name: `Todas as marcações: ${TARGET_STUDENT.name}` }),
      ).toBeVisible();

      await expect(page.getByText('Atraso', { exact: true })).toBeVisible({ timeout: 10000 });
      await expect(page.getByText('Celular fora de contexto', { exact: true })).toBeVisible();

      const firstMarkResponsePromise = page.waitForResponse(
        (response) =>
          response.request().method() === 'POST' &&
          new URL(response.url()).pathname ===
            `/api/sessoes/${sessionId}/alunos/${studentId}/observacoes` &&
          response.ok(),
      );
      await page.getByRole('button', { name: 'Marcar' }).first().click();
      await firstMarkResponsePromise;

      await expect(page.getByText('1 marcações', { exact: true })).toBeVisible();

      const incrementButton = page.getByRole('button', { name: /^Aumentar / }).first();
      await expect(incrementButton).toBeVisible();
      const incrementAriaLabel = await incrementButton.getAttribute('aria-label');
      expect(incrementAriaLabel).toBeTruthy();
      selectedTagName = incrementAriaLabel!.replace(/^Aumentar /, '');

      const decrementButton = page.getByRole('button', {
        name: `Diminuir ${selectedTagName}`,
        exact: true,
      });
      await expect(decrementButton).toBeVisible();

      const secondMarkResponsePromise = page.waitForResponse(
        (response) =>
          response.request().method() === 'POST' &&
          new URL(response.url()).pathname ===
            `/api/sessoes/${sessionId}/alunos/${studentId}/observacoes` &&
          response.ok(),
      );
      await incrementButton.click();
      await secondMarkResponsePromise;

      await expect(page.getByText('2 marcações', { exact: true })).toBeVisible();

      await page.getByRole('button', { name: 'criar nova marcação' }).click();
      const newTagInput = page.getByPlaceholder('Nome da nova marcação');
      await expect(newTagInput).toBeVisible();
      await newTagInput.fill(customTagName);

      const createTagResponsePromise = page.waitForResponse(
        (response) =>
          response.request().method() === 'POST' &&
          new URL(response.url()).pathname === '/api/marcacoes' &&
          response.ok(),
      );
      const registerCustomTagObsPromise = page.waitForResponse(
        (response) =>
          response.request().method() === 'POST' &&
          new URL(response.url()).pathname ===
            `/api/sessoes/${sessionId}/alunos/${studentId}/observacoes` &&
          response.ok(),
      );

      await page.getByRole('button', { name: 'Salvar' }).click();
      await Promise.all([createTagResponsePromise, registerCustomTagObsPromise]);

      await expect(page.getByText(customTagName, { exact: true })).toBeVisible();
      await expect(page.getByText('1 marcações', { exact: true })).toBeVisible();
      await expect(
        page.getByRole('button', { name: `Aumentar ${customTagName}`, exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole('button', { name: `Diminuir ${customTagName}`, exact: true }),
      ).toBeVisible();
    });

    await test.step('Etapa 3: Validar persistência no banco via rota /avaliar/:studentId/marcacoes e card Observações rápidas', async () => {
      await page.goto(
        `/turmas/${roomId}/problemas/${problemId}/sessoes/${sessionId}/avaliar/${studentId}/marcacoes`,
      );
      await expect(
        page.getByRole('heading', { level: 2, name: /^Todas as marcações:/ }),
      ).toBeVisible({ timeout: 10000 });

      await expect(page.getByText(selectedTagName, { exact: true })).toBeVisible();
      await expect(page.getByText('2 marcações', { exact: true })).toBeVisible();
      await expect(
        page.getByRole('button', { name: `Aumentar ${selectedTagName}`, exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole('button', { name: `Diminuir ${selectedTagName}`, exact: true }),
      ).toBeVisible();

      await expect(page.getByText(customTagName, { exact: true })).toBeVisible();
      await expect(page.getByText('1 marcações', { exact: true })).toBeVisible();
      await expect(
        page.getByRole('button', { name: `Aumentar ${customTagName}`, exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole('button', { name: `Diminuir ${customTagName}`, exact: true }),
      ).toBeVisible();

      await page.goto(
        `/turmas/${roomId}/problemas/${problemId}/sessoes/${sessionId}/avaliar/${studentId}`,
      );
      await expect(
        page.getByRole('heading', { level: 2, name: 'Observações rápidas' }),
      ).toBeVisible({ timeout: 10000 });
      await expect(page.getByText('Nenhuma marcação atribuída ainda.')).toHaveCount(0);

      await expect(page.getByText(selectedTagName, { exact: true })).toBeVisible();
      await expect(page.getByText('2', { exact: true })).toBeVisible();
      await expect(
        page.getByRole('button', { name: `Aumentar marcação ${selectedTagName}`, exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole('button', { name: `Diminuir marcação ${selectedTagName}`, exact: true }),
      ).toBeVisible();

      await expect(page.getByText(customTagName, { exact: true })).toBeVisible();
      await expect(page.getByText('1', { exact: true })).toBeVisible();
      await expect(
        page.getByRole('button', { name: `Aumentar marcação ${customTagName}`, exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole('button', { name: `Diminuir marcação ${customTagName}`, exact: true }),
      ).toBeVisible();
    });

    await test.step('Etapa 4: Navegar para /relatorio e validar tabela consolidada e exportação com Marcações da sessão', async () => {
      // Nota: SessionReportTable.tsx exibe atualmente apenas ALUNO/MATRÍCULA e NOTA FINAL na tabela HTML.
      // As marcações da sessão são incluídas na exportação (PDF/XLSX) via GET /api/sessoes/:id/relatorio/exportacao.
      await page.goto(`/turmas/${roomId}/problemas/${problemId}/sessoes/${sessionId}`);
      await page.getByRole('link', { name: /Relatório da Sessão/i }).click();

      await expect(page).toHaveURL(
        `/turmas/${roomId}/problemas/${problemId}/sessoes/${sessionId}/relatorio`,
        { timeout: 10000 },
      );
      await expect(
        page.getByRole('heading', { level: 1, name: 'Relatório da Sessão' }),
      ).toBeVisible();
      await expect(page.getByText(sessionTitle)).toBeVisible();

      const reportTable = page.getByRole('table');
      await expect(reportTable).toBeVisible({ timeout: 10000 });
      await expect(reportTable.getByRole('columnheader', { name: 'ALUNO' })).toBeVisible();
      await expect(reportTable.getByRole('columnheader', { name: 'NOTA FINAL' })).toBeVisible();
      await expect(reportTable.getByText(TARGET_STUDENT.name)).toBeVisible();
      await expect(reportTable.getByText('Média da turma')).toBeVisible();

      const hideNamesSwitch = page.getByRole('switch', { name: 'Ocultar nomes' });
      await hideNamesSwitch.click();
      await expect(hideNamesSwitch).toHaveAttribute('aria-checked', 'true');
      await expect(reportTable.getByRole('columnheader', { name: 'MATRÍCULA' })).toBeVisible();
      await expect(reportTable.getByText(TARGET_STUDENT.registrationNumber)).toBeVisible();
      await expect(reportTable.getByText(TARGET_STUDENT.name)).toHaveCount(0);

      await hideNamesSwitch.click();
      await expect(hideNamesSwitch).toHaveAttribute('aria-checked', 'false');
      await expect(reportTable.getByText(TARGET_STUDENT.name)).toBeVisible();

      await page.getByRole('button', { name: 'Exportar em Excel' }).click();
      const exportModal = page.getByRole('dialog', { name: 'Exportar em XLSX' });
      await expect(exportModal).toBeVisible();

      const tagsSwitch = exportModal.getByRole('switch', { name: 'Marcações da sessão' });
      await expect(tagsSwitch).toHaveAttribute('aria-checked', 'true');

      const exportResponsePromise = page.waitForResponse(
        (response) =>
          response.request().method() === 'GET' &&
          new URL(response.url()).pathname === `/api/sessoes/${sessionId}/relatorio/exportacao` &&
          new URL(response.url()).searchParams.get('mostrarMarcacoes') === 'true' &&
          response.ok(),
      );
      const downloadPromise = page.waitForEvent('download');

      await exportModal.getByRole('button', { name: 'Confirmar Exportação' }).click();
      const [exportResponse, download] = await Promise.all([
        exportResponsePromise,
        downloadPromise,
      ]);

      expect(exportResponse.status()).toBe(200);
      expect(download.suggestedFilename()).toMatch(/\.xlsx$/);
      expect(await download.failure()).toBeNull();
    });
  });
});
