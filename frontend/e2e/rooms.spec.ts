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

  test('should show owner badge and blocked warning modal when owner tries to leave own room', async ({
    page,
  }) => {
    await expect(page.getByRole('button', { name: /sair da turma/i })).toHaveCount(0);

    await page.getByRole('button', { name: /ações de turma/i }).click();
    await page.getByRole('button', { name: 'Sair de uma turma' }).click();

    await expect(page.getByText('Professor responsável').first()).toBeVisible();

    await page
      .getByRole('button', { name: 'Sair da turma Turma de Engenharia de Software' })
      .click();

    const dialog = page.getByRole('dialog', { name: 'Não é possível sair da turma' });
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByText(
        'O professor responsável não pode sair da turma. Transfira a responsabilidade ou exclua a sala.',
      ),
    ).toBeVisible();

    await dialog.getByRole('button', { name: 'Entendi' }).click();
    await expect(dialog).not.toBeVisible();
    await expect(
      page.getByRole('heading', { level: 3, name: 'Turma de Engenharia de Software' }),
    ).toBeVisible();
  });

  test('should show leave room button when teacher is a co-tutor and activates leave mode', async ({
    page,
  }) => {
    await page.route('**/api/salas', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            ...mockRooms[0],
            professorResponsavelId: 'another-tutor-id',
          },
        ]),
      });
    });

    await page.goto('/turmas');
    await expect(page.getByRole('button', { name: /sair da turma/i })).not.toBeVisible();

    await page.getByRole('button', { name: /ações de turma/i }).click();
    await page.getByRole('button', { name: 'Sair de uma turma' }).click();

    await expect(page.getByRole('button', { name: /sair da turma/i })).toBeVisible();
    await expect(page.getByText('Professor responsável')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Concluir' })).toBeVisible();
  });
});

test.describe('Student Voluntary Room Leave flow', () => {
  const studentRoom = [
    {
      salaId: 'sala-aluno-1',
      nome: 'Turma de Redes de Computadores',
      semestre: '2026.1',
      totalAlunos: 20,
      totalProblemas: 2,
    },
  ];

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        'pbl360.session',
        JSON.stringify({
          token: 'mock-auth-token',
          expiraEm: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          usuario: {
            id: 'user-student-1',
            nome: 'Marina Souza',
            email: 'marina@faculdade.edu.br',
            tipo: 'ALUNO',
            ativo: true,
          },
        }),
      );
    });

    await page.route('**/api/salas/minhas', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(studentRoom),
      });
    });

    await page.goto('/turmas');
  });

  test('should display room and reveal leave button when student activates leave mode', async ({
    page,
  }) => {
    await expect(
      page.getByRole('heading', { level: 3, name: 'Turma de Redes de Computadores' }),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: /sair da turma/i })).not.toBeVisible();

    await page.getByRole('button', { name: /ações de turma/i }).click();
    await page.getByRole('button', { name: 'Sair de uma turma' }).click();

    await expect(page.getByRole('button', { name: /sair da turma/i })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Concluir' })).toBeVisible();

    await page.getByRole('button', { name: 'Concluir' }).click();
    await expect(page.getByRole('button', { name: /sair da turma/i })).not.toBeVisible();
  });

  test('should open confirmation modal and cancel room exit without leaving', async ({ page }) => {
    await page.getByRole('button', { name: /ações de turma/i }).click();
    await page.getByRole('button', { name: 'Sair de uma turma' }).click();

    await page.getByRole('button', { name: /sair da turma/i }).click();

    const dialog = page.getByRole('dialog', { name: 'Sair da turma?' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('Turma de Redes de Computadores')).toBeVisible();
    await expect(dialog.getByText(/ao sair da turma, você perderá o acesso às/i)).toBeVisible();

    await dialog.getByRole('button', { name: 'Cancelar' }).click();

    await expect(dialog).not.toBeVisible();
    await expect(
      page.getByRole('heading', { level: 3, name: 'Turma de Redes de Computadores' }),
    ).toBeVisible();
  });

  test('should confirm leave room, call API, remove card and show success notification', async ({
    page,
  }) => {
    let leaveRequestCalled = false;
    await page.route('**/api/salas/sala-aluno-1/membros/me', async (route) => {
      if (route.request().method() === 'DELETE') {
        leaveRequestCalled = true;
        await route.fulfill({ status: 204 });
      }
    });

    await page.getByRole('button', { name: /ações de turma/i }).click();
    await page.getByRole('button', { name: 'Sair de uma turma' }).click();

    await page.getByRole('button', { name: /sair da turma/i }).click();

    const dialog = page.getByRole('dialog', { name: 'Sair da turma?' });
    await expect(dialog).toBeVisible();

    await dialog.getByRole('button', { name: 'Sim, sair da turma' }).click();

    await expect(dialog).not.toBeVisible();
    await expect(
      page.getByRole('heading', { level: 3, name: 'Turma de Redes de Computadores' }),
    ).not.toBeVisible();
    await expect(page.getByText('Você saiu da turma com sucesso.')).toBeVisible();
    expect(leaveRequestCalled).toBe(true);
  });
});

