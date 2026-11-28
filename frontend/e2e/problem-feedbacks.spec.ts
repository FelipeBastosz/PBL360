import { expect, test, type Page } from '@playwright/test';
import { mockAuthenticatedShell } from './helpers/terms';

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

  await mockAuthenticatedShell(page);

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

    await expect(page.getByTestId('feedback-nota')).toHaveText('Nota 9,5');
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
    await mockAuthenticatedShell(page);

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

    await expect(page.getByTestId('feedback-nota-final')).toHaveText('Nota final 8,8');
    await expect(page.getByTestId('feedback-nota')).toHaveText('Nota 9,3');
  });

  test('shows released general feedback in read-only mode to student and hides edit controls everywhere', async ({
    page,
  }) => {
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

    await mockAuthenticatedShell(page);

    await page.route('**/api/salas/minhas', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            salaId: 'sala-1',
            nome: 'Turma de Medicina - 2026.1',
            semestre: '2026.1',
            totalAlunos: 20,
          },
        ]),
      });
    });

    await page.route('**/api/salas/sala-1/problemas', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'prob-1', salaId: 'sala-1', titulo: 'Problema 1 - Dor Torácica', ordem: 1 },
        ]),
      });
    });

    await page.route('**/api/salas/sala-1/sessoes', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.route('**/api/salas/sala-1/problemas/prob-1/meus-feedbacks', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          notaFinal: null,
          individual: null,
          geral: {
            id: 'fb-geral-1',
            autor: { id: 'prof-1', nome: 'Prof. Silva' },
            texto: 'Excelente colaboração da turma no fechamento do problema.',
            criadoEm: '2026-04-12T10:00:00Z',
            editadoEm: null,
            novo: true,
            nota: null,
          },
          sessoes: [],
        }),
      });
    });

    await page.goto('/turmas/sala-1/problemas/prob-1');
    await expect(page.getByText('Problema 1 - Dor Torácica')).toBeVisible();
    await expect(page.getByRole('button', { name: /Feedback Geral/i })).toHaveCount(0);
    await expect(page.getByLabel(/Comentário Geral/i)).toHaveCount(0);

    await page.goto('/turmas/sala-1/problemas/prob-1/feedbacks');
    await expect(page.getByRole('heading', { name: 'Geral da Turma' })).toBeVisible();
    await expect(
      page.getByText('Excelente colaboração da turma no fechamento do problema.'),
    ).toBeVisible();
    await expect(page.getByRole('textbox')).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Salvar|Editar/i })).toHaveCount(0);
  });

  test('hides general feedback section when unreleased for the student', async ({ page }) => {
    await openProblemFeedbacks(page, null);

    await expect(page.getByText('Seu feedback individual está disponível.')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Geral da Turma' })).toHaveCount(0);
    await expect(page.getByRole('textbox')).toHaveCount(0);
  });

  test('shows session score with discreet empty-text notice when tutor submits grade without textual feedback', async ({
    page,
  }) => {
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
    await mockAuthenticatedShell(page);

    await page.route('**/api/sessoes/session-1/meu-feedback', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: null,
          autor: { id: 'prof-1', nome: 'Prof. Silva' },
          texto: null,
          criadoEm: '2026-04-10T10:00:00Z',
          editadoEm: null,
          novo: false,
          nota: 8.5,
        }),
      });
    });

    await page.route('**/api/sessoes/session-1/avaliacao-geral', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    await page.route('**/api/salas/sala-1/problemas/prob-1/meus-feedbacks', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          notaFinal: 8.5,
          feedbacks: [],
          individual: null,
          geral: null,
          sessoes: [
            {
              sessaoId: 'session-1',
              rotulo: 'Sessão 1',
              data: '10-04-2026',
              feedback: {
                id: null,
                autor: { id: 'prof-1', nome: 'Prof. Silva' },
                texto: null,
                criadoEm: '2026-04-10T10:00:00Z',
                editadoEm: null,
                novo: false,
                nota: 8.5,
              },
            },
            {
              sessaoId: 'session-2',
              rotulo: 'Sessão 2',
              data: '17-04-2026',
              feedback: null,
            },
          ],
        }),
      });
    });

    // 1. Session Feedback page shows grade + discreet empty-text notice
    await page.goto('/turmas/sala-1/problemas/prob-1/sessoes/session-1/feedback');
    await expect(page.getByRole('heading', { name: 'INDIVIDUAL' })).toBeVisible();
    await expect(page.getByTestId('feedback-nota')).toHaveText('Nota 8,5');
    await expect(
      page.getByText('Nenhum feedback textual registrado para esta sessão.'),
    ).toBeVisible();

    // 2. Problem Feedbacks page shows grade + notice for evaluated session and empty state for unevaluated session
    await page.goto('/turmas/sala-1/problemas/prob-1/feedbacks');
    await expect(page.getByTestId('feedback-nota-final')).toHaveText('Nota final 8,5');
    await expect(page.getByTestId('feedback-nota')).toHaveText('Nota 8,5');
    await expect(page.getByText('Sessão 1')).toBeVisible();
    await expect(
      page.getByText('Nenhum feedback textual registrado para esta sessão.'),
    ).toBeVisible();
    await expect(page.getByText('Sessão 2')).toBeVisible();
    await expect(page.getByText('Feedback ainda não disponível para esta sessão.')).toBeVisible();
  });
});
