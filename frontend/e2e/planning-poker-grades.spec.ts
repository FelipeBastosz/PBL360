import { test, expect, type Page, type Route, type WebSocketRoute } from '@playwright/test';

const ROOM_ID = 'sala-1';
const PROBLEM_ID = 'problema-1';
const SESSION_ID = 'sessao-1';
const ROUND_ID = 'rodada-1';
const SESSION_PATH = `/turmas/${ROOM_ID}/problemas/${PROBLEM_ID}/sessoes/${SESSION_ID}`;

const tutor = {
  id: 'user-tutor-1',
  nome: 'Carlos Silva',
  email: 'carlos@faculdade.edu.br',
  tipo: 'PROFESSOR',
  ativo: true,
};

const bruno = {
  id: 'aluno-2',
  nome: 'Bruno Lima',
  email: 'bruno@discente.edu.br',
  tipo: 'ALUNO',
  ativo: true,
};

const students = [
  { alunoId: 'aluno-1', nome: 'Ana Souza', iniciais: 'AS', fotoUrl: null, lugar: 1 },
  { alunoId: 'aluno-2', nome: 'Bruno Lima', iniciais: 'BL', fotoUrl: null, lugar: 2 },
  { alunoId: 'aluno-3', nome: 'Carla Mendes', iniciais: 'CM', fotoUrl: null, lugar: 3 },
];

const table = students.map((student, index) => ({
  lugar: student.lugar,
  alunoId: student.alunoId,
  nome: student.nome,
  iniciais: student.iniciais,
  avaliado: index === 0,
  votou: index > 0,
}));

const pokerState = (overrides: Record<string, unknown> = {}) => ({
  pokerId: 'poker-1',
  anonimo: false,
  ordem: 'SEQUENCIAL',
  status: 'ABERTO',
  participantes: students,
  ausentes: [],
  fila: ['aluno-2', 'aluno-3'],
  concluidas: [],
  rodadaAtual: null,
  participante: true,
  ...overrides,
});

const revealedRound = {
  rodadaId: ROUND_ID,
  numero: 1,
  status: 'REVELADA',
  avaliado: students[0],
  mesa: table,
  votantesEsperados: 2,
  votaram: 2,
  lugaresQueVotaram: [2, 3],
  revelacao: {
    votos: [
      { lugar: 2, nota: 8.5, alunoId: 'aluno-2', nome: 'Bruno Lima' },
      { lugar: 3, nota: 9, alunoId: 'aluno-3', nome: 'Carla Mendes' },
    ],
    media: 8.75,
    totalVotos: 2,
    faltaram: 0,
  },
};

const votingRound = {
  ...revealedRound,
  status: 'VOTANDO',
  votaram: 0,
  lugaresQueVotaram: [],
  mesa: table.map((seat) => ({ ...seat, votou: false })),
  revelacao: null,
  souAvaliado: false,
  meuVoto: null,
  meuLugar: 2,
};

const decidedForTutor = pokerState({
  concluidas: [
    {
      alunoId: 'aluno-1',
      nome: 'Ana Souza',
      iniciais: 'AS',
      media: 8.75,
      notaFinal: 8.9,
      ajustada: true,
    },
  ],
});

const sessionGrade = (nota: number | null) => ({
  sessaoId: SESSION_ID,
  nota,
  situacao: nota === null ? 'PENDENTE' : 'AVALIADA',
  modalidade: 'PARES',
  autoavaliacao: { nota: null, situacao: 'NAO_LIBERADA' },
  pares: {
    nota,
    situacao: nota === null ? 'SEM_AVALIACOES' : 'AVALIADA',
    origem: 'PLANNING_POKER',
  },
});

const problemGrades = (anaGrade: number | null) => ({
  sessoes: [{ id: SESSION_ID, rotulo: 'S1', data: '2026-10-12' }],
  alunos: [
    {
      alunoId: 'aluno-1',
      nome: 'Ana Souza',
      matricula: '20260001',
      sessoes: [sessionGrade(anaGrade)],
      notaFinal: anaGrade,
    },
  ],
  mediaTurma: anaGrade,
  versoesFormula: { sessao: null, problema: null },
});

const json = (route: Route, body: unknown, status = 200) =>
  route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

async function signIn(page: Page, user: typeof tutor) {
  await page.addInitScript((usuario) => {
    localStorage.setItem(
      'pbl360.session',
      JSON.stringify({
        token: 'mock-auth-token',
        expiraEm: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        usuario,
      }),
    );
  }, user);
}

async function mockPokerSocket(page: Page): Promise<() => WebSocketRoute> {
  let socket: WebSocketRoute | undefined;
  await page.routeWebSocket('**/socket.io/**', (ws) => {
    socket = ws;
    ws.send('0{"sid":"engine","upgrades":[],"pingInterval":25000,"pingTimeout":60000}');
    ws.onMessage((message) => {
      if (typeof message === 'string' && message.startsWith('40/poker')) {
        ws.send('40/poker,{"sid":"poker"}');
        ws.send('42/poker,["poker.conectado",{"perfil":"PROFESSOR"}]');
      }
    });
  });
  return () => {
    if (!socket) throw new Error('The poker socket was not opened.');
    return socket;
  };
}

