import { test, expect, type Page } from '@playwright/test';

type PreferencesState = {
  tema: 'CLARO' | 'ESCURO';
  cor: string;
};

const PROFESSOR_USER = {
  id: 'user-prof-theme-1',
  nome: 'Carlos Mendes',
  email: 'carlos@uefs.br',
  tipo: 'PROFESSOR',
  matricula: null,
  possuiFoto: false,
  ativo: true,
  criadoEm: '2026-01-01T10:00:00.000Z',
};

const STUDENT_USER = {
  id: 'user-student-theme-2',
  nome: 'Ana Souza',
  email: 'ana@discente.uefs.br',
  tipo: 'ALUNO',
  matricula: '20260001',
  possuiFoto: false,
  ativo: true,
  criadoEm: '2026-01-02T10:00:00.000Z',
};

const MOCK_ROOMS = [
  {
    id: 'sala-1',
    nome: 'Engenharia de Software - T01',
    semestre: '2026.1',
    codigoDisciplina: 'EXA863',
    codigoSala: 'ES-2026',
    professorResponsavelId: PROFESSOR_USER.id,
    ativo: true,
    criadoEm: '2026-01-10T10:00:00.000Z',
    totalAlunos: 18,
    totalProblemas: 2,
  },
];

const MOCK_PROBLEMS = [
  {
    id: 'prob-1',
    salaId: 'sala-1',
    titulo: 'Problema 1 — Arquitetura Modular',
    descricao: 'Definir arquitetura do sistema.',
    criadoEm: '2026-01-11T10:00:00.000Z',
  },
];

const MOCK_FORMULAS = [
  {
    id: 'tab-1',
    nome: 'Fórmula Padrão PBL',
    descricao: 'Critérios básicos de avaliação',
    quantidadeCriterios: 3,
    professorId: PROFESSOR_USER.id,
    origem: 'PESSOAL',
  },
];

async function setupStatefulApi(
  page: Page,
  options?: {
    initialPreferences?: Record<string, PreferencesState>;
    failNextPut?: () => boolean;
  },
) {
  const prefsByToken: Record<string, PreferencesState> = {
    'token-professor': { tema: 'CLARO', cor: '#000077' },
    'token-student': { tema: 'CLARO', cor: '#000077' },
    ...options?.initialPreferences,
  };

  const getToken = (authHeader?: string) => authHeader?.replace(/^Bearer\s+/i, '') ?? '';

  await page.route('**/api/usuarios/meu-aceite-termo', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        aceito: true,
        versaoAceita: '1.2',
        aceitoEm: '2026-01-01T10:00:00.000Z',
        versaoVigente: '1.2',
      }),
    }),
  );

  await page.route('**/api/termos-compromisso/vigente', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        versao: '1.2',
        titulo: 'Termos de Uso e Política de Privacidade',
        texto: 'Termos vigentes.',
      }),
    }),
  );

  await page.route('**/api/autenticacao/login', async (route) => {
    const body = route.request().postDataJSON() as { email?: string };
    const isStudent = body?.email === STUDENT_USER.email;
    const usuario = isStudent ? STUDENT_USER : PROFESSOR_USER;
    const token = isStudent ? 'token-student' : 'token-professor';
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        token,
        expiraEm: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        usuario,
      }),
    });
  });

  await page.route('**/api/usuarios/minhas-preferencias', async (route) => {
    const token = getToken(route.request().headers()['authorization']);
    const current = prefsByToken[token] ?? { tema: 'CLARO', cor: '#000077' };

    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(current),
      });
      return;
    }

    if (route.request().method() === 'PUT') {
      if (options?.failNextPut?.()) {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            statusCode: 500,
            message: 'Erro interno ao salvar preferências.',
          }),
        });
        return;
      }

      const payload = route.request().postDataJSON() as Partial<PreferencesState>;
      const updated: PreferencesState = {
        tema: payload.tema ?? current.tema,
        cor: payload.cor ?? current.cor,
      };
      prefsByToken[token] = updated;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(updated),
      });
    }
  });

  await page.route('**/api/usuarios/meu-perfil', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(PROFESSOR_USER),
    }),
  );

  await page.route('**/api/salas', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_ROOMS),
    }),
  );

  await page.route('**/api/salas/minhas', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_ROOMS),
    }),
  );

  await page.route('**/api/salas/sala-1', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_ROOMS[0]),
    }),
  );

  await page.route('**/api/salas/sala-1/problemas', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_PROBLEMS),
    }),
  );

  await page.route('**/api/salas/sala-1/alunos', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  );

  await page.route('**/api/tabelas-desempenho**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_FORMULAS),
    }),
  );

  return prefsByToken;
}

async function seedSession(page: Page, role: 'professor' | 'student') {
  const usuario = role === 'professor' ? PROFESSOR_USER : STUDENT_USER;
  const token = role === 'professor' ? 'token-professor' : 'token-student';
  await page.addInitScript(
    ({ sessionToken, sessionUser }) => {
      localStorage.setItem(
        'pbl360.session',
        JSON.stringify({
          token: sessionToken,
          expiraEm: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          usuario: sessionUser,
        }),
      );
    },
    { sessionToken: token, sessionUser: usuario },
  );
}

