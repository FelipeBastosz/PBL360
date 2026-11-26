import type { Page } from '@playwright/test';

const CURRENT_VERSION = '1.2';

export async function mockAcceptedTerms(page: Page) {
  await page.route('**/api/usuarios/meu-aceite-termo', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        aceito: true,
        versaoAceita: CURRENT_VERSION,
        aceitoEm: '2026-11-17T12:00:00.000Z',
        versaoVigente: CURRENT_VERSION,
      }),
    }),
  );
}

export async function mockAuthenticatedShell(page: Page) {
  await mockAcceptedTerms(page);
  await page.route('**/api/usuarios/minhas-preferencias', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ tema: 'CLARO', cor: '#000077' }),
    }),
  );
}
