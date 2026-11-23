import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import { skipIfBackendUnavailable } from './helpers/fullstack';

const API = 'http://localhost:3000/api';
const PASSWORD = 'senha-secreta';
const TUTOR_EMAIL = 'carlos@uefs.br';
const STUDENT_EMAILS = [1, 2, 3, 4].map((n) => `2024000${n}@discente.uefs.br`);

type Account = { token: string; id: string; nome: string };
type Scenario = {
  roomId: string;
  problemId: string;
  firstSessionId: string;
  secondSessionId: string;
  students: Account[];
};

async function send<T>(
  request: APIRequestContext,
  token: string | null,
  method: 'GET' | 'POST' | 'PUT',
  path: string,
  data?: unknown,
): Promise<T> {
  const response = await request.fetch(`${API}${path}`, {
    method,
    data,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  expect(response.ok(), `${method} ${path}: ${await response.text()}`).toBeTruthy();
  const text = await response.text();
  return (text ? JSON.parse(text) : null) as T;
}

async function signIn(request: APIRequestContext, email: string): Promise<Account> {
  const { token, usuario } = await send<{ token: string; usuario: { id: string; nome: string } }>(
    request,
    null,
    'POST',
    '/autenticacao/login',
    { email, senha: PASSWORD },
  );
  const terms = await send<{ aceito: boolean; versaoVigente: string }>(
    request,
    token,
    'GET',
    '/usuarios/meu-aceite-termo',
  );
  if (!terms.aceito) {
    await send(request, token, 'POST', '/usuarios/meu-aceite-termo', {
      versao: terms.versaoVigente,
    });
  }
  return { token, id: usuario.id, nome: usuario.nome };
}

function sessionDate(offsetDays: number) {
  const date = new Date(Date.now() + offsetDays * 86_400_000);
  return [date.getDate(), date.getMonth() + 1, date.getFullYear()]
    .map((part) => String(part).padStart(2, '0'))
    .join('-');
}

async function decideRound(
  request: APIRequestContext,
  tutor: Account,
  sessionId: string,
  target: Account,
  voters: Account[],
  vote: number,
) {
  const base = `/sessoes/${sessionId}/poker/rodadas`;
  const round = await send<{ rodadaId: string }>(request, tutor.token, 'POST', base, {
    alunoId: target.id,
  });
  for (const voter of voters) {
    await send(request, voter.token, 'PUT', `${base}/${round.rodadaId}/voto`, { nota: vote });
  }
  await send(request, tutor.token, 'POST', `${base}/${round.rodadaId}/revelar`);
  await send(request, tutor.token, 'POST', `${base}/${round.rodadaId}/decisao`, {
    acao: 'ACEITAR',
  });
}

async function createScenario(request: APIRequestContext): Promise<Scenario> {
  const tutor = await signIn(request, TUTOR_EMAIL);
  const students: Account[] = [];
  for (const email of STUDENT_EMAILS) students.push(await signIn(request, email));
  const room = await send<{ id: string; codigoSala: string }>(
    request,
    tutor.token,
    'POST',
    '/salas',
    { nome: `E2E histórico poker ${Date.now()}`, codigoDisciplina: 'EXA123', semestre: '2026.2' },
  );
  for (const student of students) {
    await send(request, student.token, 'POST', '/salas/ingressar/codigo', {
      codigoSala: room.codigoSala,
    });
  }
  const problem = await send<{ id: string }>(
    request,
    tutor.token,
    'POST',
    `/salas/${room.id}/problemas`,
    { titulo: 'Problema do histórico com poker' },
  );
  const createSession = (titulo: string, offset: number) =>
    send<{ id: string }>(
      request,
      tutor.token,
      'POST',
      `/salas/${room.id}/problemas/${problem.id}/sessoes`,
      { titulo, descricao: null, data: sessionDate(offset) },
    );
  const first = await createSession('Sessão com poker', 0);
  const second = await createSession('Sessão seguinte', 1);
  await send(request, tutor.token, 'PUT', `/sessoes/${first.id}/chamada`, {
    registros: students.map((student, index) => ({
      alunoId: student.id,
      status: 'PRESENTE',
      lugar: index + 1,
    })),
  });
  await send(request, tutor.token, 'POST', `/sessoes/${first.id}/poker`, {
    anonimo: false,
    ordem: 'MANUAL',
  });
  const [ana, joao, ...others] = students;
  await decideRound(request, tutor, first.id, ana!, [joao!, ...others], 8);
  await decideRound(request, tutor, first.id, joao!, [ana!, ...others], 6.5);
  return {
    roomId: room.id,
    problemId: problem.id,
    firstSessionId: first.id,
    secondSessionId: second.id,
    students,
  };
}

async function loginAsTutor(page: Page) {
  await page.goto('/entrar');
  await page.getByLabel('Email Institucional').fill(TUTOR_EMAIL);
  await page.getByPlaceholder('Informe sua senha').fill(PASSWORD);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(/\/turmas/, { timeout: 10_000 });
}

function cardOf(page: Page, name: string) {
  return page.locator('article').filter({ has: page.getByRole('heading', { name }) });
}

test.describe('E2E Full-Stack: histórico de avaliações com planning poker', () => {
  let scenario: Scenario;

  test.beforeAll(async ({ request }) => {
    await skipIfBackendUnavailable();
    scenario = await createScenario(request);
  });

  test('mostra a nota do poker e permite ajustá-la com justificativa', async ({ page }) => {
    const [ana, , beatriz] = scenario.students;
    await loginAsTutor(page);
    await page.goto(
      `/turmas/${scenario.roomId}/problemas/${scenario.problemId}/sessoes/${scenario.firstSessionId}/historico`,
    );

    const anaCard = cardOf(page, ana!.nome);
    await expect(anaCard.getByText('Sem ajuste do tutor')).toBeVisible();
    await expect(anaCard.getByText('Poker')).toBeVisible();
    await expect(anaCard.getByText('8,0')).toBeVisible();
    await expect(cardOf(page, beatriz!.nome).getByText('Avaliação pendente')).toBeVisible();

    await page.getByRole('button', { name: `Ajustar nota de ${ana!.nome}` }).click();
    const dialog = page.getByRole('dialog', { name: ana!.nome });
    await expect(dialog.getByLabel('Nota do planning poker')).toHaveValue('8,0');
    await expect(dialog.getByText('Média dos votos')).toBeVisible();

    await dialog.getByLabel('Nova nota').fill('9');
    await dialog.getByLabel('Justificativa do ajuste').fill('Conduziu muito bem a discussão.');
    await dialog.getByRole('button', { name: 'Salvar ajuste' }).click();
    await expect(page.getByText('Ajuste de nota salvo com sucesso!')).toBeVisible();

    await page.reload();
    await expect(anaCard.getByText('Ajustada com justificativa')).toBeVisible();
    await expect(anaCard.getByText('8,0')).toBeVisible();
    await expect(anaCard.getByText('9,0')).toBeVisible();
  });

  test('tira a presença arrastando a foto no celular a partir da segunda sessão', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginAsTutor(page);
    await page.goto(`/sessoes/${scenario.secondSessionId}/chamada`);

    const seat = page.getByRole('button', { name: /^Lugar 1: .*Presente/ });
    await expect(seat).toBeVisible();
    const box = (await seat.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + 40, box.y + 60, { steps: 5 });
    const dropZone = page.getByText(/Solte aqui para tirar .* da mesa/);
    await expect(dropZone).toBeVisible();
    const zone = (await dropZone.boundingBox())!;
    await page.mouse.move(zone.x + zone.width / 2, zone.y + zone.height / 2, { steps: 10 });
    await page.mouse.up();

    await expect(page.getByRole('button', { name: 'Lugar 1, livre' })).toBeVisible();
    await page.getByRole('button', { name: 'Salvar chamada' }).click();
    await expect(page.getByText('Chamada salva.')).toBeVisible();
  });

  test('mostra como avaliado o aluno que recebeu apenas a avaliação do professor', async ({
    page,
    request,
  }) => {
    const tutor = await signIn(request, TUTOR_EMAIL);
    const [ana, joao] = scenario.students;
    const session = await send<{ id: string }>(
      request,
      tutor.token,
      'POST',
      `/salas/${scenario.roomId}/problemas/${scenario.problemId}/sessoes`,
      { titulo: 'Sessão avaliada pelo professor', descricao: null, data: sessionDate(2) },
    );
    await send(request, tutor.token, 'PUT', `/sessoes/${session.id}/chamada`, {
      registros: scenario.students.map((student, index) => ({
        alunoId: student.id,
        status: 'PRESENTE',
        lugar: index + 1,
      })),
    });
    const evaluation = await send<{ criterios: Array<{ id: string }> }>(
      request,
      tutor.token,
      'GET',
      `/sessoes/${session.id}/avaliacoes/${ana!.id}`,
    );
    await send(request, tutor.token, 'PUT', `/sessoes/${session.id}/avaliacoes/${ana!.id}`, {
      itens: evaluation.criterios.map((criterion) => ({ criterioId: criterion.id, nota: 9 })),
      notaCargo: null,
      enviar: true,
    });

    await loginAsTutor(page);
    await page.goto(
      `/turmas/${scenario.roomId}/problemas/${scenario.problemId}/sessoes/${session.id}/historico`,
    );

    const anaCard = cardOf(page, ana!.nome);
    await expect(anaCard.getByText('Avaliada pelo tutor')).toBeVisible();
    await expect(anaCard.getByText('9,0')).toBeVisible();
    await expect(cardOf(page, joao!.nome).getByText('Avaliação pendente')).toBeVisible();
  });
});
