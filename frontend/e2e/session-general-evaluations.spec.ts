import { test, expect } from '@playwright/test';

const mockTeacher = {
  id: 'user-tutor-1',
  nome: 'Carlos Silva',
  email: 'carlos@faculdade.edu.br',
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

test.describe('Session General Evaluations Flow', () => {
  test('teacher registers and edits general evaluation on session hub', async ({ page }) => {
    let evaluationsDb: Array<typeof mockGeneralEvaluation> = [];

    await page.addInitScript((user) => {
      localStorage.setItem(
        'pbl360.session',
        JSON.stringify({
          token: 'mock-auth-token',
          expiraEm: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          usuario: user,
        }),
      );
    }, mockTeacher);

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

    await page.route('**/api/sessoes/sess-1/anexos', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.route('**/api/sessoes/**/poker*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ podeAbrir: true }),
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

    await expect(page.getByRole('heading', { name: 'Avaliação Geral da Sessão' })).toBeVisible();
    await expect(
      page.getByText('Nenhuma avaliação geral registrada para a turma ainda.'),
    ).toBeVisible();

    await page
      .getByRole('button', { name: /Registrar/i })
      .first()
      .click();

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

    await page
      .getByRole('button', { name: /Editar/i })
      .first()
      .click();
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

  test('student reads general evaluation on session hub and session feedback page', async ({
    page,
  }) => {
    page.on('pageerror', (err) => console.log('PAGE ERROR T2:', err));
    page.on('response', (res) => {
      if (res.status() >= 400) console.log('HTTP ERROR T2:', res.status(), res.url());
    });
    await page.addInitScript((user) => {
      localStorage.setItem(
        'pbl360.session',
        JSON.stringify({
          token: 'mock-auth-token',
          expiraEm: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          usuario: user,
        }),
      );
    }, mockStudent);

    await page.route('**/api/termos-compromisso/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ versao: '1.0', aceitou: true }),
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

    await page.route('**/api/sessoes/sess-1/anexos', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.route('**/api/sessoes/**/poker*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ podeAbrir: true }),
      });
    });

    await page.route('**/api/sessoes/sess-1/avaliacao-geral', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([mockGeneralEvaluation]),
      });
    });

    await page.route('**/api/feedbacks/minha-sessao/sess-1', async (route) => {
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

    await expect(page.getByRole('heading', { name: 'Avaliação Geral da Sessão' })).toBeVisible();
    await expect(
      page.getByText('A turma demonstrou excelente argumentação e planejamento na sessão.'),
    ).toBeVisible();
    await expect(page.getByText('Carlos Silva')).toBeVisible();

    const generalCard = page
      .locator('div')
      .filter({ hasText: 'Avaliação Geral da Sessão' })
      .first();
    await expect(generalCard.getByRole('button', { name: /Editar/i })).toHaveCount(0);
    await expect(generalCard.getByRole('button', { name: /Registrar/i })).toHaveCount(0);

    await page.goto('/turmas/sala-1/problemas/prob-1/sessoes/sess-1/feedback');

    await expect(
      page.getByText('A turma demonstrou excelente argumentação e planejamento na sessão.'),
    ).toBeVisible();
    await expect(page.getByText('Excelente participação individual no grupo.')).toBeVisible();
    await expect(page.getByText('Nota 9,0')).toBeVisible();
  });
});
