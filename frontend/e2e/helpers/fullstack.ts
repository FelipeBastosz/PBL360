import { expect, test, type Locator, type Page } from '@playwright/test';

const TEACHER_EMAIL = 'carlos@uefs.br';
const STUDENT_EMAIL = '20240001@discente.uefs.br';
const PASSWORD = 'senha-secreta';
const ROOM_NAME = 'Engenharia de Software - Turma A';
const PROBLEM_NAME = 'Problema 1 - Prontuário Eletrônico';

export async function skipIfBackendUnavailable() {
  try {
    const response = await fetch('http://localhost:3000/api/health');
    if (!response.ok && response.status !== 401 && response.status !== 404) {
      test.skip(true, 'Backend não respondeu com sucesso em http://localhost:3000');
    }
  } catch {
    test.skip(
      true,
      'Backend NestJS não está rodando em http://localhost:3000. Inicie com "npm run dev:backend".',
    );
  }
}

async function login(page: Page, email: string) {
  await page.goto('/entrar');
  await page.getByLabel('Email Institucional').fill(email);
  await page.getByPlaceholder('Informe sua senha').fill(PASSWORD);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(/\/turmas/, { timeout: 10_000 });
  await acceptCurrentTerms(page);
  await page.goto('/turmas');
}

async function acceptCurrentTerms(page: Page) {
  const result = await page.evaluate(async () => {
    const storedSession = localStorage.getItem('pbl360.session');
    if (!storedSession) throw new Error('A sessão autenticada não foi persistida no navegador.');
    const token = (JSON.parse(storedSession) as { token?: string }).token;
    if (!token) throw new Error('A sessão autenticada não contém um token.');

    const headers = { Authorization: `Bearer ${token}` };
    const statusResponse = await fetch('/api/usuarios/meu-aceite-termo', { headers });
    if (!statusResponse.ok) {
      throw new Error(`Falha ao consultar o aceite do termo: HTTP ${statusResponse.status}.`);
    }
    const status = (await statusResponse.json()) as {
      aceito: boolean;
      versaoVigente: string;
    };
    if (status.aceito) return status;

    const acceptResponse = await fetch('/api/usuarios/meu-aceite-termo', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ versao: status.versaoVigente }),
    });
    if (!acceptResponse.ok) {
      throw new Error(`Falha ao aceitar o termo vigente: HTTP ${acceptResponse.status}.`);
    }
    return (await acceptResponse.json()) as typeof status;
  });
  expect(result.aceito).toBe(true);
}

export async function loginAsTeacher(page: Page) {
  await login(page, TEACHER_EMAIL);
}

export async function loginAsStudent(page: Page) {
  await login(page, STUDENT_EMAIL);
}