async function readDomTheme(page: Page) {
  return page.evaluate(() => ({
    dataTheme: document.documentElement.dataset.theme,
    hasDarkClass: document.documentElement.classList.contains('dark'),
    brandPrimary: document.documentElement.style.getPropertyValue('--color-brand-primary').trim(),
    brandAccent: document.documentElement.style.getPropertyValue('--color-brand-accent').trim(),
    metaThemeColor:
      document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.content ?? '',
  }));
}

for (const viewport of [
  { name: 'Desktop', width: 1280, height: 800 },
  { name: 'Mobile', width: 390, height: 844 },
]) {
  test.describe(`Theme and color preferences (${viewport.name})`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test('applies dark mode and system color globally across screens, modals, and forms', async ({
      page,
    }) => {
      await setupStatefulApi(page);
      await seedSession(page, 'professor');
      await page.goto('/turmas');

      await page.getByRole('button', { name: 'Abrir menu da conta' }).click();
      await page.getByRole('radio', { name: 'Escuro', exact: true }).click();
      await page.getByRole('radio', { name: 'Verde Petróleo', exact: true }).click();

      await expect
        .poll(() => readDomTheme(page))
        .toMatchObject({
          dataTheme: 'dark',
          hasDarkClass: true,
          brandPrimary: '#0F766E',
          metaThemeColor: '#0F766E',
        });

      // Open modal inside drawer and confirm theme remains applied
      await page.getByRole('button', { name: 'Informações adicionais' }).click();
      await expect(page.getByRole('heading', { name: 'Informações adicionais' })).toBeVisible();
      await page.getByRole('button', { name: 'Fechar informações adicionais' }).click();
      await page.getByRole('button', { name: 'Fechar menu' }).click();

      // Navigate to room problems
      await page.getByRole('link', { name: /Engenharia de Software/i }).click();
      await expect(page).toHaveURL(/\/turmas\/sala-1\/problemas/);
      await expect(
        page.getByRole('heading', { level: 1, name: 'Engenharia de Software' }),
      ).toBeVisible();
      await expect(page.getByRole('link', { name: /Problema 1/i })).toBeVisible();
      await expect
        .poll(() => readDomTheme(page))
        .toMatchObject({
          dataTheme: 'dark',
          brandPrimary: '#0F766E',
        });

      // Navigate to formulas
      await page.getByRole('button', { name: 'Abrir menu da conta' }).click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await page.getByRole('link', { name: 'Minhas Fórmulas' }).click();
      await expect(page).toHaveURL(/\/minhas-formulas/);
      await expect(page.getByRole('heading', { level: 1, name: 'Minhas Fórmulas' })).toBeVisible();
      await expect
        .poll(() => readDomTheme(page))
        .toMatchObject({
          dataTheme: 'dark',
          brandPrimary: '#0F766E',
        });

      // Navigate to profile form
      await page.getByRole('button', { name: 'Abrir menu da conta' }).click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await page.getByRole('link', { name: 'Meu Perfil' }).click();
      await expect(page).toHaveURL(/\/minha-conta/);
      await expect(page.getByRole('heading', { name: 'Dados da Conta' })).toBeVisible();
      await expect
        .poll(() => readDomTheme(page))
        .toMatchObject({
          dataTheme: 'dark',
          brandPrimary: '#0F766E',
        });
    });
  });
}

