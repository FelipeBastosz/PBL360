import { test, expect, type Page } from '@playwright/test';

const TEACHER_CREDENTIALS = {
  email: 'carlos@uefs.br',
  password: 'senha-secreta',
};

const SEEDED_STUDENTS = [
  { email: '20240001@discente.uefs.br', password: 'senha-secreta', name: 'Ana Souza' },
  { email: '20240002@discente.uefs.br', password: 'senha-secreta', name: 'João Silva' },
  { email: '20240003@discente.uefs.br', password: 'senha-secreta', name: 'Beatriz Oliveira' },
] as const;

async function setupIsolatedRoomWithStudents(page: Page, roomName: string) {
  await page.evaluate(
    async ({ targetRoomName, students }) => {
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
          throw new Error(`Falha ao verificar termo de compromisso: HTTP ${statusRes.status}.`);
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

      for (const student of students) {
        const loginRes = await fetch('/api/autenticacao/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: student.email, senha: student.password }),
        });
        if (!loginRes.ok) {
          throw new Error(
            `Falha ao autenticar discente ${student.email}: HTTP ${loginRes.status}.`,
          );
        }

        const { token: studentToken } = (await loginRes.json()) as { token?: string };
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
      }
    },
    { targetRoomName: roomName, students: SEEDED_STUDENTS },
  );
}

async function openPresenceSheetByLongPress(page: Page, studentName: string, chipLabel: string) {
  const chip = page.getByRole('button', { name: chipLabel });
  await expect(chip).toBeVisible();
  await chip.hover();
  await page.mouse.down();

  const sheet = page.getByRole('dialog', { name: studentName });
  await expect(sheet).toBeVisible();
  await page.mouse.up();
  await expect(sheet).toBeVisible();

  return sheet;
}

