import { test, expect } from '@playwright/test';

function toBase64Url(str: string): string {
  return btoa(str).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

async function createRealTutorToken(): Promise<string> {
  const secret = 'change-me-in-every-environment';
  const header = toBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const payload = toBase64Url(
    JSON.stringify({
      sub: '7408a053-c198-4834-a737-0a325410a556',
      email: 'carlos@uefs.br',
      type: 'TUTOR',
      ver: 0,
      iat: now,
      exp: now + 86400,
      aud: 'pbl360:access',
    }),
  );

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sigBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(`${header}.${payload}`));
  const bytes = new Uint8Array(sigBuffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const signature = toBase64Url(binary);

  return `${header}.${payload}.${signature}`;
}

const mockCriteria = [
  { id: 'crit-1', nome: 'Domínio do tema', peso: 50, ordem: 1 },
  { id: 'crit-2', nome: 'Uso de fontes', peso: 50, ordem: 2 },
];

const mockTags = [
  { id: 'tag-atraso', nome: 'Atraso', tipo: 'DESFAVORAVEL' },
  { id: 'tag-colab', nome: 'Colaboração em Equipe', tipo: 'FAVORAVEL' },
  { id: 'tag-postura', nome: 'Postura Ética', tipo: 'FAVORAVEL' },
];

test.describe('Session Student Evaluation - Full Cycle Journey', () => {
  test('should complete evaluation journey: adjust notes, select behavior tags, use real feedback template and save draft', async ({
    page,
  }) => {
    const authToken = await createRealTutorToken();

    await page.addInitScript((token) => {
      localStorage.setItem(
        'pbl360.session',
        JSON.stringify({
          token,
          expiraEm: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          usuario: {
            id: '7408a053-c198-4834-a737-0a325410a556',
            nome: 'Prof. Carlos Santos',
            email: 'carlos.tutor@uefs.br',
            tipo: 'PROFESSOR',
            ativo: true,
          },
        }),
      );
    }, authToken);

    // Track captured requests
    const capturedEvaluationPayloads: Array<{
      itens: Array<{ criterioId: string; nota: number }>;
      enviar: boolean;
      notaCargo?: number | null;
    }> = [];
    const capturedFeedbackPayloads: Array<{ texto: string }> = [];
    const capturedObservationTagIds: string[] = [];

    // In-memory state for observations to simulate real backend persistence during the test
    const registeredObservations: Array<{
      id: string;
      marcacoes: Array<{ id: string; nome: string }>;
    }> = [];
    const tagCounts: Record<string, number> = {};

    // Planning poker status
    await page.route('**/api/sessoes/sess-1/**/disponibilidade', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ pokerAbertoId: null }),
      });
    });

    // Rooms list endpoint (for previous navigation history)
    await page.route('**/api/salas', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    // Initial student evaluation data
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
      } else if (route.request().method() === 'PUT') {
        const payload = route.request().postDataJSON();
        capturedEvaluationPayloads.push(payload);
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            criterios: mockCriteria,
            itens: payload.itens,
            status: 'RASCUNHO',
            papel: null,
          }),
        });
      }
    });

    // Feedback endpoint
    await page.route('**/api/sessoes/sess-1/alunos/aluno-1/feedback', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(null),
        });
      } else if (route.request().method() === 'PUT') {
        const payload = route.request().postDataJSON();
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

    // Tags catalog endpoint
    await page.route('**/api/marcacoes', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockTags),
      });
    });

    // Student observations endpoints
    await page.route('**/api/sessoes/sess-1/alunos/aluno-1/observacoes', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            contagem: tagCounts,
            observacoes: registeredObservations,
          }),
        });
      } else if (route.request().method() === 'POST') {
        const body = route.request().postDataJSON() as { marcacaoIds: string[] };
        capturedObservationTagIds.push(...body.marcacaoIds);
        for (const tagId of body.marcacaoIds) {
          tagCounts[tagId] = (tagCounts[tagId] ?? 0) + 1;
          const found = mockTags.find((t) => t.id === tagId);
          registeredObservations.push({
            id: `obs-${Date.now()}-${tagId}`,
            marcacoes: found ? [found] : [],
          });
        }
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(registeredObservations[registeredObservations.length - 1]),
        });
      }
    });

    // NOTE: GET /api/modelos-feedback is deliberately NOT mocked!
    // It consumes the real NestJS backend and PostgreSQL database.

    // 1. Navigate directly to student evaluation page
    await page.goto('/turmas/sala-1/problemas/prob-1/sessoes/sess-1/avaliar/aluno-1');

    // Verify initial final grade: (6*50 + 7*50)/100 = 6.5
    await expect(page.getByText('Nota final da sessão')).toBeVisible();
    await expect(page.getByText('6,5')).toBeVisible();

    // 2. Adjust Grades: increment "Domínio do tema" (+1) and "Uso de fontes" (+1)
    const incTemaBtn = page.getByRole('button', { name: 'Aumentar nota de Domínio do tema' });
    await expect(incTemaBtn).toBeVisible();
    await incTemaBtn.click();

    const incFontesBtn = page.getByRole('button', { name: 'Aumentar nota de Uso de fontes' });
    await expect(incFontesBtn).toBeVisible();
    await incFontesBtn.click();

    // Validate updated final grade: (7*50 + 8*50)/100 = 7.5
    await expect(page.getByText('7,5')).toBeVisible();

    // 3. Behavior Tags: Click "Ver outras marcações"
    const moreTagsBtn = page.getByRole('button', { name: 'Ver outras marcações' });
    await expect(moreTagsBtn).toBeVisible();
    await moreTagsBtn.click();

    await expect(page).toHaveURL(/\/marcacoes$/);

    // Select at least two tags ("Atraso" and "Colaboração em Equipe")
    const atrasoRow = page.getByText('Atraso', { exact: true }).locator('..');
    await atrasoRow.getByRole('button', { name: 'Marcar' }).click();

    const colabRow = page.getByText('Colaboração em Equipe', { exact: true }).locator('..');
    await colabRow.getByRole('button', { name: 'Marcar' }).click();

    // Click "Concluir" to return to evaluation page
    const finishTagsBtn = page.getByRole('button', { name: 'Concluir' });
    await expect(finishTagsBtn).toBeVisible();
    await finishTagsBtn.click();

    await expect(page).not.toHaveURL(/\/marcacoes$/);

    // Validate that chosen tags appear in the main evaluation screen
    const quickObsSection = page
      .locator('div')
      .filter({ has: page.getByRole('heading', { name: 'Observações rápidas' }) });
    await expect(quickObsSection.getByText('Atraso')).toBeVisible();
    await expect(quickObsSection.getByText('Colaboração em Equipe')).toBeVisible();

    // 4. Feedback (Templates): Type initial text, use template from real API, add manual text
    const feedbackField = page.getByPlaceholder(/Escreva aqui um feedback para o\(a\) aluno\(a\)/i);
    await expect(feedbackField).toBeVisible();
    await feedbackField.fill('Excelente participação nas discussões iniciais.');

    const useTemplateBtn = page.getByRole('button', { name: /Usar modelo/i });
    await expect(useTemplateBtn).toBeVisible();
    await useTemplateBtn.click();

    const templateDialog = page.getByRole('dialog', { name: 'Modelos de feedback' });
    await expect(templateDialog).toBeVisible();

    // Real backend seed provides "Boa participação e engajamento"
    const templateItem = templateDialog.getByRole('button', {
      name: /Boa participação e engajamento/i,
    });
    await expect(templateItem).toBeVisible();
    await templateItem.click();

    await expect(templateDialog).not.toBeVisible();

    // Verify concatenation with real seeded text
    const expectedConcatenatedText =
      'Excelente participação nas discussões iniciais.\n\nDemonstrou participação ativa durante a sessão tutorial, contribuindo com perguntas e reflexões pertinentes para o avanço da discussão do grupo.';
    await expect(feedbackField).toHaveValue(expectedConcatenatedText);

    // Add manual text
    await feedbackField.focus();
    await feedbackField.press('End');
    await page.keyboard.type(' Manteve ótimo foco no problema.');

    const expectedFinalFeedback = `${expectedConcatenatedText} Manteve ótimo foco no problema.`;
    await expect(feedbackField).toHaveValue(expectedFinalFeedback);

    // 5. Submission Validation: Intercept save requests upon clicking "Salvar rascunho"
    const evalSavePromise = page.waitForRequest(
      (req) =>
        req.url().includes('/api/sessoes/sess-1/avaliacoes/aluno-1') && req.method() === 'PUT',
    );
    const feedbackSavePromise = page.waitForRequest(
      (req) =>
        req.url().includes('/api/sessoes/sess-1/alunos/aluno-1/feedback') && req.method() === 'PUT',
    );

    const saveDraftBtn = page.getByRole('button', { name: 'Salvar rascunho' });
    await expect(saveDraftBtn).toBeVisible();
    await saveDraftBtn.click();

    const [evalRequest, feedbackRequest] = await Promise.all([
      evalSavePromise,
      feedbackSavePromise,
    ]);

    const latestEvalPayload = evalRequest.postDataJSON() as {
      itens: Array<{ criterioId: string; nota: number }>;
      enviar: boolean;
      notaCargo?: number | null;
    };
    const latestFeedbackPayload = feedbackRequest.postDataJSON() as {
      texto: string;
    };

    // a) As notas e pesos alterados foram enviados
    expect(latestEvalPayload.enviar).toBe(false);
    expect(latestEvalPayload.itens).toEqual([
      { criterioId: 'crit-1', nota: 7 },
      { criterioId: 'crit-2', nota: 8 },
    ]);

    // b) Os IDs das marcações escolhidas estão presentes
    expect(capturedObservationTagIds).toEqual(expect.arrayContaining(['tag-atraso', 'tag-colab']));

    // c) O texto do feedback reflete a string final exata
    expect(latestFeedbackPayload.texto).toBe(expectedFinalFeedback);

    // d) NÃO EXISTE nenhuma chave ou ID referente ao template de feedback escolhido
    const seededTemplateId = '4f700000-0000-4000-8000-000000000001';
    const evalPayloadString = JSON.stringify(latestEvalPayload);
    const feedbackPayloadString = JSON.stringify(latestFeedbackPayload);

    expect(evalPayloadString).not.toContain(seededTemplateId);
    expect(evalPayloadString).not.toContain('template');
    expect(evalPayloadString).not.toContain('modelo');
    expect(feedbackPayloadString).not.toContain(seededTemplateId);
    expect(feedbackPayloadString).not.toContain('template');
    expect(feedbackPayloadString).not.toContain('modelo');

    expect(latestFeedbackPayload).not.toHaveProperty('templateId');
    expect(latestFeedbackPayload).not.toHaveProperty('modeloId');
    expect(latestEvalPayload).not.toHaveProperty('templateId');
    expect(latestEvalPayload).not.toHaveProperty('modeloId');
  });
});
