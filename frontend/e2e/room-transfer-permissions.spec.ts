import { test, expect } from '@playwright/test';

const mockOwnerSession = {
  token: 'mock-auth-token',
  expiraEm: new Date(Date.now() + 86400000).toISOString(),
  usuario: {
    id: 'user-owner',
    nome: 'Prof. Titular',
    email: 'titular@faculdade.edu.br',
    tipo: 'PROFESSOR',
    ativo: true,
  },
};

const mockCoTutorSession = {
  token: 'mock-auth-token',
  expiraEm: new Date(Date.now() + 86400000).toISOString(),
  usuario: {
    id: 'user-cotutor',
    nome: 'Profa. Cotutora',
    email: 'cotutora@faculdade.edu.br',
    tipo: 'PROFESSOR',
    ativo: true,
  },
};

const mockStudentSession = {
  token: 'mock-auth-token',
  expiraEm: new Date(Date.now() + 86400000).toISOString(),
  usuario: {
    id: 'user-student',
    nome: 'Aluno Alencar',
    email: 'aluno@faculdade.edu.br',
    tipo: 'ALUNO',
    ativo: true,
  },
};

const mockRoom = {
  id: 'sala-1',
  nome: 'MI - Programação - TP01',
  semestre: '2026.2',
  codigoDisciplina: 'EXA801',
  codigoSala: 'aB7kP2x9',
  professorResponsavelId: 'user-owner',
  ativo: true,
  criadoEm: '2026-01-10T10:00:00.000Z',
};

const mockTutors = [
  { id: 'user-owner', nome: 'Prof. Titular', email: 'titular@faculdade.edu.br', responsavel: true },
  {
    id: 'user-cotutor',
    nome: 'Profa. Cotutora',
    email: 'cotutora@faculdade.edu.br',
    responsavel: false,
  },
];

test.describe('Room Ownership Transfer - Permissions & Errors', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/usuarios/meu-aceite-termo', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          aceito: true,
          versaoAceita: '1.0',
          aceitoEm: '2026-01-01T00:00:00.000Z',
          versaoVigente: '1.0',
        }),
      });
    });

    await page.route('**/api/usuarios/*/foto', async (route) => {
      await route.fulfill({ status: 404, contentType: 'application/json', body: '{}' });
    });

    await page.route('**/api/salas/sala-1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockRoom),
      });
    });

    await page.route('**/api/salas/sala-1/professores', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockTutors),
      });
    });

    await page.route('**/api/salas/sala-1/problemas', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    await page.route('**/api/salas/sala-1/conversas', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });
  });

  test('displays api error in confirmation modal and preserves owner role', async ({ page }) => {
    await page.addInitScript((session) => {
      localStorage.setItem('pbl360.session', JSON.stringify(session));
    }, mockOwnerSession);

    await page.route('**/api/salas/sala-1/proprietario', async (route) => {
      await route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Apenas o professor responsável pode transferir a turma.',
        }),
      });
    });

    await page.goto('/turmas/sala-1/problemas');
    await page.getByRole('button', { name: 'Ações de problema' }).click();
    await page.getByRole('button', { name: 'Transferir turma' }).click();

    const modal = page.getByRole('dialog', { name: 'Transferir propriedade da turma' });
    await modal.getByLabel('Novo professor responsável').selectOption('user-cotutor');
    await modal.getByRole('button', { name: 'Transferir' }).click();

    const confirmModal = page.getByRole('dialog', { name: 'Confirmar transferência' });
    await confirmModal.getByRole('button', { name: 'Confirmar transferência' }).click();

    await expect(
      confirmModal.getByText('Apenas o professor responsável pode transferir a turma.'),
    ).toBeVisible();

    await confirmModal.getByRole('button', { name: 'Cancelar' }).click();
    await expect(confirmModal).not.toBeVisible();

    await modal.getByRole('button', { name: 'Cancelar' }).click();
    await expect(modal).not.toBeVisible();

    const fabButton = page.getByRole('button', { name: 'Ações de problema' });
    await fabButton.click();
    await expect(page.getByRole('button', { name: 'Transferir turma' })).toBeVisible();
  });

  test('does not show transfer option in fab menu for co-tutor', async ({ page }) => {
    await page.addInitScript((session) => {
      localStorage.setItem('pbl360.session', JSON.stringify(session));
    }, mockCoTutorSession);

    await page.goto('/turmas/sala-1/problemas');
    await expect(page.getByText('MI - Programação')).toBeVisible();

    const fabButton = page.getByRole('button', { name: 'Ações de problema' });
    await fabButton.click();

    await expect(page.getByRole('button', { name: 'Transferir turma' })).not.toBeVisible();
  });

  test('does not render fab menu or transfer option for student', async ({ page }) => {
    await page.addInitScript((session) => {
      localStorage.setItem('pbl360.session', JSON.stringify(session));
    }, mockStudentSession);

    await page.route('**/api/salas/minhas', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { salaId: 'sala-1', nome: 'MI - Programação - TP01', semestre: '2026.2', totalAlunos: 3 },
        ]),
      });
    });

    await page.goto('/turmas/sala-1/problemas');
    await expect(page.getByText('MI - Programação')).toBeVisible();

    await expect(page.getByRole('button', { name: 'Ações de problema' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Transferir turma' })).not.toBeVisible();
  });

  test('closes transfer modal on Escape key press', async ({ page }) => {
    await page.addInitScript((session) => {
      localStorage.setItem('pbl360.session', JSON.stringify(session));
    }, mockOwnerSession);

    await page.goto('/turmas/sala-1/problemas');
    await page.getByRole('button', { name: 'Ações de problema' }).click();
    await page.getByRole('button', { name: 'Transferir turma' }).click();

    const modal = page.getByRole('dialog', { name: 'Transferir propriedade da turma' });
    await expect(modal).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible();
  });
});
