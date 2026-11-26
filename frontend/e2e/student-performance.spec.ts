import { expect, test, type Page, type Route } from '@playwright/test';
import { loginAsTeacher, openSeedRoom, skipIfBackendUnavailable } from './helpers/fullstack';

const ROOM_ID = 'sala-1';
const EVOLUTION_URL = `/turmas/${ROOM_ID}/participantes/aluno-1/evolucao`;

const mockRoom = {
  id: ROOM_ID,
  nome: 'Turma de Medicina - 2026.1',
  semestre: '2026.1',
  codigoDisciplina: 'MED101',
  codigoSala: 'SALA-MED',
  professorResponsavelId: 'user-tutor-1',
  ativo: true,
  criadoEm: '2026-01-10T10:00:00.000Z',
  totalAlunos: 2,
  totalProblemas: 3,
};

const mockStudents = [
  {
    id: 'aluno-1',
    nome: 'Ana Souza',
    email: '20260001@discente.uefs.br',
    matricula: '20260001',
    dataEntrada: '2026-01-15T10:00:00.000Z',
  },
  {
    id: 'aluno-2',
    nome: 'Bruno Mendes',
    email: '20260002@discente.uefs.br',
    matricula: '20260002',
    dataEntrada: '2026-01-15T10:00:00.000Z',
  },
];

const mockTutors = [
  { id: 'user-tutor-1', nome: 'Prof. Carlos Santos', email: 'carlos@uefs.br', responsavel: true },
];

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
  problem('prob-2', 'Problema 2 - Dispneia', 2),
  problem('prob-1', 'Problema 1 - Dor Torácica', 1),
  problem('prob-3', 'Problema 3 - Sepse', 3),
];

type MockSession = {
  sessaoId: string;
  problemaId: string;
  problemaTitulo: string;
  rotulo: string;
  data: string;
  nota: number | null;
  situacao: string;
  modalidade: string;
  presenca: string | null;
  marcacoes: Array<{ id: string; nome: string; quantidade: number }>;
};

function session(
  id: string,
  problemaId: string,
  rotulo: string,
  data: string,
  more: Partial<MockSession> = {},
): MockSession {
  const titles: Record<string, string> = {
    'prob-1': 'Problema 1 - Dor Torácica',
    'prob-2': 'Problema 2 - Dispneia',
    'prob-3': 'Problema 3 - Sepse',
  };
  return {
    sessaoId: id,
    problemaId,
    problemaTitulo: titles[problemaId],
    rotulo,
    data,
    nota: 7,
    situacao: 'AVALIADA',
    modalidade: 'TUTOR',
    presenca: 'PRESENTE',
    marcacoes: [],
    ...more,
  };
}

// A real zero, a pending grade and two problems with sessions of the same title.
const anaSessions = [
  session('s1', 'prob-1', 'Abertura', '03-02-2026', {
    nota: 7.5,
    marcacoes: [{ id: 'm1', nome: 'Participativo', quantidade: 1 }],
  }),
  session('s2', 'prob-1', 'Fechamento', '10-02-2026', {
    nota: null,
    situacao: 'PENDENTE',
    presenca: null,
  }),
  session('s3', 'prob-2', 'Abertura', '17-02-2026', {
    nota: 0,
    modalidade: 'PARES',
    presenca: 'ATRASADO',
    marcacoes: [{ id: 'm2', nome: 'Não entregou a síntese', quantidade: 2 }],
  }),
  session('s4', 'prob-2', 'Fechamento', '24-02-2026', { nota: 9, modalidade: 'AUTOAVALIACAO' }),
];

const brunoSessions = Array.from({ length: 18 }, (_, index) =>
  session(
    `b${index}`,
    `prob-${Math.floor(index / 6) + 1}`,
    `Sessão ${(index % 6) + 1}`,
    `${String((index % 28) + 1).padStart(2, '0')}-03-2026`,
    { nota: index % 5 === 2 ? null : 6 + (index % 4) },
  ),
);

const SESSIONS_BY_STUDENT: Record<string, MockSession[]> = {
  'aluno-1': anaSessions,
  'aluno-2': brunoSessions,
};

type PerformanceHandler = (route: Route, studentId: string, problemId: string | null) => unknown;

const fulfillJson = (route: Route, body: unknown, status = 200) =>
  route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

// Answers like the API: the problemaId filter is applied on the server, not in the browser.
const answerFromMock: PerformanceHandler = (route, studentId, problemId) => {
  const sessions = SESSIONS_BY_STUDENT[studentId] ?? [];
  const student = mockStudents.find((item) => item.id === studentId)!;
  return fulfillJson(route, {
    sala: { id: ROOM_ID, nome: mockRoom.nome },
    aluno: { id: student.id, nome: student.nome },
    sessoes: problemId ? sessions.filter((item) => item.problemaId === problemId) : sessions,
  });
};

