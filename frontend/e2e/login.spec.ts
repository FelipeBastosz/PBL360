import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/entrar');
  });

  test('should display login form fields and submit button', async ({ page }) => {
    await expect(page.getByLabel('Email Institucional')).toBeVisible();
    await expect(page.getByPlaceholder('Informe sua senha')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Cadastre-se' })).toBeVisible();
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

  test('should navigate to profile selection when clicking registration link', async ({ page }) => {
    await page.getByRole('link', { name: 'Cadastre-se' }).click();
    await expect(page).toHaveURL(/\/perfil/);
  });

  test('should show error alert when submitting invalid credentials', async ({ page }) => {
    await page.route('**/api/autenticacao/login', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          statusCode: 401,
          message: 'E-mail ou senha inválidos.',
        }),
      });
    });

    await page.getByLabel('Email Institucional').fill('carlos@uefs.br');
    await page.getByPlaceholder('Informe sua senha').fill('senhaErrada');
    await page.getByRole('button', { name: 'Entrar' }).click();

    await expect(page.getByRole('alert')).toContainText('E-mail ou senha inválidos.');
    await expect(page).toHaveURL(/\/entrar/);
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