test.describe('Theme and color persistence, error handling, isolation, and keyboard', () => {
  test('persists preferences across page reload, fresh login, and restores default color', async ({
    page,
  }) => {
    await setupStatefulApi(page);
    await page.goto('/entrar');

    await page.getByLabel('Email Institucional').fill(PROFESSOR_USER.email);
    await page.getByPlaceholder('Informe sua senha').fill('Senha@123');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page).toHaveURL(/\/turmas/);

    await page.getByRole('button', { name: 'Abrir menu da conta' }).click();
    await page.getByRole('radio', { name: 'Escuro', exact: true }).click();
    await page.getByRole('radio', { name: 'Roxo', exact: true }).click();

    await expect
      .poll(() => readDomTheme(page))
      .toMatchObject({
        dataTheme: 'dark',
        brandPrimary: '#4C1D95',
      });

    // Reload confirms persistence
    await page.reload();
    await expect
      .poll(() => readDomTheme(page))
      .toMatchObject({
        dataTheme: 'dark',
        brandPrimary: '#4C1D95',
      });

    // Restore default color
    await page.getByRole('button', { name: 'Abrir menu da conta' }).click();
    const restoreBtn = page.getByRole('button', { name: 'Restaurar cor padrão' });
    await expect(restoreBtn).toBeEnabled();
    await restoreBtn.click();

    await expect
      .poll(() => readDomTheme(page))
      .toMatchObject({
        dataTheme: 'dark',
        brandPrimary: '#000077',
      });
    await expect(restoreBtn).toBeDisabled();

    // Logout resets DOM to light + #000077; re-login restores saved dark + #000077 from API
    await page.getByRole('button', { name: 'Sair da conta' }).click();
    await expect(page).toHaveURL(/\/entrar/);
    await expect
      .poll(() => readDomTheme(page))
      .toMatchObject({
        dataTheme: 'light',
        hasDarkClass: false,
        brandPrimary: '#000077',
      });

    await page.getByLabel('Email Institucional').fill(PROFESSOR_USER.email);
    await page.getByPlaceholder('Informe sua senha').fill('Senha@123');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page).toHaveURL(/\/turmas/);
    await expect
      .poll(() => readDomTheme(page))
      .toMatchObject({
        dataTheme: 'dark',
        brandPrimary: '#000077',
      });
  });

  test('reverts to previous confirmed preferences and shows alert when PUT fails', async ({
    page,
  }) => {
    let shouldFail = false;
    await setupStatefulApi(page, {
      initialPreferences: {
        'token-professor': { tema: 'CLARO', cor: '#166534' },
      },
      failNextPut: () => shouldFail,
    });
    await seedSession(page, 'professor');
    await page.goto('/turmas');

    await expect
      .poll(() => readDomTheme(page))
      .toMatchObject({
        dataTheme: 'light',
        brandPrimary: '#166534',
      });

    shouldFail = true;
    await page.getByRole('button', { name: 'Abrir menu da conta' }).click();
    await page.getByRole('radio', { name: 'Escuro', exact: true }).click();

    await expect(page.getByRole('alert')).toContainText(
      'Não foi possível salvar suas preferências.',
    );
    await expect
      .poll(() => readDomTheme(page))
      .toMatchObject({
        dataTheme: 'light',
        hasDarkClass: false,
        brandPrimary: '#166534',
      });
    await expect(page.getByRole('radio', { name: 'Claro', exact: true })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });

  test('isolates preferences completely between Account A (professor) and Account B (student)', async ({
    page,
  }) => {
    await setupStatefulApi(page);
    await page.goto('/entrar');

    // Login Account A (professor) and configure Dark + Lilás
    await page.getByLabel('Email Institucional').fill(PROFESSOR_USER.email);
    await page.getByPlaceholder('Informe sua senha').fill('Senha@123');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page).toHaveURL(/\/turmas/);

    await page.getByRole('button', { name: 'Abrir menu da conta' }).click();
    await page.getByRole('radio', { name: 'Escuro', exact: true }).click();
    await page.getByRole('radio', { name: 'Lilás', exact: true }).click();
    await expect
      .poll(() => readDomTheme(page))
      .toMatchObject({
        dataTheme: 'dark',
        brandPrimary: '#9333EA',
      });

    // Logout Account A
    await page.getByRole('button', { name: 'Sair da conta' }).click();
    await expect(page).toHaveURL(/\/entrar/);
    await expect
      .poll(() => readDomTheme(page))
      .toMatchObject({
        dataTheme: 'light',
        brandPrimary: '#000077',
      });

    // Login Account B (student) — must keep its own default Light + #000077
    await page.getByLabel('Email Institucional').fill(STUDENT_USER.email);
    await page.getByPlaceholder('Informe sua senha').fill('Senha@123');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page).toHaveURL(/\/turmas/);

    await expect
      .poll(() => readDomTheme(page))
      .toMatchObject({
        dataTheme: 'light',
        hasDarkClass: false,
        brandPrimary: '#000077',
      });
  });

  test('operates theme and color controls completely via keyboard', async ({ page }) => {
    await setupStatefulApi(page);
    await seedSession(page, 'professor');
    await page.goto('/turmas');

    const menuButton = page.getByRole('button', { name: 'Abrir menu da conta' });
    await menuButton.focus();
    await page.keyboard.press('Enter');

    const lightRadio = page.getByRole('radio', { name: 'Claro', exact: true });
    const darkRadio = page.getByRole('radio', { name: 'Escuro', exact: true });
    await lightRadio.focus();
    await page.keyboard.press('ArrowRight');
    await expect(darkRadio).toBeFocused();
    await page.keyboard.press('Enter');

    await expect
      .poll(() => readDomTheme(page))
      .toMatchObject({
        dataTheme: 'dark',
      });

    const firstSwatch = page.getByRole('radio', { name: 'Vermelho Vinho', exact: true });
    const secondSwatch = page.getByRole('radio', { name: 'Vermelho', exact: true });
    await firstSwatch.focus();
    await page.keyboard.press('ArrowRight');
    await expect(secondSwatch).toBeFocused();
    await page.keyboard.press('Space');

    await expect
      .poll(() => readDomTheme(page))
      .toMatchObject({
        dataTheme: 'dark',
        brandPrimary: '#B91C1C',
      });
  });
});