export async function logout(page: Page) {
  await page.getByRole('button', { name: 'Abrir menu da conta' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Sair da conta' }).click();
}

export async function openSeedProblem(page: Page) {
  await page.goto('/turmas');
  await page.getByRole('heading', { level: 3, name: ROOM_NAME }).click();
  await expect(page).toHaveURL(/\/turmas\/[^/]+\/problemas/, { timeout: 10_000 });
  await page.getByRole('heading', { level: 3, name: PROBLEM_NAME }).click();
  await expect(page).toHaveURL(/\/turmas\/[^/]+\/problemas\/[^/]+$/, {
    timeout: 10_000,
  });
}

function futureSessionDate() {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return [date.getDate(), date.getMonth() + 1, date.getFullYear()]
    .map((part, index) => (index < 2 ? String(part).padStart(2, '0') : String(part)))
    .join('/');
}

export async function createIsolatedSession(page: Page, title: string) {
  await openSeedProblem(page);
  await page.getByRole('button', { name: 'Ações da sessão' }).click();
  await page.getByRole('button', { name: 'Criar nova sessão' }).click();

  const modal = page.getByRole('dialog');
  await expect(modal.getByRole('heading', { name: 'Criar Sessão' })).toBeVisible();
  await page.getByLabel('Título da Sessão').fill(title);
  await page.getByLabel('Descrição da Sessão').fill('Sessão criada por teste E2E Full-Stack.');
  await page.getByLabel('Data da Sessão').fill(futureSessionDate());
  await modal.getByRole('button', { name: 'Criar sessão' }).click();

  const sessionHeading = page.getByRole('heading', { level: 3, name: title });
  await expect(sessionHeading).toBeVisible({ timeout: 10_000 });
  await sessionHeading.click();
  await expect(page).toHaveURL(/\/turmas\/[^/]+\/problemas\/[^/]+\/sessoes\/[^/]+$/, {
    timeout: 10_000,
  });

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

async function ensurePresent(page: Page, studentName: string) {
  const escapedName = studentName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const table = page.getByRole('group', { name: 'Mesa tutorial' });
  await expect(page.getByRole('button', { name: 'Restantes ausentes' })).toBeVisible();
  await expect(table.getByRole('button', { name: /Lugar \d+/ }).first()).toBeVisible();
  const presentSeat = table.getByRole('button', {
    name: new RegExp(`${escapedName}.*Presente`),
  });
  if (await presentSeat.count()) return;

  const seatedSeat = table.getByRole('button', { name: new RegExp(escapedName) });
  if (await seatedSeat.count()) {
    await seatedSeat.click();
  } else {
    await page.getByRole('button', { name: new RegExp(`^${escapedName}, fora da mesa`) }).click();
    await page
      .getByRole('button', { name: /Lugar \d+, livre/ })
      .first()
      .click();
    await expect(presentSeat).toBeVisible();
    return;
  }

  await page
    .getByRole('radiogroup', { name: 'Presença' })
    .getByRole('radio', { name: 'Presente' })
    .click();
  await page.getByRole('dialog').getByRole('button', { name: 'Fechar' }).click();
}

async function dragOffTable(page: Page, seat: Locator) {
  const from = (await seat.boundingBox())!;
  const to = (await page.locator('[data-drop="carometro"]').boundingBox())!;
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(from.x + from.width / 2 + 20, from.y + from.height / 2 + 20, { steps: 4 });
  await page.mouse.move(to.x + to.width / 2, to.y + 40, { steps: 10 });
  await page.mouse.up();
}

async function markOthersAbsent(page: Page, keep: string[]) {
  const table = page.getByRole('group', { name: 'Mesa tutorial' });
  const seated = table.getByRole('button', { name: /^Lugar \d+: / });
  const labels = await seated.evaluateAll((seats) =>
    seats.map((seat) => seat.getAttribute('aria-label') ?? ''),
  );
  for (const label of labels) {
    if (keep.some((name) => label.includes(name))) continue;
    await dragOffTable(page, table.getByRole('button', { name: label, exact: true }));
  }
}

export async function recordTwoParticipants(page: Page, sessionId: string) {
  const participants = ['Ana Souza', 'João Silva'];
  await page.goto(`/sessoes/${sessionId}/chamada`);
  for (const name of participants) await ensurePresent(page, name);
  await markOthersAbsent(page, participants);
  const markRemaining = page.getByRole('button', { name: 'Restantes ausentes' });
  if (await markRemaining.isEnabled()) await markRemaining.click();
  await page.getByRole('button', { name: 'Salvar chamada' }).click();
  await expect(page.getByText('Chamada salva.')).toBeVisible();
}

export async function releaseStudentEvaluation(page: Page, type: 'autoavaliacao' | 'pares') {
  const label = type === 'autoavaliacao' ? 'Autoavaliação dos alunos' : 'Avaliação entre pares';
  await page.getByRole('switch', { name: label }).click();
  const dialog = page.getByRole('dialog', { name: /Liberar/ });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Confirmar liberação' }).click();
  await expect(page.getByRole('switch', { name: label })).toHaveAttribute('aria-checked', 'true');
}
