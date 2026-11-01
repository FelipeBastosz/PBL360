import { expect, test, type Page } from '@playwright/test';

async function openProblemFeedbacks(page: Page, nota: number | null) {
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

  await page.route('**/api/salas/sala-1/problemas/prob-1/meus-feedbacks', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        notaFinal: null,
        feedbacks: [],
        individual: {
          id: 'fb-ind',
          autor: { id: 'prof-1', nome: 'Prof. Silva' },
          texto: 'Seu feedback individual está disponível.',
          criadoEm: '2026-04-10T10:00:00Z',
          editadoEm: null,
          novo: false,
          nota,
        },
        geral: null,
        sessoes: [],
      }),
    });
  });

  await page.goto('/turmas/sala-1/problemas/prob-1/feedbacks');
}

test.describe('Problem feedback scores', () => {
  test('shows the individual score with one decimal place', async ({ page }) => {
    await openProblemFeedbacks(page, 9.54);

    await expect(page.getByTestId('feedback-nota')).toHaveText('Nota 9.5');
    await expect(page.getByText('Seu feedback individual está disponível.')).toBeVisible();
  });

  test('keeps feedback visible when the score is unreleased', async ({ page }) => {
    await openProblemFeedbacks(page, null);

    await expect(page.getByText('Seu feedback individual está disponível.')).toBeVisible();
    await expect(page.getByTestId('feedback-nota')).toHaveCount(0);
  });

  test('shows final and session scores when no individual feedback exists', async ({ page }) => {
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
    await page.route('**/api/salas/sala-1/problemas/prob-1/meus-feedbacks', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          notaFinal: 8.75,
          feedbacks: [],
          individual: null,
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
                nota: 9.25,
              },
            },
          ],
        }),
      });
    });

    await page.goto('/turmas/sala-1/problemas/prob-1/feedbacks');

    await expect(page.getByTestId('feedback-nota-final')).toHaveText('Nota final 8.8');
    await expect(page.getByTestId('feedback-nota')).toHaveText('Nota 9.3');
  });
});
