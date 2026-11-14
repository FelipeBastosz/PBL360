import { test, expect, type Page } from '@playwright/test';

const VIEWPORTS = [
  { width: 360, height: 640 },
  { width: 375, height: 667 },
  { width: 390, height: 844 },
  { width: 1366, height: 768 },
  { width: 1920, height: 1080 },
];

const AUTH_ROUTES = ['/entrar', '/cadastro', '/recuperar-senha'];

async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
}

async function mockTutorSession(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem(
      'pbl360.session',
      JSON.stringify({
        token: 'mock-auth-token',
        expiraEm: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        usuario: {
          id: 'user-tutor-1',
          nome: 'Carlos Silva',
          email: 'carlos@faculdade.edu.br',
          tipo: 'PROFESSOR',
          ativo: true,
        },
      }),
    );
  });
  await page.route('**/api/salas', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  );
}

for (const viewport of VIEWPORTS) {
  test.describe(`Responsive layout at ${viewport.width}x${viewport.height}`, () => {
    test.use({ viewport });

    for (const route of AUTH_ROUTES) {
      test(`should not scroll horizontally on ${route}`, async ({ page }) => {
        await page.goto(route);
        await expect(page.locator('form')).toBeVisible();
        await expectNoHorizontalScroll(page);
      });
    }

    test('should keep the account menu within the viewport on /turmas', async ({ page }) => {
      await mockTutorSession(page);
      await page.goto('/turmas');
      await page.getByRole('button', { name: 'Abrir menu da conta' }).click();

      const close = page.getByRole('button', { name: 'Fechar menu' });
      await expect(close).toBeVisible();
      await expect(close).toBeInViewport();
      await expectNoHorizontalScroll(page);
    });

    test('should align the FAB with the header avatar on /turmas', async ({ page }) => {
      await mockTutorSession(page);
      await page.goto('/turmas');

      const avatar = await page.getByRole('button', { name: 'Abrir menu da conta' }).boundingBox();
      const fab = await page.getByRole('button', { name: 'Ações de turma' }).boundingBox();
      expect(
        Math.abs(fab!.x + fab!.width / 2 - (avatar!.x + avatar!.width / 2)),
      ).toBeLessThanOrEqual(1);
    });
  });
}
