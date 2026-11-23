import { test, expect, type Page } from '@playwright/test';
import { mockAcceptedTerms } from './helpers/terms';

const mockCriteria = [
  { id: 'crit-1', nome: 'Domínio do tema', peso: 50, ordem: 1 },
  { id: 'crit-2', nome: 'Uso de fontes', peso: 50, ordem: 2 },
];

const mockTemplates = [
  {
    id: '4f700000-0000-4000-8000-000000000001',
    titulo: 'Boa participação e engajamento',
    texto:
      'Demonstrou participação ativa durante a sessão tutorial, contribuindo com perguntas e reflexões pertinentes para o avanço da discussão do grupo.',
  },
  {
    id: '4f700000-0000-4000-8000-000000000002',
    titulo: 'Feedback curto',
    texto: 'Bom desempenho.',
  },
];

async function setupEvaluationMocks(page: Page) {
  let evalPutCount = 0;
  let feedbackPutCount = 0;
  const capturedFeedbackPayloads: Array<Record<string, unknown>> = [];
  const capturedEvalPayloads: Array<Record<string, unknown>> = [];

  await page.addInitScript(() => {
    localStorage.setItem(
      'pbl360.session',
      JSON.stringify({
        token: 'mock-tutor-token',
        expiraEm: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        usuario: {
          id: 'user-tutor-1',
          nome: 'Prof. Carlos Santos',
          email: 'carlos.tutor@uefs.br',
          tipo: 'PROFESSOR',
          ativo: true,
        },
      }),
    );
  });

  await mockAcceptedTerms(page);
  await page.route('**/api/sessoes/sess-1/**/disponibilidade', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ disponivel: true, motivo: null, presentes: 2, pokerAbertoId: null }),
    });
  });

  await page.route('**/api/salas', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });

  await page.route('**/api/sessoes/sess-1/avaliacoes/aluno-1', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          criterios: mockCriteria,
          itens: [
            { criterioId: 'crit-1', nota: 6.0 },
            { criterioId: 'crit-2', nota: 7.0 },
          ],
          status: 'RASCUNHO',
          papel: null,
          formula: { criteriaWeight: 100, roleWeight: 0 },
        }),
      });
      return;
    }

    if (route.request().method() === 'PUT') {
      evalPutCount++;
      const payload = route.request().postDataJSON() as Record<string, unknown>;
      capturedEvalPayloads.push(payload);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          criterios: mockCriteria,
          itens: payload.itens,
          status: payload.enviar ? 'ENVIADA' : 'RASCUNHO',
          papel: null,
        }),
      });
    }
  });

  await page.route('**/api/sessoes/sess-1/alunos/aluno-1/feedback', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: 'null' });
      return;
    }

    if (route.request().method() === 'PUT') {
      feedbackPutCount++;
      const payload = route.request().postDataJSON() as Record<string, unknown>;
      capturedFeedbackPayloads.push(payload);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'fb-sess-1',
          alunoId: 'aluno-1',
          sessaoId: 'sess-1',
          texto: payload.texto,
        }),
      });
    }
  });

  await page.route('**/api/marcacoes', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });

  await page.route('**/api/sessoes/sess-1/alunos/aluno-1/observacoes', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ contagem: {}, observacoes: [] }),
    });
  });

  return {
    getEvalPutCount: () => evalPutCount,
    getFeedbackPutCount: () => feedbackPutCount,
    capturedFeedbackPayloads,
    capturedEvalPayloads,
  };
}

const EVALUATION_URL = '/turmas/sala-1/problemas/prob-1/sessoes/sess-1/avaliar/aluno-1';

