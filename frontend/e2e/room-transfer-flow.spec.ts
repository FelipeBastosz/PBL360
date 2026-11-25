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

test.describe('Room Ownership Transfer - Core Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((session) => {
      localStorage.setItem('pbl360.session', JSON.stringify(session));
    }, mockOwnerSession);

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

    await page.route('**/api/salas/sala-1/problemas', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    await page.route('**/api/salas/sala-1/conversas', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });
  });

  test('transfers room ownership to co-tutor through confirmation modal successfully', async ({
    page,
  }) => {
    let currentOwnerId = 'user-owner';

    await page.route('**/api/salas/sala-1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...mockRoom, professorResponsavelId: currentOwnerId }),
      });
    });

    await page.route('**/api/salas/sala-1/professores', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockTutors),
      });
    });

    await page.route('**/api/salas/sala-1/proprietario', async (route) => {
      currentOwnerId = 'user-cotutor';
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'sala-1', professorResponsavelId: 'user-cotutor' }),
      });
    });

    await page.goto('/turmas/sala-1/problemas');
    await expect(page.getByText('MI - Programação')).toBeVisible();

    const fabButton = page.getByRole('button', { name: 'Ações de problema' });
    await fabButton.click();

    const transferAction = page.getByRole('button', { name: 'Transferir turma' });
    await expect(transferAction).toBeVisible();
    await transferAction.click();

    const modal = page.getByRole('dialog', { name: 'Transferir propriedade da turma' });
    await expect(modal).toBeVisible();

    const transferButton = modal.getByRole('button', { name: 'Transferir' });
    await expect(transferButton).toBeDisabled();

    await modal.getByLabel('Novo professor responsável').selectOption('user-cotutor');
    await expect(transferButton).toBeEnabled();
    await transferButton.click();

    const confirmModal = page.getByRole('dialog', { name: 'Confirmar transferência' });
    await expect(confirmModal).toBeVisible();
    await expect(confirmModal.getByText('Profa. Cotutora')).toBeVisible();

    await confirmModal.getByRole('button', { name: 'Confirmar transferência' }).click();

    await expect(confirmModal).not.toBeVisible();
    await expect(modal).not.toBeVisible();
    await expect(page.getByText('Propriedade da turma transferida com sucesso!')).toBeVisible();

    await fabButton.click();
    await expect(page.getByRole('button', { name: 'Transferir turma' })).not.toBeVisible();
  });

  test('explains co-tutor requirement and transitions to invite sheet when no co-tutors exist', async ({
    page,
  }) => {
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
        body: JSON.stringify([mockTutors[0]]),
      });
    });

    await page.goto('/turmas/sala-1/problemas');
    await expect(page.getByText('MI - Programação')).toBeVisible();

    const fabButton = page.getByRole('button', { name: 'Ações de problema' });
    await fabButton.click();

    const transferAction = page.getByRole('button', { name: 'Transferir turma' });
    await transferAction.click();

    const modal = page.getByRole('dialog', { name: 'Transferir propriedade da turma' });
    await expect(modal).toBeVisible();
    await expect(
      page.getByText(/Não há outros professores vinculados a esta turma no momento/),
    ).toBeVisible();

    const addTutorButton = modal.getByRole('button', { name: 'Adicionar co-tutor' });
    await addTutorButton.click();

    const inviteSheet = page.getByRole('dialog', { name: 'Convidar para a turma' });
    await expect(inviteSheet).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Professores' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  test('cancels confirmation modal and keeps previous owner', async ({ page }) => {
    let patchCalled = false;

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

    await page.route('**/api/salas/sala-1/proprietario', async (route) => {
      patchCalled = true;
      await route.fulfill({ status: 200, body: '{}' });
    });

    await page.goto('/turmas/sala-1/problemas');
    await page.getByRole('button', { name: 'Ações de problema' }).click();
    await page.getByRole('button', { name: 'Transferir turma' }).click();

    const modal = page.getByRole('dialog', { name: 'Transferir propriedade da turma' });
    await modal.getByLabel('Novo professor responsável').selectOption('user-cotutor');
    await modal.getByRole('button', { name: 'Transferir' }).click();

    const confirmModal = page.getByRole('dialog', { name: 'Confirmar transferência' });
    await expect(confirmModal).toBeVisible();

    await confirmModal.getByRole('button', { name: 'Cancelar' }).click();
    await expect(confirmModal).not.toBeVisible();
    await expect(modal).toBeVisible();

    await modal.getByRole('button', { name: 'Cancelar' }).click();
    await expect(modal).not.toBeVisible();

    expect(patchCalled).toBe(false);
  });
});