const emitPokerEvent = (socket: WebSocketRoute, name: string, payload: unknown) =>
  socket.send(`42/poker,${JSON.stringify([name, payload])}`);

test.describe('Planning poker grades', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/**', (route) => json(route, { message: 'Não encontrado.' }, 404));
  });

  test('tutor adjusts the grade with a mandatory justification using one decimal place', async ({
    page,
  }) => {
    await signIn(page, tutor);
    await mockPokerSocket(page);
    let decided = false;
    let decision: unknown;
    await page.route(`**/api/sessoes/${SESSION_ID}/poker`, (route) =>
      json(route, decided ? decidedForTutor : pokerState({ rodadaAtual: revealedRound })),
    );
    await page.route(`**/api/sessoes/${SESSION_ID}/poker/rodadas/${ROUND_ID}/decisao`, (route) => {
      decided = true;
      decision = route.request().postDataJSON();
      return json(route, { alunoId: 'aluno-1', media: 8.75, notaFinal: 8.9, ajustada: true });
    });

    await page.goto(`${SESSION_PATH}/planning-poker`);

    await expect(page.getByText('8,8').first()).toBeVisible();
    await page.getByRole('button', { name: 'Reajustar nota' }).click();
    await expect(page.getByRole('textbox', { name: 'Nova nota' })).toHaveValue('8,8');
    await page.getByRole('button', { name: 'Aumentar nota' }).click();
    await page.getByRole('button', { name: 'Salvar nota ajustada' }).click();
    await expect(page.getByText('Mínimo de 10 caracteres.')).toBeVisible();
    expect(decided).toBe(false);

    await page.getByPlaceholder('Motivo do ajuste da nota...').fill('Conduziu a síntese do grupo.');
    await page.getByRole('button', { name: 'Salvar nota ajustada' }).click();

    await expect(page.getByText('Nota reajustada.')).toBeVisible();
    expect(decision).toEqual({
      acao: 'REAJUSTAR',
      nota: 8.9,
      justificativa: 'Conduziu a síntese do grupo.',
    });
    await expect(page.getByText('8,9')).toBeVisible();
    await expect(page.getByText('1 de 3 avaliados')).toBeVisible();
  });

  test('evaluations list shows the planning poker grade as soon as the tutor decides', async ({
    page,
  }) => {
    await signIn(page, tutor);
    const pokerSocket = await mockPokerSocket(page);
    let anaGrade: number | null = null;
    await page.route(`**/api/sessoes/${SESSION_ID}/avaliacoes`, (route) =>
      json(route, [
        {
          alunoId: 'aluno-1',
          nome: 'Ana Souza',
          iniciais: 'AS',
          presenca: 'presente',
          status: 'PENDENTE',
          notaSessao: null,
        },
      ]),
    );
    await page.route(`**/api/salas/${ROOM_ID}/problemas/${PROBLEM_ID}/criterios`, (route) =>
      json(route, {
        tabela: { id: 'tabela-1', nome: 'Critérios tutoriais' },
        criterios: [{ id: 'criterio-1', nome: 'Participação', peso: 1, notaMaxima: 10, ordem: 1 }],
      }),
    );
    await page.route(`**/api/salas/${ROOM_ID}/problemas/${PROBLEM_ID}/notas`, (route) =>
      json(route, problemGrades(anaGrade)),
    );

    await page.goto(`${SESSION_PATH}/avaliar`);

    await expect(page.getByText('Pendente')).toBeVisible();
    anaGrade = 8.8;
    emitPokerEvent(pokerSocket(), 'poker.decidida', {
      rodadaId: ROUND_ID,
      notaFinal: 8.75,
      ajustada: false,
    });

    await expect(page.getByText('Planning poker · 8,8')).toBeVisible();
    await expect(page.getByText('Pendente')).toHaveCount(0);
  });

  test('student can no longer vote once the round is decided', async ({ page }) => {
    await signIn(page, bruno);
    const pokerSocket = await mockPokerSocket(page);
    let decided = false;
    await page.route(`**/api/sessoes/${SESSION_ID}/poker`, (route) =>
      json(
        route,
        decided
          ? pokerState({ concluidas: [{ alunoId: 'aluno-1', nome: 'Ana Souza', iniciais: 'AS' }] })
          : pokerState({ rodadaAtual: votingRound }),
      ),
    );

    await page.goto(`${SESSION_PATH}/planning-poker`);

    await expect(page.getByRole('button', { name: 'Votar' })).toBeVisible();
    decided = true;
    emitPokerEvent(pokerSocket(), 'poker.decidida', { rodadaId: ROUND_ID });

    await expect(page.getByText('Aguarde o tutor abrir a próxima rodada')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Votar' })).toHaveCount(0);
  });
});
