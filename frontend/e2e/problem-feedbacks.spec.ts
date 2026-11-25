import { expect, test, type Page } from '@playwright/test';

async function openProblemFeedbacks(page: Page, payload: Record<string, unknown>) {
  await page.addInitScript(() => {
    localStorage.setItem(
      'pbl360.session',
      JSON.stringify({
        token: 'mock-auth-token',
        expiraEm: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        usuario: {
          id: 'student-1',
          nome: 'Aluno Teste',
          email: 'aluno@discente.edu.br',
          tipo: 'ALUNO',
          ativo: true,
        },
      }),
    );
  });

  await page.route('**/api/usuarios/meu-aceite-termo', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ versaoVigente: '1.0', aceito: true, pendente: false }),
    });
  });

  await page.route('**/api/termos-compromisso/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ versao: '1.0', aceitou: true }),
    });
  });

  await page.route('**/api/salas/sala-1/problemas/prob-1/meus-feedbacks', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(payload),
    });
  });

  await page.goto('/turmas/sala-1/problemas/prob-1/feedbacks');
}

test.describe('Problem feedback scores', () => {
  test('shows final, collective general, and session feedback without individual problem feedback', async ({
    page,
  }) => {
    await openProblemFeedbacks(page, {
      notaFinal: 8.75,
      feedbacks: [],
      geral: {
        id: 'fb-geral',
        autor: { id: 'prof-1', nome: 'Prof. Silva' },
        texto: 'Feedback coletivo da turma.',
        criadoEm: '2026-04-10T10:00:00Z',
        editadoEm: null,
        novo: false,
        nota: null,
      },
      sessoes: [
        {
          sessaoId: 'session-1',
          rotulo: 'Sessão 1',
          data: '2026-04-10',
          feedback: {
            id: 'fb-session',
            autor: { id: 'prof-1', nome: 'Prof. Silva' },
            texto: 'Boa participação na sessão.',
            criadoEm: '2026-04-10T10:00:00Z',
            editadoEm: null,
            novo: false,
            nota: 9.25,
          },
        },
      ],
    });

    await expect(page.getByTestId('feedback-nota-final')).toHaveText('Nota final 8,8');
    await expect(page.getByText('Feedback coletivo da turma.')).toBeVisible();
    await expect(page.getByTestId('feedback-nota')).toHaveText('Nota 9,3');
    await expect(page.getByRole('heading', { name: 'Feedback Individual' })).toHaveCount(0);
  });

  test('keeps session feedback visible when the score is unreleased', async ({ page }) => {
    await openProblemFeedbacks(page, {
      notaFinal: null,
      feedbacks: [],
      geral: null,
      sessoes: [
        {
          sessaoId: 'session-1',
          rotulo: 'Sessão 1',
          data: '2026-04-10',
          feedback: {
            id: 'fb-session',
            autor: { id: 'prof-1', nome: 'Prof. Silva' },
            texto: 'Boa participação na sessão.',
            criadoEm: '2026-04-10T10:00:00Z',
            editadoEm: null,
            novo: false,
            nota: null,
          },
        },
      ],
    });

    await expect(page.getByText('Boa participação na sessão.')).toBeVisible();
    await expect(page.getByTestId('feedback-nota')).toHaveCount(0);
  });

  test('ignores legacy individual feedback payloads without rendering individual cards', async ({
    page,
  }) => {
    await openProblemFeedbacks(page, {
      notaFinal: null,
      feedbacks: [],
      individual: {
        id: 'fb-ind',
        autor: { id: 'prof-1', nome: 'Prof. Silva' },
        texto: 'Seu feedback individual legado.',
        criadoEm: '2026-04-10T10:00:00Z',
        editadoEm: null,
        novo: false,
        nota: 9.5,
      },
      geral: null,
      sessoes: [],
    });

    await expect(
      page.getByText('Nenhum feedback disponível para este problema ainda.'),
    ).toBeVisible();
    await expect(page.getByText('Seu feedback individual legado.')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Feedback Individual' })).toHaveCount(0);
  });
});
