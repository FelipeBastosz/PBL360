import { test, expect } from '@playwright/test';

const mockRoom = {
  id: 'sala-1',
  nome: 'Turma de Medicina - 2026.1',
  semestre: '2026.1',
  codigoDisciplina: 'MED101',
  codigoSala: 'SALA-MED',
  professorResponsavelId: 'user-tutor-1',
  ativo: true,
  criadoEm: '2026-01-10T10:00:00.000Z',
  totalAlunos: 30,
  totalProblemas: 3,
};

const mockProblem = {
  id: 'prob-1',
  salaId: 'sala-1',
  titulo: 'Problema 1 - Dor Torácica',
  descricao: 'Estudo de caso sobre síndrome coronariana aguda.',
  ordem: 1,
  dataInicio: '2026-02-01T00:00:00.000Z',
  dataFim: '2026-02-15T00:00:00.000Z',
  totalSessoes: 3,
};

const mockSessions = [
  {
    id: 'sess-1',
    problemaId: 'prob-1',
    titulo: 'Abertura',
    ordem: 1,
    data: '2026-02-01T14:00:00.000Z',
    status: 'CONCLUIDA',
  },
  {
    id: 'sess-2',
    problemaId: 'prob-1',
    titulo: 'Fechamento',
    ordem: 2,
    data: '2026-02-08T14:00:00.000Z',
    status: 'CONCLUIDA',
  },
];

const mockGrades = {
  sessoes: [
    { id: 'sess-1', rotulo: 'Abertura', data: '2026-02-01' },
    { id: 'sess-2', rotulo: 'Fechamento', data: '2026-02-08' },
  ],
  alunos: [
    {
      alunoId: 'aluno-1',
      nome: 'Ana Silva',
      matricula: '20260001',
      sessoes: [
        { sessaoId: 'sess-1', nota: 8.5, situacao: 'AVALIADA' },
        { sessaoId: 'sess-2', nota: 9.0, situacao: 'AVALIADA' },
      ],
      notaFinal: 8.75,
    },
    {
      alunoId: 'aluno-2',
      nome: 'Bruno Mendes',
      matricula: '20260002',
      sessoes: [
        { sessaoId: 'sess-1', nota: 7.0, situacao: 'AVALIADA' },
        { sessaoId: 'sess-2', nota: null, situacao: 'PENDENTE' },
      ],
      notaFinal: 7.0,
    },
  ],
  mediaTurma: 7.88,
  versoesFormula: { sessao: 1, problema: 1 },
};

const mockFeedbacks = {
  geral: null,
  alunos: [
    { alunoId: 'aluno-1', nome: 'Ana Silva', feedback: null },
    { alunoId: 'aluno-2', nome: 'Bruno Mendes', feedback: null },
  ],
};

