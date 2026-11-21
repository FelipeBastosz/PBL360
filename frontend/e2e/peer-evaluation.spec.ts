import { test, expect } from '@playwright/test';
import {
  createIsolatedSession,
  loginAsStudent,
  loginAsTeacher,
  logout,
  recordTwoParticipants,
  releaseStudentEvaluation,
  skipIfBackendUnavailable,
} from './helpers/fullstack';

test.describe('E2E Full-Stack: autoavaliação e avaliação entre pares', () => {
  test.beforeEach(async () => {
    await skipIfBackendUnavailable();
  });

  test('persiste as avaliações e bloqueia reenvios', async ({ page }) => {
    const runId = Date.now().toString().slice(-4);
    await loginAsTeacher(page);

    const selfSession = await createIsolatedSession(page, `Sessão Autoavaliação E2E ${runId}`);
    await recordTwoParticipants(page, selfSession.sessionId);
    await page.goto(
      `/turmas/${selfSession.roomId}/problemas/${selfSession.problemId}/sessoes/${selfSession.sessionId}`,
    );
    await releaseStudentEvaluation(page, 'autoavaliacao');

    const peerSession = await createIsolatedSession(page, `Sessão Pares E2E ${runId}`);
    await recordTwoParticipants(page, peerSession.sessionId);
    await page.goto(
      `/turmas/${peerSession.roomId}/problemas/${peerSession.problemId}/sessoes/${peerSession.sessionId}`,
    );
    await releaseStudentEvaluation(page, 'pares');

    await logout(page);
    await loginAsStudent(page);

    const selfEvaluationUrl = `/sessoes/${selfSession.sessionId}/autoavaliacao`;
    await page.goto(selfEvaluationUrl);
    const selfScoreInputs = page.getByRole('textbox', { name: /^Nota de / });
    await expect(selfScoreInputs.first()).toBeVisible();
    for (const scoreInput of await selfScoreInputs.all()) {
      await scoreInput.fill('8');
    }
    await expect(page.getByText('Nota final da sessão')).toBeVisible();
    await expect(page.getByText('8,0', { exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Enviar avaliação' }).click();
    const selfConfirmation = page.getByRole('dialog', {
      name: 'Confirmar envio da avaliação?',
    });
    const selfSaveResponse = page.waitForResponse(
      (response) =>
        response.request().method() === 'PUT' &&
        response.url().includes(`/sessoes/${selfSession.sessionId}/autoavaliacao`) &&
        response.ok(),
    );
    await selfConfirmation.getByRole('button', { name: 'Confirmar Envio' }).click();
    await selfSaveResponse;

    await page.goto(selfEvaluationUrl);
    await expect(page.getByText('Avaliação já enviada')).toBeVisible();
    for (const scoreInput of await page.getByRole('textbox', { name: /^Nota de / }).all()) {
      await expect(scoreInput).toBeDisabled();
    }
    await page.reload();
    await expect(page.getByText('Avaliação já enviada')).toBeVisible();
    for (const scoreInput of await page.getByRole('textbox', { name: /^Nota de / }).all()) {
      await expect(scoreInput).toBeDisabled();
    }

    const peerEvaluationUrl = `/sessoes/${peerSession.sessionId}/avaliar-colegas`;
    await page.goto(peerEvaluationUrl);
    const peerCard = page.getByRole('region', { name: 'Avaliação de João Silva' });
    await expect(peerCard).toBeVisible();
    const peerScoreInputs = peerCard.getByRole('textbox', { name: /^Nota de / });
    await expect(peerScoreInputs.first()).toBeVisible();
    for (const scoreInput of await peerScoreInputs.all()) {
      await scoreInput.fill('8');
    }
    await expect(peerCard.getByText('Nota final da sessão')).toBeVisible();
    await expect(peerCard.getByText('8,0', { exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Enviar avaliação' }).click();
    const peerConfirmation = page.getByRole('dialog', {
      name: 'Confirmar envio da avaliação?',
    });
    const peerSaveResponse = page.waitForResponse(
      (response) =>
        response.request().method() === 'PUT' &&
        response.url().includes(`/sessoes/${peerSession.sessionId}/pares/`) &&
        response.ok(),
    );
    await peerConfirmation.getByRole('button', { name: 'Confirmar Envio' }).click();
    await peerSaveResponse;

    await page.goto(peerEvaluationUrl);
    const submittedPeerCard = page.getByRole('region', { name: 'Avaliação de João Silva' });
    await expect(submittedPeerCard.getByText('Avaliação já enviada')).toBeVisible();
    for (const scoreInput of await submittedPeerCard
      .getByRole('textbox', { name: /^Nota de / })
      .all()) {
      await expect(scoreInput).toBeDisabled();
    }
    await page.reload();
    await expect(
      page
        .getByRole('region', { name: 'Avaliação de João Silva' })
        .getByText('Avaliação já enviada'),
    ).toBeVisible();
  });
});
