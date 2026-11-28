import { expect, test, type Page, type Route } from '@playwright/test';
import { loginAsStudent, openSeedRoom, skipIfBackendUnavailable } from './helpers/fullstack';

const ROOM_ID = 'sala-1';
const MY_EVOLUTION_URL = `/turmas/${ROOM_ID}/minha-evolucao`;

const problem = (id: string, titulo: string, ordem: number) => ({
  id,
  salaId: ROOM_ID,
  titulo,
  descricao: null,
  ordem,
  dataInicio: null,
  dataFim: null,
  tabelaId: null,
  autoavaliacaoLiberada: false,
  avaliacaoEntreParesLiberada: false,
});

const mockProblems = [
  problem('prob-1', 'Problema 1 - Dor Torácica', 1),
  problem('prob-2', 'Problema 2 - Dispneia', 2),
];

const tutorFeedback = (nota: number | null) => ({
  id: 'feedback-1',
  autor: { id: 'user-tutor-1', nome: 'Prof. Carlos Santos' },
  texto: 'Conduziu bem a discussão do caso.',
  criadoEm: '2026-02-03T10:00:00.000Z',
  editadoEm: null,
  novo: false,
  nota,
});

// What the student API releases: a tutor grade, a grade not released yet and a real zero.
const FEEDBACKS: Record<string, unknown> = {
  'prob-1': {
    notaFinal: 7.5,
    individual: null,
    geral: null,
    sessoes: [
      { sessaoId: 's1', rotulo: 'Abertura', data: '03-02-2026', feedback: tutorFeedback(7.5) },
      { sessaoId: 's2', rotulo: 'Fechamento', data: '10-02-2026', feedback: null },
    ],
  },
  'prob-2': {
    notaFinal: 0,
    individual: null,
    geral: null,
    sessoes: [
      {
        sessaoId: 's3',
        rotulo: 'Abertura',
        data: '17-02-2026',
        feedback: null,
        nota: 0,
        avaliacoes: { modalidade: 'PARES', autoavaliacao: null, pares: null },
      },
    ],
  },
};

const fulfillJson = (route: Route, body: unknown, status = 200) =>
  route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

async function mockStudentApi(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem(
      'pbl360.session',
      JSON.stringify({
        token: 'mock-student-token',
        expiraEm: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        usuario: {
          id: 'aluno-1',
          nome: 'Ana Souza',
          email: '20260001@discente.uefs.br',
          tipo: 'ALUNO',
          possuiFoto: false,
          ativo: true,
        },
      }),
    );
  });

  // Registered first, so every specific route below takes precedence over it.
  await page.route('**/api/**', (route) => fulfillJson(route, { message: 'Não encontrado.' }, 404));
  await page.route('**/api/usuarios/meu-aceite-termo', (route) =>
    fulfillJson(route, {
      aceito: true,
      versaoAceita: '1.0',
      aceitoEm: '2026-01-01T00:00:00.000Z',
      versaoVigente: '1.0',
    }),
  );
  await page.route('**/api/salas/minhas', (route) =>
    fulfillJson(route, [
      { salaId: ROOM_ID, nome: 'Turma de Medicina - 2026.1', semestre: '2026.1', totalAlunos: 2 },
    ]),
  );
  await page.route(`**/api/salas/${ROOM_ID}/problemas`, (route) =>
    fulfillJson(route, mockProblems),
  );
  await page.route(/\/api\/salas\/sala-1\/problemas\/([^/]+)\/meus-feedbacks/, (route) => {
    const problemId = new URL(route.request().url()).pathname.split('/').at(-2)!;
    return fulfillJson(route, FEEDBACKS[problemId]);
  });
}

const focusCard = (page: Page) => page.getByRole('region', { name: 'Sessão selecionada' });

test.describe('Evolução do próprio aluno', () => {
  test('abre a partir da página da turma e mostra a sessão mais recente', async ({ page }) => {
    await mockStudentApi(page);
    await page.goto(`/turmas/${ROOM_ID}/problemas`);

    await page.getByRole('link', { name: /Minha evolução/ }).click();

    await expect(page).toHaveURL(MY_EVOLUTION_URL);
    await expect(page.getByRole('heading', { name: 'Minha evolução' })).toBeVisible();
    const card = focusCard(page);
    await expect(card.getByText('Sessão 3 de 3')).toBeVisible();
    await expect(card.getByText('0,0')).toBeVisible();
    await expect(card.getByText('Entre pares')).toBeVisible();
  });

  test('mostra a nota liberada com o feedback e a pendência sem nota', async ({ page }) => {
    await mockStudentApi(page);
    await page.goto(MY_EVOLUTION_URL);

    await page
      .getByRole('button', { name: 'Problema 1 - Dor Torácica, Abertura, 03/02/2026: nota 7,5' })
      .click();
    await expect(focusCard(page).getByText('7,5')).toBeVisible();
    await expect(focusCard(page).getByText('Conduziu bem a discussão do caso.')).toBeVisible();

    await page
      .getByRole('button', { name: 'Problema 1 - Dor Torácica, Fechamento, 10/02/2026: sem nota' })
      .click();
    await expect(focusCard(page).getByText('Sem nota')).toBeVisible();
    await expect(focusCard(page).getByText('Aguardando liberação')).toBeVisible();
  });

  test('não mostra as marcações de comportamento ao aluno', async ({ page }) => {
    await mockStudentApi(page);
    await page.goto(MY_EVOLUTION_URL);
    await expect(focusCard(page).getByText('Sessão 3 de 3')).toBeVisible();

    await expect(page.getByText('Marcações')).toHaveCount(0);
  });

  test('filtra por problema', async ({ page }) => {
    await mockStudentApi(page);
    await page.goto(MY_EVOLUTION_URL);
    await expect(focusCard(page).getByText('Sessão 3 de 3')).toBeVisible();

    await page.getByRole('button', { name: 'Problema 1 - Dor Torácica', exact: true }).click();

    await expect(page).toHaveURL(/\?problema=prob-1$/);
    await expect(focusCard(page).getByText('Sessão 2 de 2')).toBeVisible();
  });

  test('cabe na tela do celular sem rolagem lateral', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await mockStudentApi(page);
    await page.goto(MY_EVOLUTION_URL);
    await expect(focusCard(page).getByText('Sessão 3 de 3')).toBeVisible();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});

test.describe('E2E Full-Stack: evolução do próprio aluno', () => {
  test.beforeEach(async () => {
    await skipIfBackendUnavailable();
  });

  test('o aluno do seed abre a própria evolução pela turma', async ({ page }) => {
    await loginAsStudent(page);
    await openSeedRoom(page);

    await page.getByRole('link', { name: /Minha evolução/ }).click();

    await expect(page).toHaveURL(/\/turmas\/[^/]+\/minha-evolucao$/);
    await expect(
      focusCard(page).or(page.getByText('Nenhuma sessão registrada')).first(),
    ).toBeVisible();
    await expect(page.getByRole('alert')).toHaveCount(0);
  });
});