test.describe('Professor Flows - Problem Grades & Reports', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        'pbl360.session',
        JSON.stringify({
          token: 'mock-tutor-token',
          expiraEm: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          usuario: {
            id: 'user-tutor-1',
            nome: 'Prof. Carlos Santos',
            email: 'carlos.tutor@uefs.br',
            tipo: 'PROFESSOR',
            ativo: true,
          },
        }),
      );
    });

    await page.route('**/api/salas/sala-1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockRoom),
      });
    });

    await page.route('**/api/salas/sala-1/problemas/prob-1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockProblem),
      });
    });

    await page.route('**/api/salas/sala-1/problemas/prob-1/sessoes', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockSessions),
      });
    });

    await page.route('**/api/salas/sala-1/problemas/prob-1/notas', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockGrades),
      });
    });

    await page.route('**/api/salas/sala-1/problemas/prob-1/feedbacks', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockFeedbacks),
      });
    });
  });

  test('should navigate from problem hub to problem grades report', async ({ page }) => {
    await page.goto('/turmas/sala-1/problemas/prob-1');

    const reportCard = page.getByRole('button', { name: /Relatório Final/i });
    await expect(reportCard).toBeVisible();
    await reportCard.click();

    await expect(page).toHaveURL(/\/turmas\/sala-1\/problemas\/prob-1\/notas/);
    await expect(page.getByText('Problema 1 - Dor Torácica')).toBeVisible();
    await expect(page.getByText('Média da turma')).toBeVisible();
    await expect(page.getByText('Ana Silva')).toBeVisible();
    await expect(page.getByText('Bruno Mendes')).toBeVisible();
  });

  test('should toggle student name privacy on problem grades table', async ({ page }) => {
    await page.goto('/turmas/sala-1/problemas/prob-1/notas');

    await expect(page.getByText('Ana Silva')).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'ALUNO' })).toBeVisible();

    const toggle = page.getByRole('switch', { name: 'Ocultar nomes' });
    await toggle.click();

    await expect(page.getByRole('columnheader', { name: 'MATRÍCULA' })).toBeVisible();
    await expect(page.getByText('20260001')).toBeVisible();
    await expect(page.getByText('20260002')).toBeVisible();
    await expect(page.getByText('Ana Silva')).not.toBeVisible();

    await toggle.click();
    await expect(page.getByText('Ana Silva')).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'ALUNO' })).toBeVisible();
  });

  test('should allow professor to submit general feedback for the problem', async ({ page }) => {
    let putCalled = false;
    let putBody: unknown = null;

    await page.route('**/api/salas/sala-1/problemas/prob-1/feedbacks/geral', async (route) => {
      if (route.request().method() === 'PUT') {
        putCalled = true;
        putBody = JSON.parse(route.request().postData() ?? '{}');
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'fb-geral-1',
            escopo: 'PROBLEMA',
            texto: 'Excelente raciocínio clínico demonstrado por toda a turma.',
            autorId: 'user-tutor-1',
          }),
        });
      }
    });

    await page.goto('/turmas/sala-1/problemas/prob-1/notas');

    const generalFeedbackBtn = page.getByRole('button', { name: 'Feedback geral da turma' });
    await expect(generalFeedbackBtn).toBeVisible();
    await generalFeedbackBtn.click();

    const dialog = page.getByRole('dialog', { name: 'Feedback Geral da Turma' });
    await expect(dialog).toBeVisible();

    const textarea = dialog.getByPlaceholder(/Digite o parecer e considerações gerais/i);
    await textarea.fill('Excelente raciocínio clínico demonstrado por toda a turma.');

    const saveBtn = dialog.getByRole('button', { name: 'Salvar' });
    await saveBtn.click();

    await expect(dialog).not.toBeVisible();
    expect(putCalled).toBe(true);
    expect(putBody).toEqual({
      destinatario_id: null,
      escopo: 'PROBLEMA',
      nota: null,
      texto: 'Excelente raciocínio clínico demonstrado por toda a turma.',
    });
  });

  test('should allow professor to open student feedback modal, view evaluation and submit comment', async ({
    page,
  }) => {
    let studentFeedbackPut = false;

    await page.route(
      '**/api/salas/sala-1/problemas/prob-1/feedbacks/alunos/aluno-1',
      async (route) => {
        if (route.request().method() === 'PUT') {
          studentFeedbackPut = true;
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              id: 'fb-student-1',
              alunoId: 'aluno-1',
              texto: 'Ótima participação e formulação de hipóteses diagnósticas.',
            }),
          });
        }
      },
    );

    await page.goto('/turmas/sala-1/problemas/prob-1/notas');

    const gradeCell = page.getByRole('button', { name: /Ana Silva.*Abertura/i });
    await expect(gradeCell).toBeVisible();
    await gradeCell.click();

    const dialog = page.getByRole('dialog', { name: /Feedback - Abertura/i });
    await expect(dialog).toBeVisible();

    const commentField = dialog.getByPlaceholder(/Digite o feedback detalhado do aluno/i);
    await commentField.fill('Ótima participação e formulação de hipóteses diagnósticas.');

    const saveBtn = dialog.getByRole('button', { name: 'Salvar' });
    await saveBtn.click();

    await expect(dialog).not.toBeVisible();
    expect(studentFeedbackPut).toBe(true);
  });

  test('should display export buttons with "Em breve" tooltip on problem grades page', async ({
    page,
  }) => {
    await page.goto('/turmas/sala-1/problemas/prob-1/notas');

    const pdfBtn = page.getByRole('button', { name: 'Exportar em PDF' });
    const excelBtn = page.getByRole('button', { name: 'Exportar em Excel' });

    await expect(pdfBtn).toBeVisible();
    await expect(pdfBtn).toBeDisabled();
    await expect(excelBtn).toBeVisible();
    await expect(excelBtn).toBeDisabled();

    await expect(page.getByText('Em breve').first()).toBeAttached();
  });

  test('should show error banner when problem grades API fails', async ({ page }) => {
    await page.route('**/api/salas/sala-1/problemas/prob-1/notas', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Erro interno ao carregar notas.' }),
      });
    });

    await page.goto('/turmas/sala-1/problemas/prob-1/notas');

    const alert = page.getByRole('alert');
    await expect(alert).toBeVisible();
    await expect(alert).toContainText('Ocorreu um erro inesperado no servidor');
  });
});