async function mockApi(page: Page, onPerformance: PerformanceHandler = answerFromMock) {
  await page.addInitScript(() => {
    localStorage.setItem(
      'pbl360.session',
      JSON.stringify({
        token: 'mock-tutor-token',
        expiraEm: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        usuario: {
          id: 'user-tutor-1',
          nome: 'Prof. Carlos Santos',
          email: 'carlos@uefs.br',
          tipo: 'PROFESSOR',
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
  await page.route(`**/api/salas/${ROOM_ID}`, (route) => fulfillJson(route, mockRoom));
  await page.route(`**/api/salas/${ROOM_ID}/alunos`, (route) => fulfillJson(route, mockStudents));
  await page.route(`**/api/salas/${ROOM_ID}/professores`, (route) =>
    fulfillJson(route, mockTutors),
  );
  await page.route(`**/api/salas/${ROOM_ID}/problemas`, (route) =>
    fulfillJson(route, mockProblems),
  );
  await page.route(/\/api\/salas\/sala-1\/alunos\/([^/]+)\/desempenho/, (route) => {
    const url = new URL(route.request().url());
    const studentId = url.pathname.split('/').at(-2)!;
    return onPerformance(route, studentId, url.searchParams.get('problemaId'));
  });
}

const focusCard = (page: Page) => page.getByRole('region', { name: 'Sessão selecionada' });

test.describe('Evolução do aluno por sessões', () => {
  test('abre a evolução a partir da turma e mostra a sessão mais recente', async ({ page }) => {
    await mockApi(page);
    await page.goto(`/turmas/${ROOM_ID}/participantes`);

    await page.getByRole('button', { name: 'Ver detalhes de Ana Souza' }).click();
    await page
      .getByRole('dialog', { name: 'Detalhes do Aluno' })
      .getByRole('link', { name: 'Ver evolução nas sessões' })
      .click();

    await expect(page).toHaveURL(EVOLUTION_URL);
    await expect(page.getByRole('heading', { name: 'Evolução do aluno' })).toBeVisible();
    await expect(page.getByLabel('Trocar aluno')).toHaveValue('aluno-1');
    const card = focusCard(page);
    await expect(card.getByText('Sessão 4 de 4')).toBeVisible();
    await expect(card.getByText('9,0')).toBeVisible();
    await expect(card.getByText('Problema 2 - Dispneia')).toBeVisible();
    await expect(card.getByText('Autoavaliação')).toBeVisible();
  });

  test('desenha a nota zero normalmente e a pendência sem ponto', async ({ page }) => {
    await mockApi(page);
    await page.goto(EVOLUTION_URL);

    await page
      .getByRole('button', { name: 'Problema 1 - Dor Torácica, Fechamento, 10/02/2026: sem nota' })
      .click();
    await expect(focusCard(page).getByText('Sem nota')).toBeVisible();
    await expect(focusCard(page).getByText('Pendente').first()).toBeVisible();
    await expect(focusCard(page).getByText('Não registrada')).toBeVisible();

    await page
      .getByRole('button', { name: 'Problema 2 - Dispneia, Abertura, 17/02/2026: nota 0,0' })
      .click();
    await expect(focusCard(page).getByText('0,0')).toBeVisible();
    await expect(focusCard(page).getByText('Atrasado')).toBeVisible();
    await expect(focusCard(page).getByText('×2')).toBeVisible();
  });

  test('navega entre as sessões pelos botões e pelo teclado', async ({ page }) => {
    await mockApi(page);
    await page.goto(EVOLUTION_URL);
    await expect(focusCard(page).getByText('Sessão 4 de 4')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Próxima sessão' })).toBeDisabled();

    await page.getByRole('button', { name: 'Sessão anterior' }).click();
    await expect(focusCard(page).getByText('Sessão 3 de 4')).toBeVisible();

    await page.getByRole('button', { name: /Abertura, 17\/02\/2026: nota 0,0/ }).focus();
    await page.keyboard.press('ArrowLeft');
    await expect(focusCard(page).getByText('Sessão 2 de 4')).toBeVisible();
    await page.keyboard.press('Home');
    await expect(focusCard(page).getByText('Sessão 1 de 4')).toBeVisible();
    await expect(focusCard(page).getByText('7,5')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sessão anterior' })).toBeDisabled();
  });

  test('filtra por problema no servidor e oferece voltar para todos', async ({ page }) => {
    await mockApi(page);
    await page.goto(EVOLUTION_URL);
    await expect(focusCard(page).getByText('Sessão 4 de 4')).toBeVisible();

    const filtered = page.waitForRequest((request) =>
      request.url().includes('/desempenho?problemaId=prob-2'),
    );
    await page.getByRole('button', { name: 'Problema 2 - Dispneia', exact: true }).click();
    await filtered;
    await expect(page).toHaveURL(/\?problema=prob-2$/);
    await expect(focusCard(page).getByText('Sessão 2 de 2')).toBeVisible();

    await page.getByRole('button', { name: 'Problema 3 - Sepse', exact: true }).click();
    await expect(page.getByText('Nenhuma sessão registrada')).toBeVisible();
    await expect(
      page.getByText('Ana ainda não tem sessões registradas em Problema 3 - Sepse.'),
    ).toBeVisible();

    await page.getByRole('button', { name: 'Ver todos os problemas' }).click();
    await expect(page).toHaveURL(EVOLUTION_URL);
    await expect(focusCard(page).getByText('Sessão 4 de 4')).toBeVisible();
  });

  test('troca de aluno sem manter os dados do aluno anterior', async ({ page }) => {
    let releaseBruno: () => void = () => {};
    const brunoReady = new Promise<void>((resolve) => (releaseBruno = resolve));
    await mockApi(page, async (route, studentId, problemId) => {
      if (studentId === 'aluno-2') await brunoReady;
      return answerFromMock(route, studentId, problemId);
    });
    await page.goto(EVOLUTION_URL);
    await expect(focusCard(page).getByText('Sessão 4 de 4')).toBeVisible();

    await page.getByLabel('Trocar aluno').selectOption('aluno-2');

    await expect(page).toHaveURL(`/turmas/${ROOM_ID}/participantes/aluno-2/evolucao`);
    await expect(page.getByText('Carregando desempenho de Bruno Mendes…')).toBeVisible();
    await expect(focusCard(page)).toHaveCount(0);
    releaseBruno();
    await expect(focusCard(page).getByText('Sessão 18 de 18')).toBeVisible();
    await expect(page.getByText('18 sessões · arraste para o lado')).toBeVisible();
  });

  test('explica quando o professor não tem acesso à evolução', async ({ page }) => {
    await mockApi(page, (route) =>
      fulfillJson(
        route,
        { message: 'Apenas o professor responsável ou co-tutor da sala pode consultar.' },
        403,
      ),
    );
    await page.goto(EVOLUTION_URL);

    await expect(page.getByText('Você não tem acesso a esta evolução')).toBeVisible();
    await expect(
      page.getByText('Apenas o professor responsável ou co-tutor da sala pode consultar.'),
    ).toBeVisible();
  });

  test('mostra o erro e carrega de novo ao tentar novamente', async ({ page }) => {
    let attempts = 0;
    await mockApi(page, (route, studentId, problemId) => {
      attempts += 1;
      if (attempts === 1) return fulfillJson(route, { message: 'Falha interna.' }, 500);
      return answerFromMock(route, studentId, problemId);
    });
    await page.goto(EVOLUTION_URL);

    await expect(page.getByRole('alert')).toContainText('erro inesperado no servidor');
    await page.getByRole('button', { name: 'Tentar novamente' }).click();
    await expect(focusCard(page).getByText('Sessão 4 de 4')).toBeVisible();
  });
});

test.describe('Evolução do aluno no celular', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test('cabe na tela sem rolagem lateral e troca de sessão ao deslizar o card', async ({
    page,
  }) => {
    await mockApi(page);
    await page.goto(EVOLUTION_URL);
    await expect(focusCard(page).getByText('Sessão 4 de 4')).toBeVisible();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);

    const box = (await focusCard(page).boundingBox())!;
    const y = box.y + box.height / 2;
    await page.mouse.move(box.x + 60, y);
    await page.mouse.down();
    await page.mouse.move(box.x + 220, y, { steps: 5 });
    await page.mouse.up();

    await expect(focusCard(page).getByText('Sessão 3 de 4')).toBeVisible();
  });
});

test.describe('Evolução com muitas sessões no celular', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test('rola só o gráfico, sem empurrar a página para o lado', async ({ page }) => {
    await mockApi(page);
    await page.goto(`/turmas/${ROOM_ID}/participantes/aluno-2/evolucao`);
    await expect(focusCard(page).getByText('Sessão 18 de 18')).toBeVisible();

    await page.getByRole('button', { name: 'Sessão anterior' }).click();
    await expect(focusCard(page).getByText('Sessão 17 de 18')).toBeVisible();

    const layout = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - window.innerWidth,
      scrollX: window.scrollX,
    }));
    expect(layout.overflow).toBeLessThanOrEqual(0);
    expect(layout.scrollX).toBe(0);
  });
});

test.describe('E2E Full-Stack: evolução do aluno', () => {
  test.beforeEach(async () => {
    await skipIfBackendUnavailable();
  });

  test('carrega a evolução real de um aluno da turma do seed', async ({ page }) => {
    await loginAsTeacher(page);
    await openSeedRoom(page);
    const roomId = new URL(page.url()).pathname.split('/')[2];
    await page.goto(`/turmas/${roomId}/participantes`);

    await page.getByRole('button', { name: 'Ver detalhes de Ana Souza' }).click();
    const performance = page.waitForResponse((response) => response.url().includes('/desempenho'));
    await page.getByRole('link', { name: 'Ver evolução nas sessões' }).click();

    expect((await performance).status()).toBe(200);
    await expect(page.getByLabel('Trocar aluno')).toBeVisible();
    await expect(
      focusCard(page).or(page.getByText('Nenhuma sessão registrada')).first(),
    ).toBeVisible();
    await expect(page.getByRole('alert')).toHaveCount(0);
  });
});