test.describe('Session Student Evaluation - Feedback Templates (#509)', () => {
  test('selects template on empty field without PUT side effects, allows editing, and saves draft without template IDs', async ({
    page,
  }) => {
    const tracker = await setupEvaluationMocks(page);

    await page.route('**/api/modelos-feedback', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockTemplates),
      });
    });

    await page.goto(EVALUATION_URL);

    const feedbackField = page.getByPlaceholder(/Escreva aqui um feedback para o\(a\) aluno\(a\)/i);
    await expect(feedbackField).toHaveValue('');

    await page.getByRole('button', { name: /Usar modelo/i }).click();

    const templateDialog = page.getByRole('dialog', { name: 'Modelos de feedback' });
    await expect(templateDialog).toBeVisible();
    await expect(templateDialog.getByText(mockTemplates[0].titulo)).toBeVisible();
    await expect(templateDialog.getByText(mockTemplates[0].texto)).toBeVisible();

    await templateDialog.getByRole('button', { name: /Boa participação e engajamento/i }).click();
    await expect(templateDialog).not.toBeVisible();

    expect(tracker.getEvalPutCount()).toBe(0);
    expect(tracker.getFeedbackPutCount()).toBe(0);
    await expect(feedbackField).toHaveValue(mockTemplates[0].texto);

    await feedbackField.focus();
    await feedbackField.press('End');
    await page.keyboard.type(' Manteve ótimo foco no problema.');

    const expectedFinalFeedback = `${mockTemplates[0].texto} Manteve ótimo foco no problema.`;
    await expect(feedbackField).toHaveValue(expectedFinalFeedback);

    const evalSavePromise = page.waitForResponse(
      (res) =>
        res.url().includes('/api/sessoes/sess-1/avaliacoes/aluno-1') &&
        res.request().method() === 'PUT',
    );
    const feedbackSavePromise = page.waitForResponse(
      (res) =>
        res.url().includes('/api/sessoes/sess-1/alunos/aluno-1/feedback') &&
        res.request().method() === 'PUT',
    );

    await page.getByRole('button', { name: 'Salvar rascunho' }).click();
    await Promise.all([evalSavePromise, feedbackSavePromise]);

    expect(tracker.getEvalPutCount()).toBe(1);
    expect(tracker.getFeedbackPutCount()).toBe(1);
    expect(tracker.capturedEvalPayloads[0]?.enviar).toBe(false);
    expect(tracker.capturedFeedbackPayloads[0]).toEqual({ texto: expectedFinalFeedback });
    expect(JSON.stringify(tracker.capturedFeedbackPayloads[0])).not.toContain(mockTemplates[0].id);
  });

  test('preserves existing text on cancel/close and concatenates selected template with spacing', async ({
    page,
  }) => {
    const tracker = await setupEvaluationMocks(page);

    await page.route('**/api/modelos-feedback', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockTemplates),
      });
    });

    await page.goto(EVALUATION_URL);

    const feedbackField = page.getByPlaceholder(/Escreva aqui um feedback para o\(a\) aluno\(a\)/i);
    await feedbackField.fill('Observação inicial do tutor.');

    const useTemplateBtn = page.getByRole('button', { name: /Usar modelo/i });
    const templateDialog = page.getByRole('dialog', { name: 'Modelos de feedback' });

    await useTemplateBtn.click();
    await expect(templateDialog).toBeVisible();
    await templateDialog.getByRole('button', { name: 'Cancelar' }).click();
    await expect(templateDialog).not.toBeVisible();
    await expect(feedbackField).toHaveValue('Observação inicial do tutor.');

    await useTemplateBtn.click();
    await expect(templateDialog).toBeVisible();
    await templateDialog.getByRole('button', { name: 'Fechar' }).click();
    await expect(templateDialog).not.toBeVisible();
    await expect(feedbackField).toHaveValue('Observação inicial do tutor.');

    await useTemplateBtn.click();
    await templateDialog.getByRole('button', { name: /Boa participação e engajamento/i }).click();

    await expect(feedbackField).toHaveValue(
      `Observação inicial do tutor.\n\n${mockTemplates[0].texto}`,
    );
    expect(tracker.getFeedbackPutCount()).toBe(0);
  });

  test('explains and prevents exceeding 2000 characters in template selector and blocks submission when over limit', async ({
    page,
  }) => {
    const tracker = await setupEvaluationMocks(page);

    await page.route('**/api/modelos-feedback', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockTemplates),
      });
    });

    await page.goto(EVALUATION_URL);

    const feedbackField = page.getByPlaceholder(/Escreva aqui um feedback para o\(a\) aluno\(a\)/i);
    await feedbackField.fill('a'.repeat(1950));

    await page.getByRole('button', { name: /Usar modelo/i }).click();
    const templateDialog = page.getByRole('dialog', { name: 'Modelos de feedback' });
    await expect(templateDialog).toBeVisible();

    const longTemplateBtn = templateDialog.getByRole('button', {
      name: /Boa participação e engajamento/i,
    });
    const shortTemplateBtn = templateDialog.getByRole('button', { name: /Feedback curto/i });

    await expect(longTemplateBtn).toBeDisabled();
    await expect(templateDialog.getByText('Excede limite (2000 carac.)')).toBeVisible();
    await expect(shortTemplateBtn).toBeEnabled();

    await page.keyboard.press('Escape');
    await expect(templateDialog).not.toBeVisible();

    await feedbackField.fill('a'.repeat(2005));

    const limitAlert = page.getByRole('alert');
    await expect(limitAlert).toContainText(
      'O feedback ultrapassa o limite de 2000 caracteres (2005/2000)',
    );
    await expect(page.getByRole('button', { name: 'Enviar avaliação e feedback' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Salvar rascunho' })).toBeDisabled();

    expect(tracker.getEvalPutCount()).toBe(0);
    expect(tracker.getFeedbackPutCount()).toBe(0);
  });

  test('recovers from catalog API error and keeps manual feedback writing and submission working', async ({
    page,
  }) => {
    const tracker = await setupEvaluationMocks(page);
    let catalogAttempts = 0;

    await page.route('**/api/modelos-feedback', async (route) => {
      catalogAttempts++;
      if (catalogAttempts === 1) {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Erro interno' }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockTemplates),
      });
    });

    await page.goto(EVALUATION_URL);

    await page.getByRole('button', { name: /Usar modelo/i }).click();
    const templateDialog = page.getByRole('dialog', { name: 'Modelos de feedback' });
    await expect(
      templateDialog.getByText('Não foi possível carregar os modelos de feedback.'),
    ).toBeVisible();

    const retryBtn = templateDialog.getByRole('button', { name: 'Tentar novamente' });
    await expect(retryBtn).toBeVisible();
    await retryBtn.click();

    await expect(templateDialog.getByText('Boa participação e engajamento')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(templateDialog).not.toBeVisible();

    const feedbackField = page.getByPlaceholder(/Escreva aqui um feedback para o\(a\) aluno\(a\)/i);
    await feedbackField.fill('Feedback digitado manualmente após falha inicial do catálogo.');

    const feedbackSavePromise = page.waitForResponse(
      (res) =>
        res.url().includes('/api/sessoes/sess-1/alunos/aluno-1/feedback') &&
        res.request().method() === 'PUT',
    );
    await page.getByRole('button', { name: 'Enviar avaliação e feedback' }).click();
    await feedbackSavePromise;

    expect(tracker.getFeedbackPutCount()).toBe(1);
    expect(tracker.capturedFeedbackPayloads[0]).toEqual({
      texto: 'Feedback digitado manualmente após falha inicial do catálogo.',
    });
  });

  test('supports mobile viewport without horizontal overflow and full keyboard navigation (Tab, Enter, Escape)', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await setupEvaluationMocks(page);

    await page.route('**/api/modelos-feedback', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockTemplates),
      });
    });

    await page.goto(EVALUATION_URL);

    const hasPageOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(hasPageOverflow).toBe(false);

    const useTemplateBtn = page.getByRole('button', { name: /Usar modelo/i });
    await useTemplateBtn.focus();
    await page.keyboard.press('Enter');

    const templateDialog = page.getByRole('dialog', { name: 'Modelos de feedback' });
    await expect(templateDialog).toBeVisible();
    await expect(templateDialog.getByText('Feedback curto')).toBeVisible();

    const hasModalOverflow = await templateDialog.evaluate((el) => el.scrollWidth > el.clientWidth);
    expect(hasModalOverflow).toBe(false);

    // Focus trap keeps Tab inside the dialog
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press('Tab');
      const focusInsideDialog = await templateDialog.evaluate((el) =>
        el.contains(document.activeElement),
      );
      expect(focusInsideDialog).toBe(true);
    }

    await page.keyboard.press('Escape');
    await expect(templateDialog).not.toBeVisible();
    await expect(useTemplateBtn).toBeFocused();

    // Reopen via Enter, navigate to "Feedback curto" via Tab, select with Enter
    await page.keyboard.press('Enter');
    await expect(templateDialog).toBeVisible();

    const shortTemplateBtn = templateDialog.getByRole('button', { name: /Feedback curto/i });
    await shortTemplateBtn.focus();
    await page.keyboard.press('Enter');

    await expect(templateDialog).not.toBeVisible();
    const feedbackField = page.getByPlaceholder(/Escreva aqui um feedback para o\(a\) aluno\(a\)/i);
    await expect(feedbackField).toHaveValue('Bom desempenho.');
  });
});