test.describe('E2E Full-Stack: Registro de Chamada e Assentos', () => {
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

  test('deve registrar assentos, ausências, justificativa e persistir chamada no PostgreSQL', async ({
    page,
  }) => {
    test.setTimeout(60000);

    const runId = Date.now().toString().slice(-4);
    const roomName = `Turma Chamada E2E ${runId}`;
    const problemTitle = `Problema Chamada E2E ${runId}`;
    const sessionTitle = `Sessão Chamada E2E ${runId}`;
    const justificationText = `Participação em atividade acadêmica externa (${runId})`;

    await test.step('Acesso e Estado Inicial', async () => {
      await page.goto('/entrar');

      const emailInput = page.getByLabel('Email Institucional');
      const senhaInput = page.getByPlaceholder('Informe sua senha');
      const submitBtn = page.getByRole('button', { name: 'Entrar' });

      await expect(emailInput).toBeVisible();
      await emailInput.fill(TEACHER_CREDENTIALS.email);
      await senhaInput.fill(TEACHER_CREDENTIALS.password);
      await submitBtn.click();

      await expect(page).toHaveURL(/\/turmas/, { timeout: 10000 });

      await setupIsolatedRoomWithStudents(page, roomName);
      await page.reload();

      await page.getByPlaceholder('Pesquisar turma').fill(roomName);
      const roomHeading = page.getByRole('heading', { level: 3, name: roomName });
      await expect(roomHeading).toBeVisible({ timeout: 10000 });
      await roomHeading.click();
      await expect(page).toHaveURL(/\/turmas\/[a-zA-Z0-9-]+\/problemas/, { timeout: 10000 });

      const problemFabBtn = page.getByRole('button', { name: 'Ações de problema' });
      await expect(problemFabBtn).toBeVisible();
      await problemFabBtn.click();

      const createProblemOption = page.getByRole('button', { name: 'Criar novo problema' });
      await expect(createProblemOption).toBeVisible();
      await createProblemOption.click();

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

      const sessionFabBtn = page.getByRole('button', { name: 'Ações da sessão' });
      await expect(sessionFabBtn).toBeVisible();
      await sessionFabBtn.click();

      const createSessionOption = page.getByRole('button', { name: 'Criar nova sessão' });
      await expect(createSessionOption).toBeVisible();
      await createSessionOption.click();

      const sessionModal = page.getByRole('dialog');
      await expect(sessionModal).toBeVisible();
      await expect(sessionModal.getByRole('heading', { name: 'Criar Sessão' })).toBeVisible();

      await page.getByLabel('Título da Sessão').fill(sessionTitle);
      await page
        .getByLabel('Descrição da Sessão')
        .fill(`Sessão criada para teste E2E de chamada (${runId}).`);
      await page.getByLabel('Data da Sessão').fill('25/11/2026');
      await sessionModal.getByRole('button', { name: 'Criar sessão' }).click();
      await expect(sessionModal).not.toBeVisible();

      const createdSessionCard = page.getByRole('heading', {
        level: 3,
        name: new RegExp(sessionTitle),
      });
      await expect(createdSessionCard).toBeVisible({ timeout: 10000 });
      await createdSessionCard.click();
      await expect(page).toHaveURL(
        /\/turmas\/[a-zA-Z0-9-]+\/problemas\/[a-zA-Z0-9-]+\/sessoes\/[a-zA-Z0-9-]+$/,
        { timeout: 10000 },
      );

      await page.getByRole('link', { name: /Chamada/i }).click();
      await expect(page).toHaveURL(
        /\/turmas\/[a-zA-Z0-9-]+\/problemas\/[a-zA-Z0-9-]+\/sessoes\/[a-zA-Z0-9-]+\/chamada$/,
        { timeout: 10000 },
      );

      const tableSection = page.getByRole('region', { name: 'Chamada na mesa' });
      await expect(tableSection).toBeVisible({ timeout: 10000 });
      await expect(
        page.getByRole('heading', { level: 1, name: `Chamada - ${problemTitle}` }),
      ).toBeVisible();
      await expect(page.getByText(`${sessionTitle} · 25/11`)).toBeVisible();

      const saveButton = page.getByRole('button', { name: 'Salvar chamada' });
      await expect(saveButton).toBeVisible();
      await expect(saveButton).toBeDisabled();
      await expect(page.getByText('Há alterações não salvas.')).toHaveCount(0);

      await expect(tableSection.getByRole('term')).toHaveText([
        'Presentes',
        'Atrasados',
        'Justificados',
        'Ausentes',
      ]);
      await expect(tableSection.getByRole('definition')).toHaveText(['0', '0', '0', '0']);

      const carometroSection = page.getByRole('region', { name: 'Carômetro — fora da mesa' });
      await expect(carometroSection).toBeVisible();
      await expect(carometroSection.getByText('3 alunos')).toBeVisible();

      await expect(page.getByRole('button', { name: 'Ana Souza, fora da mesa' })).toBeVisible();
      await expect(
        page.getByRole('button', { name: 'Beatriz Oliveira, fora da mesa' }),
      ).toBeVisible();
      await expect(page.getByRole('button', { name: 'João Silva, fora da mesa' })).toBeVisible();

      const tutorialTable = page.getByRole('group', { name: 'Mesa tutorial' });
      await expect(tutorialTable.getByRole('button', { name: 'Lugar 1, livre' })).toBeVisible();
      await expect(tutorialTable.getByRole('button', { name: 'Lugar 2, livre' })).toBeVisible();
      await expect(tutorialTable.getByRole('button', { name: 'Lugar 3, livre' })).toBeVisible();
    });

    await test.step('Alocação de Assentos e Presenças', async () => {
      const tableSection = page.getByRole('region', { name: 'Chamada na mesa' });
      const carometroSection = page.getByRole('region', { name: 'Carômetro — fora da mesa' });
      const tutorialTable = page.getByRole('group', { name: 'Mesa tutorial' });
      const saveButton = page.getByRole('button', { name: 'Salvar chamada' });

      const anaChip = page.getByRole('button', { name: 'Ana Souza, fora da mesa' });
      await anaChip.click();
      await expect(anaChip).toHaveAttribute('aria-pressed', 'true');
      await expect(
        page.getByText('Toque em um lugar da mesa para sentar Ana Souza.'),
      ).toBeVisible();

      await tutorialTable.getByRole('button', { name: 'Lugar 2, livre' }).click();

      await expect(
        tutorialTable.getByRole('button', { name: 'Lugar 2: Ana Souza, Presente' }),
      ).toBeVisible();
      await expect(page.getByRole('button', { name: 'Ana Souza, fora da mesa' })).toHaveCount(0);
      await expect(carometroSection.getByText('2 alunos')).toBeVisible();

      const beatrizSheet = await openPresenceSheetByLongPress(
        page,
        'Beatriz Oliveira',
        'Beatriz Oliveira, fora da mesa',
      );
      await expect(beatrizSheet.getByText('Fora da mesa • Sem registro')).toBeVisible();
      await beatrizSheet.getByRole('radio', { name: 'Ausente' }).click();
      await expect(beatrizSheet).not.toBeVisible();
      await expect(
        page.getByRole('button', { name: 'Beatriz Oliveira, fora da mesa, Ausente' }),
      ).toBeVisible();

      const joaoSheet = await openPresenceSheetByLongPress(
        page,
        'João Silva',
        'João Silva, fora da mesa',
      );
      await expect(joaoSheet.getByText('Fora da mesa • Sem registro')).toBeVisible();
      await joaoSheet.getByRole('radio', { name: 'Justificado' }).click();

      const justificationField = joaoSheet.getByLabel('Justificativa');
      await expect(justificationField).toBeVisible();
      await expect(joaoSheet.getByPlaceholder('Ex.: atestado médico')).toBeVisible();
      await justificationField.fill(justificationText);
      await joaoSheet.getByRole('button', { name: 'Justificar falta' }).click();

      await expect(joaoSheet).not.toBeVisible();
      await expect(
        page.getByRole('button', { name: 'João Silva, fora da mesa, Justificado' }),
      ).toBeVisible();

      await expect(tableSection.getByRole('definition')).toHaveText(['1', '0', '1', '1']);
      await expect(page.getByText('Há alterações não salvas.')).toBeVisible();
      await expect(saveButton).toBeEnabled();
    });

    await test.step('Persistência Real no Banco', async () => {
      const saveButton = page.getByRole('button', { name: 'Salvar chamada' });
      const saveResponsePromise = page.waitForResponse(
        (response) =>
          response.request().method() === 'PUT' &&
          /\/api\/sessoes\/[^/]+\/chamada$/.test(new URL(response.url()).pathname) &&
          response.ok(),
      );

      await saveButton.click();
      const saveResponse = await saveResponsePromise;
      expect(saveResponse.status()).toBe(200);

      await expect(page.getByText('Chamada salva.')).toBeVisible();
      await expect(saveButton).toBeDisabled();
      await expect(page.getByText('Há alterações não salvas.')).toHaveCount(0);

      await page.reload();

      const reloadedTableSection = page.getByRole('region', { name: 'Chamada na mesa' });
      await expect(reloadedTableSection).toBeVisible({ timeout: 10000 });

      const reloadedTable = page.getByRole('group', { name: 'Mesa tutorial' });
      await expect(
        reloadedTable.getByRole('button', { name: 'Lugar 2: Ana Souza, Presente' }),
      ).toBeVisible();
      await expect(reloadedTable.getByRole('button', { name: 'Lugar 1, livre' })).toBeVisible();
      await expect(reloadedTable.getByRole('button', { name: 'Lugar 3, livre' })).toBeVisible();

      await expect(
        page.getByRole('button', { name: 'Beatriz Oliveira, fora da mesa, Ausente' }),
      ).toBeVisible();
      await expect(
        page.getByRole('button', { name: 'João Silva, fora da mesa, Justificado' }),
      ).toBeVisible();

      await expect(reloadedTableSection.getByRole('definition')).toHaveText(['1', '0', '1', '1']);
      await expect(page.getByRole('button', { name: 'Salvar chamada' })).toBeDisabled();
      await expect(page.getByText('Há alterações não salvas.')).toHaveCount(0);

      const persistedJoaoSheet = await openPresenceSheetByLongPress(
        page,
        'João Silva',
        'João Silva, fora da mesa, Justificado',
      );
      await expect(persistedJoaoSheet.getByText('Fora da mesa • Justificado')).toBeVisible();
      await persistedJoaoSheet.getByRole('radio', { name: 'Justificado' }).click();
      await expect(persistedJoaoSheet.getByLabel('Justificativa')).toHaveValue(justificationText);
      await persistedJoaoSheet.getByRole('button', { name: 'Fechar' }).click();
      await expect(persistedJoaoSheet).not.toBeVisible();
    });
  });
});
