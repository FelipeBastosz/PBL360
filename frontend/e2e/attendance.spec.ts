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

      await expect(page.getByRole('heading', { name: 'Anexos da Sessão' })).toBeVisible({
        timeout: 10000,
      });
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
      await expect(saveButton).toBeDisabled();
      await expect(
        page.getByText(
          'Defina a presença ou ausência de 2 alunos restantes para salvar a chamada.',
        ),
      ).toBeVisible();

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
      await expect(saveButton).toBeDisabled();
      await expect(
        page.getByText('Defina a presença ou ausência de 1 aluno restante para salvar a chamada.'),
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

  test('bloqueia salvamento com alunos pendentes (UI e API 422) e libera com Restantes ausentes', async ({
    page,
  }) => {
    test.setTimeout(60000);

    const runId = Date.now().toString().slice(-4);
    const roomName = `Turma Chamada Completa ${runId}`;
    const problemTitle = `Problema Chamada Completa ${runId}`;
    const sessionTitle = `Sessão Chamada Completa ${runId}`;

    await page.goto('/entrar');
    await page.getByLabel('Email Institucional').fill(TEACHER_CREDENTIALS.email);
    await page.getByPlaceholder('Informe sua senha').fill(TEACHER_CREDENTIALS.password);
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page).toHaveURL(/\/turmas/, { timeout: 10000 });

    await setupIsolatedRoomWithStudents(page, roomName);
    await page.reload();

    await page.getByPlaceholder('Pesquisar turma').fill(roomName);
    await page.getByRole('heading', { level: 3, name: roomName }).click();
    await page.getByRole('button', { name: 'Ações de problema' }).click();
    await page.getByRole('button', { name: 'Criar novo problema' }).click();
    await page.getByLabel('Título do Problema').fill(problemTitle);
    await page.getByRole('dialog').getByRole('button', { name: 'Criar Problema' }).click();
    await page.getByRole('heading', { level: 3, name: problemTitle }).click();

    await page.getByRole('button', { name: 'Ações da sessão' }).click();
    await page.getByRole('button', { name: 'Criar nova sessão' }).click();
    await page.getByLabel('Título da Sessão').fill(sessionTitle);
    await page.getByLabel('Descrição da Sessão').fill(`Sessão MEL56.1 (${runId}).`);
    await page.getByLabel('Data da Sessão').fill('26/11/2026');
    await page.getByRole('dialog').getByRole('button', { name: 'Criar sessão' }).click();
    await page.getByRole('heading', { level: 3, name: new RegExp(sessionTitle) }).click();
    await expect(page).toHaveURL(
      /\/turmas\/[a-zA-Z0-9-]+\/problemas\/[a-zA-Z0-9-]+\/sessoes\/[a-zA-Z0-9-]+$/,
      { timeout: 10000 },
    );
    await page.getByRole('link', { name: /Chamada Mesa tutorial/i }).click();
    await expect(page).toHaveURL(/\/chamada$/, { timeout: 10000 });

    const saveButton = page.getByRole('button', { name: 'Salvar chamada' });
    await expect(saveButton).toBeDisabled();
    await expect(
      page.getByText('Defina a presença ou ausência de 3 alunos restantes para salvar a chamada.'),
    ).toBeVisible();

    const sessionId = new URL(page.url()).pathname.split('/').at(-2)!;
    const incompleteStatus = await page.evaluate(async (id) => {
      const token = (JSON.parse(localStorage.getItem('pbl360.session')!) as { token: string })
        .token;
      const getRes = await fetch(`/api/sessoes/${id}/chamada`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await getRes.json()) as { alunos: Array<{ alunoId: string }> };
      const putRes = await fetch(`/api/sessoes/${id}/chamada`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registros: [{ alunoId: data.alunos[0]!.alunoId, status: 'PRESENTE', lugar: 1 }],
        }),
      });
      return { status: putRes.status, body: (await putRes.json()) as { message?: string } };
    }, sessionId);

    expect(incompleteStatus.status).toBe(422);
    expect(incompleteStatus.body.message).toBe(
      'Defina a presença ou ausência de todos os alunos da turma antes de salvar a chamada.',
    );

    await page.getByRole('button', { name: 'Ana Souza, fora da mesa' }).click();
    await page.getByRole('button', { name: 'Lugar 1, livre' }).click();
    await expect(saveButton).toBeDisabled();
    await expect(
      page.getByText('Defina a presença ou ausência de 2 alunos restantes para salvar a chamada.'),
    ).toBeVisible();

    await page.getByRole('button', { name: 'Restantes ausentes' }).click();
    await expect(saveButton).toBeEnabled();
    await expect(page.getByRole('button', { name: 'Restantes ausentes' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Todos presentes' })).toBeEnabled();

    await page.getByRole('button', { name: 'Todos presentes' }).click();
    await expect(page.getByText('Todos os alunos estão na mesa.')).toBeVisible();
    await expect(saveButton).toBeEnabled();

    await saveButton.click();
    await expect(page.getByText('Chamada salva.')).toBeVisible();

    await page.reload();
    const tableSection = page.getByRole('region', { name: 'Chamada na mesa' });
    await expect(tableSection.getByRole('definition')).toHaveText(['3', '0', '0', '0']);
  });

  test('não infere presença na sessão seguinte pré-preenchida, libera com Todos presentes e persiste Atrasado', async ({
    page,
  }) => {
    test.setTimeout(60000);

    const runId = Date.now().toString().slice(-4);
    const roomName = `Turma Prefill E2E ${runId}`;
    const problemTitle = `Problema Prefill E2E ${runId}`;
    const firstSessionTitle = `Sessão 1 Prefill ${runId}`;
    const secondSessionTitle = `Sessão 2 Prefill ${runId}`;

    await page.goto('/entrar');
    await page.getByLabel('Email Institucional').fill(TEACHER_CREDENTIALS.email);
    await page.getByPlaceholder('Informe sua senha').fill(TEACHER_CREDENTIALS.password);
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page).toHaveURL(/\/turmas/, { timeout: 10000 });

    await setupIsolatedRoomWithStudents(page, roomName);
    await page.reload();

    await page.getByPlaceholder('Pesquisar turma').fill(roomName);
    await page.getByRole('heading', { level: 3, name: roomName }).click();
    await page.getByRole('button', { name: 'Ações de problema' }).click();
    await page.getByRole('button', { name: 'Criar novo problema' }).click();
    await page.getByLabel('Título do Problema').fill(problemTitle);
    await page.getByRole('dialog').getByRole('button', { name: 'Criar Problema' }).click();
    await page.getByRole('heading', { level: 3, name: problemTitle }).click();
    await expect(page).toHaveURL(/\/problemas\/[a-zA-Z0-9-]+$/, { timeout: 10000 });
    const problemUrl = page.url();

    // Session 1: only Ana is seated (Presente); Beatriz and João are marked Ausente.
    await page.getByRole('button', { name: 'Ações da sessão' }).click();
    await page.getByRole('button', { name: 'Criar nova sessão' }).click();
    await page.getByLabel('Título da Sessão').fill(firstSessionTitle);
    await page.getByLabel('Descrição da Sessão').fill(`Sessão 1 (${runId}).`);
    await page.getByLabel('Data da Sessão').fill('25/11/2026');
    await page.getByRole('dialog').getByRole('button', { name: 'Criar sessão' }).click();
    await page.getByRole('heading', { level: 3, name: new RegExp(firstSessionTitle) }).click();
    await expect(page).toHaveURL(/\/sessoes\/[a-zA-Z0-9-]+$/, { timeout: 10000 });
    await page.getByRole('link', { name: /Chamada Mesa tutorial/i }).click();
    await expect(page).toHaveURL(/\/chamada$/, { timeout: 10000 });

    await page.getByRole('button', { name: 'Ana Souza, fora da mesa' }).click();
    await page.getByRole('button', { name: 'Lugar 1, livre' }).click();
    await page.getByRole('button', { name: 'Restantes ausentes' }).click();
    await page.getByRole('button', { name: 'Salvar chamada' }).click();
    await expect(page.getByText('Chamada salva.')).toBeVisible();

    // Session 2: Ana comes prefilled as Presente, while Beatriz and João stay unmarked.
    await page.goto(problemUrl);
    await page.getByRole('button', { name: 'Ações da sessão' }).click();
    await page.getByRole('button', { name: 'Criar nova sessão' }).click();
    await page.getByLabel('Título da Sessão').fill(secondSessionTitle);
    await page.getByLabel('Descrição da Sessão').fill(`Sessão 2 (${runId}).`);
    await page.getByLabel('Data da Sessão').fill('28/11/2026');
    await page.getByRole('dialog').getByRole('button', { name: 'Criar sessão' }).click();
    await page.getByRole('heading', { level: 3, name: new RegExp(secondSessionTitle) }).click();
    await expect(page).toHaveURL(/\/sessoes\/[a-zA-Z0-9-]+$/, { timeout: 10000 });
    await page.getByRole('link', { name: /Chamada Mesa tutorial/i }).click();
    await expect(page).toHaveURL(/\/chamada$/, { timeout: 10000 });

    await expect(page.getByText('Mesa preenchida conforme a sessão de 25/11')).toBeVisible();
    const saveButton = page.getByRole('button', { name: 'Salvar chamada' });
    await expect(saveButton).toBeDisabled();
    await expect(
      page.getByText('Defina a presença ou ausência de 2 alunos restantes para salvar a chamada.'),
    ).toBeVisible();

    await page.getByRole('button', { name: 'Todos presentes' }).click();
    await expect(saveButton).toBeEnabled();

    await page.getByRole('button', { name: 'Lugar 1: Ana Souza, Presente' }).click();
    const anaSheet = page.getByRole('dialog', { name: 'Ana Souza' });
    await expect(anaSheet).toBeVisible();
    await anaSheet.getByRole('radio', { name: 'Atrasado' }).click();
    await expect(anaSheet.getByRole('radio', { name: 'Atrasado' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await anaSheet.getByRole('button', { name: 'Fechar' }).click();
    await expect(anaSheet).not.toBeVisible();

    await saveButton.click();
    await expect(page.getByText('Chamada salva.')).toBeVisible();

    await page.reload();
    const tableSection = page.getByRole('region', { name: 'Chamada na mesa' });
    await expect(tableSection.getByRole('definition')).toHaveText(['2', '1', '0', '0']);
    await expect(page.getByRole('button', { name: 'Lugar 1: Ana Souza, Atrasado' })).toBeVisible();
  });
});
