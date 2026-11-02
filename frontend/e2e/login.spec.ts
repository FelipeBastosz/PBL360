import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/entrar');
  });

  test('should display login form fields and submit button', async ({ page }) => {
    await expect(page.getByLabel('Email Institucional')).toBeVisible();
    await expect(page.getByPlaceholder('Informe sua senha')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Criar conta' })).toBeVisible();
  });

  test('should show validation error when submitting with empty email', async ({ page }) => {
    await page.getByRole('button', { name: 'Entrar' }).click();

    await expect(page.getByText('Informe seu e-mail.')).toBeVisible();
    await expect(page.getByText('Informe sua senha.')).toBeVisible();
  });

  test('should show validation error when submitting invalid email format', async ({ page }) => {
    await page.getByLabel('Email Institucional').fill('email-invalido');
    await page.getByRole('button', { name: 'Entrar' }).click();

    await expect(page.getByText('Informe um e-mail válido.')).toBeVisible();
  });

  test('should navigate to registration when clicking create account link', async ({ page }) => {
    await page.getByRole('link', { name: 'Criar conta' }).click();
    await expect(page).toHaveURL(/\/cadastro/);
  });

  test('should login successfully with valid credentials and redirect to /turmas', async ({
    page,
  }) => {
    await page.route('**/api/autenticacao/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: 'mock-jwt-token',
          expiraEm: new Date(Date.now() + 3600 * 1000).toISOString(),
          usuario: {
            id: 'user-tutor-1',
            nome: 'Carlos Silva',
            email: 'carlos@uefs.br',
            tipo: 'PROFESSOR',
            ativo: true,
          },
        }),
      });
    });

    await page.route('**/api/salas', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    await page.getByLabel('Email Institucional').fill('carlos@uefs.br');
    await page.getByPlaceholder('Informe sua senha').fill('senhaSegura123');
    await page.getByRole('button', { name: 'Entrar' }).click();

    await expect(page).toHaveURL(/\/turmas/);
  });
});
