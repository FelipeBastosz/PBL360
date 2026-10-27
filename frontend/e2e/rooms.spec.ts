import { test, expect } from '@playwright/test';

const mockRooms = [
  {
    id: 'sala-1',
    nome: 'Turma de Engenharia de Software',
    semestre: '2026.1',
    codigoDisciplina: 'ES101',
    codigoSala: 'SALA-01',
    professorResponsavelId: 'user-tutor-1',
    ativo: true,
    criadoEm: '2026-01-10T10:00:00.000Z',
    totalAlunos: 32,
    totalProblemas: 4,
  },
  {
    id: 'sala-2',
    nome: 'Turma de Banco de Dados',
    semestre: '2026.1',
    codigoDisciplina: 'BD202',
    codigoSala: 'SALA-02',
    professorResponsavelId: 'user-tutor-1',
    ativo: true,
    criadoEm: '2026-01-12T10:00:00.000Z',
    totalAlunos: 25,
    totalProblemas: 2,
  },
];

test.describe('Rooms Page', () => {
  test.beforeEach(async ({ page }) => {
    // Inject authenticated session into localStorage before navigation
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

    // Mock the backend rooms API response
    await page.route('**/api/salas', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockRooms),
      });
    });

    // Mock students and problems counts if requested per room
    await page.route('**/api/salas/*/alunos', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });
    await page.route('**/api/salas/*/problemas', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    await page.goto('/turmas');
  });

  test('should display room list with count and cards', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 2, name: 'Minhas turmas · 2' })).toBeVisible();
    await expect(
      page.getByRole('heading', { level: 3, name: 'Turma de Engenharia de Software' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { level: 3, name: 'Turma de Banco de Dados' }),
    ).toBeVisible();
  });

  test('should filter rooms when typing in search field', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Pesquisar turma');
    await searchInput.fill('Engenharia');

    await expect(page.getByRole('heading', { level: 2, name: 'Minhas turmas · 1' })).toBeVisible();
    await expect(
      page.getByRole('heading', { level: 3, name: 'Turma de Engenharia de Software' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { level: 3, name: 'Turma de Banco de Dados' }),
    ).not.toBeVisible();
  });

  test('should show empty message when search matches no rooms', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Pesquisar turma');
    await searchInput.fill('Matemática Quântica');

    await expect(page.getByText('Nenhuma turma encontrada.')).toBeVisible();
    await expect(
      page.getByRole('heading', { level: 3, name: 'Turma de Engenharia de Software' }),
    ).not.toBeVisible();
  });
});
