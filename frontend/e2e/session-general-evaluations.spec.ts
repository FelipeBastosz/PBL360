import { test, expect, type Page } from '@playwright/test';

const mockTeacher = {
  id: 'user-tutor-1',
  nome: 'Carlos Silva',
  email: 'carlos@faculdade.edu.br',
  tipo: 'PROFESSOR',
  ativo: true,
};

const mockCoTutor = {
  id: 'user-cotutor-2',
  nome: 'Fernanda Lima',
  email: 'fernanda@faculdade.edu.br',
  tipo: 'PROFESSOR',
  ativo: true,
};

const mockStudent = {
  id: 'user-student-1',
  nome: 'Mariana Souza',
  email: 'mariana@faculdade.edu.br',
  tipo: 'ALUNO',
  ativo: true,
};

const mockProblem = {
  id: 'prob-1',
  salaId: 'sala-1',
  titulo: 'Problema 1 - Introdução ao PBL',
  descricao: 'Estudo de caso clínico/prático.',
  ordem: 1,
};

const mockSession = {
  id: 'sess-1',
  problemaId: 'prob-1',
  titulo: 'Sessão 1 - Abertura',
  descricao: 'Definição das hipóteses.',
  ordem: 1,
  data: '2026-02-01T14:00:00.000Z',
  status: 'CONCLUIDA',
};

const mockGeneralEvaluation = {
  id: 'eval-1',
  texto: 'A turma demonstrou excelente argumentação e planejamento na sessão.',
  autor: { id: mockTeacher.id, nome: mockTeacher.nome },
  criadoEm: '2026-02-01T15:00:00.000Z',
  editadoEm: '2026-02-01T15:30:00.000Z',
};

async function setupUserSession(page: Page, user: unknown) {
  await page.addInitScript((userData) => {
    localStorage.setItem(
      'pbl360.session',
      JSON.stringify({
        token: 'mock-auth-token',
        expiraEm: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        usuario: userData,
      }),
    );
  }, user);
}

async function setupCommonRoutes(page: Page) {
  await page.route('**/api/termos-compromisso/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ versao: '1.0', aceitou: true }),
    });
  });

  await page.route('**/api/salas/sala-1/problemas/prob-1', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockProblem),
    });
  });

  await page.route('**/api/salas/sala-1/problemas/prob-1/sessoes/sess-1', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockSession),
    });
  });

  await page.route('**/api/sessoes/sess-1', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ...mockSession,
        problemaId: 'prob-1',
        salaId: 'sala-1',
        problemaTitulo: 'Problema 1 - Introdução ao PBL',
      }),
    });
  });

  await page.route('**/api/sessoes/sess-1/anexos', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });

  await page.route(/\/api\/sessoes\/[^/]+\/poker\/disponibilidade/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ disponivel: false, motivo: null, pokerAbertoId: null }),
    });
  });

  await page.route(/\/api\/sessoes\/[^/]+\/poker$/, async (route) => {
    await route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Nenhum poker aberto' }),
    });
  });
}