test.describe('Room Deletion Flow (ManageRoomsPage)', () => {
  const roomsForManage = [
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
      professorResponsavelId: 'another-tutor-id',
      ativo: true,
      criadoEm: '2026-01-12T10:00:00.000Z',
      totalAlunos: 25,
      totalProblemas: 2,
    },
  ];

  test.beforeEach(async ({ page }) => {
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

    await page.route('**/api/salas', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(roomsForManage),
      });
    });

    await page.goto('/turmas/gerenciar');
  });

  test('should show blocked warning modal when co-tutor tries to delete room', async ({ page }) => {
    await expect(
      page.getByRole('heading', { level: 3, name: 'Turma de Banco de Dados' }),
    ).toBeVisible();

    await page.getByRole('button', { name: 'Excluir Turma de Banco de Dados' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByRole('heading', { name: 'Não é possível excluir a turma' }),
    ).toBeVisible();
    await expect(
      dialog.getByText(
        'Você não possui permissão para excluir esta turma. Apenas o professor responsável pode realizar a exclusão.',
      ),
    ).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Sim, excluir turma' })).not.toBeVisible();

    await dialog.getByRole('button', { name: 'Entendi' }).click();
    await expect(dialog).not.toBeVisible();
    await expect(
      page.getByRole('heading', { level: 3, name: 'Turma de Banco de Dados' }),
    ).toBeVisible();
  });

  test('should allow owner to delete room successfully, remove card and show toast', async ({
    page,
  }) => {
    let deleteCalled = false;
    await page.route('**/api/salas/sala-1', async (route) => {
      if (route.request().method() === 'DELETE') {
        deleteCalled = true;
        await route.fulfill({ status: 204 });
      }
    });

    await page.getByRole('button', { name: 'Excluir Turma de Engenharia de Software' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('heading', { name: 'Excluir turma?' })).toBeVisible();
    await expect(
      dialog.getByText(/esta ação excluirá permanentemente a turma e todos os/i),
    ).toBeVisible();

    await dialog.getByRole('button', { name: 'Sim, excluir turma' }).click();

    await expect(dialog).not.toBeVisible();
    expect(deleteCalled).toBe(true);

    await expect(page.getByText('Turma excluída com sucesso!')).toBeVisible();
    await expect(
      page.getByRole('heading', { level: 3, name: 'Turma de Engenharia de Software' }),
    ).not.toBeVisible();
    await expect(
      page.getByRole('heading', { level: 3, name: 'Turma de Banco de Dados' }),
    ).toBeVisible();
  });

  test('should show error in modal and notification when API rejects deletion', async ({
    page,
  }) => {
    await page.route('**/api/salas/sala-1', async (route) => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Apenas o professor responsável pode realizar esta ação.',
          }),
        });
      }
    });

    await page.getByRole('button', { name: 'Excluir Turma de Engenharia de Software' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    await dialog.getByRole('button', { name: 'Sim, excluir turma' }).click();

    await expect(
      dialog.getByRole('heading', { name: 'Não é possível excluir a turma' }),
    ).toBeVisible();
    await expect(dialog.getByRole('alert')).toHaveText(
      'Apenas o professor responsável pode realizar esta ação.',
    );
    await expect(dialog.getByRole('button', { name: 'Entendi' })).toBeVisible();

    await dialog.getByRole('button', { name: 'Entendi' }).click();
    await expect(dialog).not.toBeVisible();
    await expect(
      page.getByRole('heading', { level: 3, name: 'Turma de Engenharia de Software' }),
    ).toBeVisible();
  });
});