test.describe('Session General Evaluations Flow', () => {
  test('teacher registers and edits general evaluation on session hub', async ({ page }) => {
    let evaluationsDb: Array<typeof mockGeneralEvaluation> = [];

    await setupUserSession(page, mockTeacher);
    await setupCommonRoutes(page);

    await page.route('**/api/sessoes/sess-1/liberacoes', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          autoavaliacao: { liberada: false, prazo: null, enviadas: 0, esperadas: 10 },
          pares: { liberada: false, prazo: null, enviadas: 0, esperadas: 10 },
          atualizadoEm: '2026-02-01T14:00:00.000Z',
          atualizadoPor: 'user-tutor-1',
        }),
      });
    });

    await page.route('**/api/sessoes/sess-1/avaliacao-geral', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(evaluationsDb),
        });
      } else if (route.request().method() === 'PUT') {
        const body = JSON.parse(route.request().postData() || '{}');
        const now = new Date().toISOString();
        const existing = evaluationsDb.find((e) => e.autor.id === mockTeacher.id);
        const record = {
          id: existing?.id || 'eval-1',
          texto: body.texto,
          autor: { id: mockTeacher.id, nome: mockTeacher.nome },
          criadoEm: existing?.criadoEm || now,
          editadoEm: existing ? now : null,
        };
        if (existing) {
          evaluationsDb = evaluationsDb.map((e) => (e.id === existing.id ? record : e));
        } else {
          evaluationsDb.push(record);
        }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(record),
        });
      }
    });

    await page.goto('/turmas/sala-1/problemas/prob-1/sessoes/sess-1');

    const generalCard = page.locator('div.lg\\:col-span-2');
    await expect(generalCard).toBeVisible();
    await expect(
      generalCard.getByRole('heading', { name: 'Feedback Geral da Sessão' }),
    ).toBeVisible();
    await expect(
      page.getByText('Nenhum feedback geral registrado para a turma ainda.'),
    ).toBeVisible();

    await page.getByRole('button', { name: 'Registrar feedback' }).click();

    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(
      page.getByText('Consolidado de feedback para todos os alunos na sessão'),
    ).toBeVisible();

    await page
      .getByLabel(/Comentário Geral/i)
      .fill('A turma demonstrou excelente argumentação na sessão de hoje.');
    await page.getByRole('button', { name: 'Salvar' }).click();

    await expect(
      page.getByText('A turma demonstrou excelente argumentação na sessão de hoje.'),
    ).toBeVisible();
    await expect(page.getByText('Carlos Silva')).toBeVisible();

    await page.getByRole('button', { name: 'Editar feedback geral' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText(/Última edição:/i)).toBeVisible();

    await page
      .getByLabel(/Comentário Geral/i)
      .fill('A turma demonstrou excelente argumentação e planejamento na sessão.');
    await page.getByRole('button', { name: 'Salvar' }).click();

    await expect(
      page.getByText('A turma demonstrou excelente argumentação e planejamento na sessão.'),
    ).toBeVisible();
  });

  test('co-tutor views existing evaluation and can register own feedback without editing other tutor feedback', async ({
    page,
  }) => {
    const evaluationsDb: Array<typeof mockGeneralEvaluation> = [mockGeneralEvaluation];

    await setupUserSession(page, mockCoTutor);
    await setupCommonRoutes(page);

    await page.route('**/api/sessoes/sess-1/liberacoes', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          autoavaliacao: { liberada: false, prazo: null, enviadas: 0, esperadas: 10 },
          pares: { liberada: false, prazo: null, enviadas: 0, esperadas: 10 },
          atualizadoEm: '2026-02-01T14:00:00.000Z',
          atualizadoPor: 'user-tutor-1',
        }),
      });
    });

    await page.route('**/api/sessoes/sess-1/avaliacao-geral', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(evaluationsDb),
        });
      } else if (route.request().method() === 'PUT') {
        const body = JSON.parse(route.request().postData() || '{}');
        const now = new Date().toISOString();
        const record = {
          id: 'eval-cotutor-2',
          texto: body.texto,
          autor: { id: mockCoTutor.id, nome: mockCoTutor.nome },
          criadoEm: now,
          editadoEm: null,
        };
        evaluationsDb.push(record);
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(record),
        });
      }
    });

    await page.goto('/turmas/sala-1/problemas/prob-1/sessoes/sess-1');

    const generalCard = page.locator('div.lg\\:col-span-2');
    await expect(generalCard).toBeVisible();
    await expect(
      generalCard.getByRole('heading', { name: 'Feedback Geral da Sessão' }),
    ).toBeVisible();
    await expect(page.getByText('Carlos Silva')).toBeVisible();
    await expect(
      page.getByText('A turma demonstrou excelente argumentação e planejamento na sessão.'),
    ).toBeVisible();

    await expect(generalCard.getByRole('button', { name: 'Editar feedback geral' })).toHaveCount(0);

    const addBtn = generalCard.getByRole('button', { name: 'Registrar meu feedback' });
    await expect(addBtn).toBeVisible();
    await addBtn.click();

    await expect(page.getByRole('dialog')).toBeVisible();
    await page
      .getByLabel(/Comentário Geral/i)
      .fill('Observações da co-tutoria: excelente engajamento.');
    await page.getByRole('button', { name: 'Salvar' }).click();

    await expect(page.getByText('Observações da co-tutoria: excelente engajamento.')).toBeVisible();
    await expect(page.getByText('Fernanda Lima')).toBeVisible();
    await expect(generalCard.getByRole('button', { name: 'Editar feedback geral' })).toHaveCount(1);
    await expect(generalCard.getByRole('button', { name: 'Registrar meu feedback' })).toHaveCount(
      0,
    );
  });

  test('student accesses general evaluation exclusively via feedback page under DA TURMA', async ({
    page,
  }) => {
    await setupUserSession(page, mockStudent);
    await setupCommonRoutes(page);

    await page.route('**/api/sessoes/sess-1/minhas-avaliacoes', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          autoavaliacao: { liberada: false, prazo: null, status: 'PENDENTE' },
          pares: { liberada: false, prazo: null, total: 0, avaliados: 0 },
          feedback: { disponivel: true, avaliacaoTutorEnviada: true },
        }),
      });
    });

    await page.route('**/api/sessoes/sess-1/pares', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ chamadaRealizada: true, pares: [] }),
      });
    });

    await page.route('**/api/sessoes/sess-1/avaliacao-geral', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([mockGeneralEvaluation]),
      });
    });

    await page.route('**/api/sessoes/sess-1/meu-feedback', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'fb-student-1',
          autor: { id: mockTeacher.id, nome: mockTeacher.nome },
          texto: 'Excelente participação individual no grupo.',
          criadoEm: '2026-02-01T16:00:00.000Z',
          editadoEm: null,
          novo: false,
          nota: 9.0,
        }),
      });
    });

    await page.goto('/turmas/sala-1/problemas/prob-1/sessoes/sess-1');

    await expect(page.getByRole('heading', { name: 'Feedback Geral da Sessão' })).toHaveCount(0);

    const feedbackLink = page.getByRole('link', { name: /Notas e Feedbacks/i });
    await expect(feedbackLink).toBeVisible();
    await feedbackLink.click();

    await expect(page).toHaveURL(/\/feedback$/);

    const turmaSection = page.getByRole('region', { name: 'Feedback da Turma' });
    await expect(turmaSection.getByRole('heading', { name: 'DA TURMA' })).toBeVisible();
    await expect(
      turmaSection.getByText('A turma demonstrou excelente argumentação e planejamento na sessão.'),
    ).toBeVisible();
    await expect(turmaSection.getByText('Carlos Silva')).toBeVisible();
    await expect(turmaSection.getByText(/editado em 01\/02\/2026/i)).toBeVisible();

    const individualSection = page.getByRole('region', { name: 'Feedback Individual' });
    await expect(individualSection.getByRole('heading', { name: 'INDIVIDUAL' })).toBeVisible();
    await expect(
      individualSection.getByText('Excelente participação individual no grupo.'),
    ).toBeVisible();
    await expect(individualSection.getByText('Carlos Silva')).toBeVisible();
    await expect(individualSection.getByText('Nota 9,0')).toBeVisible();

    await expect(page.getByRole('button', { name: /Editar/i })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Registrar/i })).toHaveCount(0);
  });

  test('student does not have access to feedback when evaluations are unavailable', async ({
    page,
  }) => {
    await setupUserSession(page, mockStudent);
    await setupCommonRoutes(page);

    await page.route('**/api/sessoes/sess-1/minhas-avaliacoes', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          autoavaliacao: { liberada: false, prazo: null, status: 'PENDENTE' },
          pares: { liberada: false, prazo: null, total: 0, avaliados: 0 },
          feedback: { disponivel: false, avaliacaoTutorEnviada: false },
        }),
      });
    });

    await page.route('**/api/sessoes/sess-1/pares', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ chamadaRealizada: true, pares: [] }),
      });
    });

    await page.goto('/turmas/sala-1/problemas/prob-1/sessoes/sess-1');

    await expect(page.getByRole('heading', { name: 'Feedback Geral da Sessão' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: /Notas e Feedbacks/i })).toHaveCount(0);
    await expect(page.getByText('Notas e Feedbacks')).toBeVisible();
    await expect(page.getByText('Indisponível')).toBeVisible();
  });
});
