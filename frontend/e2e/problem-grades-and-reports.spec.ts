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

function createMockProblemReportPdf(options?: { ocultarNomes?: boolean }): string {
  const student1Line = options?.ocultarNomes
    ? '(Matricula: 20260001 | Nota Final: 8.75) Tj'
    : '(Aluno: Ana Silva | Matricula: 20260001 | Nota Final: 8.75) Tj';
  const student2Line = options?.ocultarNomes
    ? '(Matricula: 20260002 | Nota Final: 7.00) Tj'
    : '(Aluno: Bruno Mendes | Matricula: 20260002 | Nota Final: 7.00) Tj';

  const content = [
    'BT',
    '/F1 16 Tf',
    '50 750 Td',
    '(Relatorio de Notas - Problema 1: Dor Toracica) Tj',
    '0 -30 Td',
    '/F1 12 Tf',
    '(Turma: MED101 - Medicina 2026.1 | Professor: Prof. Carlos Santos) Tj',
    '0 -25 Td',
    student1Line,
    '0 -20 Td',
    student2Line,
    'ET',
  ].join('\n');

  const contentLength = new TextEncoder().encode(content).length;

  const pdfString = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /MediaBox [0 0 612 792] /Contents 5 0 R >>
endobj
4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
5 0 obj
<< /Length ${contentLength} >>
stream
${content}
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000224 00000 n 
0000000299 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
450
%%EOF`;

  return pdfString;
}

async function readStreamToBuffer(stream: AsyncIterable<Uint8Array | string>): Promise<Uint8Array> {
  const chunks: Uint8Array[] = [];
  const encoder = new TextEncoder();
  let totalLength = 0;
  for await (const chunk of stream) {
    const bytes = typeof chunk === 'string' ? encoder.encode(chunk) : chunk;
    chunks.push(bytes);
    totalLength += bytes.length;
  }
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

const mockFeedbackTemplates = [
  {
    id: '4f700000-0000-4000-8000-000000000001',
    titulo: 'Boa participação e engajamento',
    texto:
      'Demonstrou participação ativa durante a sessão tutorial, contribuindo com perguntas e reflexões pertinentes para o avanço da discussão do grupo.',
  },
  {
    id: '4f700000-0000-4000-8000-000000000002',
    titulo: 'Necessidade de aprofundar argumentos',
    texto:
      'Participou das discussões da sessão, porém recomenda-se aprofundar a fundamentação teórica e articular melhor as evidências ao apresentar argumentos ao grupo.',
  },
];

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

    await page.route('**/api/modelos-feedback', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockFeedbackTemplates),
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

  test('should allow professor to select a feedback template, concatenate, manually edit and submit', async ({
    page,
  }) => {
    let capturedPayload: unknown = null;

    await page.route(
      '**/api/salas/sala-1/problemas/prob-1/feedbacks/alunos/aluno-1',
      async (route) => {
        if (route.request().method() === 'PUT') {
          capturedPayload = route.request().postDataJSON();
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              id: 'fb-student-1',
              alunoId: 'aluno-1',
              texto: (capturedPayload as { texto?: string })?.texto,
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
    await commentField.fill('Observação inicial do tutor.');

    const useTemplateBtn = dialog.getByRole('button', { name: /Usar modelo/i });
    await expect(useTemplateBtn).toBeVisible();
    await useTemplateBtn.click();

    const templateDialog = page.getByRole('dialog', { name: 'Modelos de feedback' });
    await expect(templateDialog).toBeVisible();
    await expect(templateDialog.getByText('Boa participação e engajamento')).toBeVisible();

    await templateDialog.getByRole('button', { name: /Boa participação e engajamento/i }).click();
    await expect(templateDialog).not.toBeVisible();
    expect(capturedPayload).toBeNull();

    await expect(commentField).toHaveValue(
      'Observação inicial do tutor.\n\nDemonstrou participação ativa durante a sessão tutorial, contribuindo com perguntas e reflexões pertinentes para o avanço da discussão do grupo.',
    );

    await commentField.focus();
    await commentField.press('End');
    await page.keyboard.type(' Continuar assim!');

    const saveBtn = dialog.getByRole('button', { name: 'Salvar' });
    await saveBtn.click();

    await expect(dialog).not.toBeVisible();
    expect(capturedPayload).toEqual({
      escopo: 'ALUNO',
      destinatario_id: 'aluno-1',
      sessao_id: 'sess-1',
      nota: 8.5,
      texto:
        'Observação inicial do tutor.\n\nDemonstrou participação ativa durante a sessão tutorial, contribuindo com perguntas e reflexões pertinentes para o avanço da discussão do grupo. Continuar assim!',
    });
    expect(capturedPayload).not.toHaveProperty('templateId');
    expect(capturedPayload).not.toHaveProperty('modeloId');
  });

  test('should allow canceling template selection via Cancelar or Escape without closing parent modal or altering comment', async ({
    page,
  }) => {
    await page.goto('/turmas/sala-1/problemas/prob-1/notas');

    const gradeCell = page.getByRole('button', { name: /Ana Silva.*Abertura/i });
    await gradeCell.click();

    const dialog = page.getByRole('dialog', { name: /Feedback - Abertura/i });
    const commentField = dialog.getByPlaceholder(/Digite o feedback detalhado do aluno/i);
    await commentField.fill('Texto inalterado.');

    await dialog.getByRole('button', { name: /Usar modelo/i }).click();

    const templateDialog = page.getByRole('dialog', { name: 'Modelos de feedback' });
    await expect(templateDialog).toBeVisible();
    await expect(templateDialog.getByText('Boa participação e engajamento')).toBeVisible();

    await templateDialog.getByRole('button', { name: 'Cancelar' }).click();
    await expect(templateDialog).not.toBeVisible();
    await expect(dialog).toBeVisible();
    await expect(commentField).toHaveValue('Texto inalterado.');

    await dialog.getByRole('button', { name: /Usar modelo/i }).click();
    await expect(templateDialog).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(templateDialog).not.toBeVisible();
    await expect(dialog).toBeVisible();
    await expect(commentField).toHaveValue('Texto inalterado.');
  });

  test('should display active export buttons, validate downloaded PDF content, and preview report', async ({
    page,
  }, testInfo) => {
    const mockPdfContent = createMockProblemReportPdf();
    let pdfExportRequested = false;
    let excelExportRequested = false;
    let capturedPdfParams: Record<string, string> = {};

    await page.route(/\/api\/salas\/sala-1\/problemas\/prob-1\/relatorio/, async (route) => {
      const url = new URL(route.request().url());
      if (url.searchParams.get('formato') === 'PDF') {
        pdfExportRequested = true;
        capturedPdfParams = Object.fromEntries(url.searchParams.entries());
        await route.fulfill({
          status: 200,
          contentType: 'application/pdf',
          body: mockPdfContent,
        });
        return;
      }
      if (url.searchParams.get('formato') === 'XLSX') {
        excelExportRequested = true;
        await route.fulfill({
          status: 200,
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          body: 'mock-excel-binary-report',
        });
        return;
      }
      await route.fallback();
    });

    await page.goto('/turmas/sala-1/problemas/prob-1/notas');

    const pdfBtn = page.getByRole('button', { name: 'Exportar em PDF' });
    const excelBtn = page.getByRole('button', { name: 'Exportar em Excel' });

    await expect(pdfBtn).toBeVisible();
    await expect(pdfBtn).toBeEnabled();
    await expect(excelBtn).toBeVisible();
    await expect(excelBtn).toBeEnabled();

    // 1. Professor initiates PDF export, opens configuration modal and verifies default options
    await pdfBtn.click();
    const pdfModal = page.getByRole('dialog', { name: /Exportar em PDF/i });
    await expect(pdfModal).toBeVisible();

    // Default configuration: "Nome e Matrícula" and all sections active
    await expect(pdfModal.getByRole('radio', { name: 'Nome e Matrícula' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await expect(pdfModal.getByRole('radio', { name: 'Apenas Matrícula' })).toHaveAttribute(
      'aria-checked',
      'false',
    );
    await expect(pdfModal.getByRole('switch', { name: 'Pendências de avaliação' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await expect(pdfModal.getByRole('switch', { name: 'Marcações das sessões' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await expect(pdfModal.getByRole('switch', { name: 'Feedbacks' })).toHaveAttribute(
      'aria-checked',
      'true',
    );

    const pdfConfirmBtn = pdfModal.getByRole('button', { name: 'Confirmar Exportação' });
    const [pdfDownload] = await Promise.all([page.waitForEvent('download'), pdfConfirmBtn.click()]);

    expect(pdfExportRequested).toBe(true);
    expect(capturedPdfParams.formato).toBe('PDF');
    expect(capturedPdfParams.ocultarNomes).toBe('false');
    expect(capturedPdfParams.mostrarFeedback).toBe('true');
    expect(capturedPdfParams.mostrarPendencias).toBe('true');
    expect(capturedPdfParams.mostrarMarcacoes).toBe('true');
    expect(pdfDownload.suggestedFilename()).toBe('relatorio-problema-problema-1-dor-toracica.pdf');

    // 2. Validate PDF stream and internal document content
    const stream = await pdfDownload.createReadStream();
    expect(stream).not.toBeNull();
    const downloadedPdf = await readStreamToBuffer(stream!);
    expect(downloadedPdf.length).toBeGreaterThan(0);

    const pdfText = new TextDecoder('latin1').decode(downloadedPdf);
    expect(pdfText).toContain('%PDF-');
    expect(pdfText).toContain('Relatorio de Notas - Problema 1: Dor Toracica');
    expect(pdfText).toContain('Turma: MED101 - Medicina 2026.1');
    expect(pdfText).toContain('Ana Silva');
    expect(pdfText).toContain('8.75');
    expect(pdfText).toContain('Bruno Mendes');
    expect(pdfText).toContain('7.00');

    // 3. Attach PDF to Playwright test report for direct inspection
    await testInfo.attach('relatorio-problema-dor-toracica.pdf', {
      body: downloadedPdf,
      contentType: 'application/pdf',
    });

    // 4. Professor visualizes the PDF report in a preview viewer
    const previewPage = await page.context().newPage();
    await previewPage.setContent(`
      <!DOCTYPE html>
      <html lang="pt-BR">
        <head>
          <meta charset="utf-8" />
          <title>Visualização do Relatório - Problema 1</title>
          <style>
            body { margin: 0; padding: 24px; font-family: sans-serif; background: #f8fafc; }
            .header { margin-bottom: 16px; }
            h1 { font-size: 20px; color: #0f172a; margin: 0 0 8px 0; }
            p { font-size: 14px; color: #475569; margin: 0; }
            .viewer-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Relatório do Problema 1 - Dor Torácica</h1>
            <p>Turma: MED101 - Medicina 2026.1 | Professor: Prof. Carlos Santos</p>
          </div>
          <div class="viewer-card">
            <embed
              id="report-pdf-viewer"
              type="application/pdf"
              width="100%"
              height="800px"
              src="data:application/pdf;base64,${btoa(String.fromCharCode(...downloadedPdf))}"
            />
          </div>
        </body>
      </html>
    `);
    const viewer = previewPage.locator('#report-pdf-viewer');
    await expect(viewer).toBeVisible();
    await expect(
      previewPage.getByRole('heading', { name: /Relatório do Problema 1/i }),
    ).toBeVisible();

    const previewScreenshot = await previewPage.screenshot();
    await testInfo.attach('preview-relatorio-pdf.png', {
      body: previewScreenshot,
      contentType: 'image/png',
    });
    await previewPage.close();

    // 5. Professor also exports report in Excel format with configuration modal
    await excelBtn.click();
    const excelModal = page.getByRole('dialog', { name: /Exportar em XLSX/i });
    await expect(excelModal).toBeVisible();

    const excelConfirmBtn = excelModal.getByRole('button', { name: 'Confirmar Exportação' });
    const [excelDownload] = await Promise.all([
      page.waitForEvent('download'),
      excelConfirmBtn.click(),
    ]);

    expect(excelExportRequested).toBe(true);
    expect(excelDownload.suggestedFilename()).toBe(
      'relatorio-problema-problema-1-dor-toracica.xlsx',
    );
  });

  test('should export anonymized PDF report with only registration numbers and disabled sections', async ({
    page,
  }, testInfo) => {
    let capturedPdfParams: Record<string, string> = {};

    await page.route(/\/api\/salas\/sala-1\/problemas\/prob-1\/relatorio/, async (route) => {
      const url = new URL(route.request().url());
      const formato = url.searchParams.get('formato');
      const params = Object.fromEntries(url.searchParams.entries());

      if (formato === 'PDF') {
        capturedPdfParams = params;
        const isAnonymized = params.ocultarNomes === 'true';
        await route.fulfill({
          status: 200,
          contentType: 'application/pdf',
          body: createMockProblemReportPdf({ ocultarNomes: isAnonymized }),
        });
        return;
      }
      await route.fallback();
    });

    await page.goto('/turmas/sala-1/problemas/prob-1/notas');

    const pdfBtn = page.getByRole('button', { name: 'Exportar em PDF' });
    await pdfBtn.click();

    const pdfModal = page.getByRole('dialog', { name: /Exportar em PDF/i });
    await expect(pdfModal).toBeVisible();

    const apenasMatriculaRadio = pdfModal.getByRole('radio', { name: 'Apenas Matrícula' });
    await apenasMatriculaRadio.click();
    await expect(apenasMatriculaRadio).toHaveAttribute('aria-checked', 'true');
    await expect(pdfModal.getByRole('radio', { name: 'Nome e Matrícula' })).toHaveAttribute(
      'aria-checked',
      'false',
    );

    const feedbacksSwitch = pdfModal.getByRole('switch', { name: 'Feedbacks' });
    await feedbacksSwitch.click();
    await expect(feedbacksSwitch).toHaveAttribute('aria-checked', 'false');

    const pendenciasSwitch = pdfModal.getByRole('switch', { name: 'Pendências de avaliação' });
    await pendenciasSwitch.click();
    await expect(pendenciasSwitch).toHaveAttribute('aria-checked', 'false');

    const marcacoesSwitch = pdfModal.getByRole('switch', { name: 'Marcações das sessões' });
    await marcacoesSwitch.click();
    await expect(marcacoesSwitch).toHaveAttribute('aria-checked', 'false');

    const pdfConfirmBtn = pdfModal.getByRole('button', { name: 'Confirmar Exportação' });
    const [pdfDownload] = await Promise.all([page.waitForEvent('download'), pdfConfirmBtn.click()]);

    await expect(pdfModal).not.toBeVisible();

    // Verify query parameters sent to the backend API
    expect(capturedPdfParams.formato).toBe('PDF');
    expect(capturedPdfParams.ocultarNomes).toBe('true');
    expect(capturedPdfParams.mostrarFeedback).toBe('false');
    expect(capturedPdfParams.mostrarPendencias).toBe('false');
    expect(capturedPdfParams.mostrarMarcacoes).toBe('false');
    expect(pdfDownload.suggestedFilename()).toBe('relatorio-problema-problema-1-dor-toracica.pdf');

    // Verify PDF stream: names are omitted while registration numbers and scores are preserved
    const stream = await pdfDownload.createReadStream();
    expect(stream).not.toBeNull();
    const downloadedPdf = await readStreamToBuffer(stream!);
    const pdfText = new TextDecoder('latin1').decode(downloadedPdf);

    expect(pdfText).toContain('%PDF-');
    expect(pdfText).toContain('Matricula: 20260001');
    expect(pdfText).toContain('Matricula: 20260002');
    expect(pdfText).toContain('8.75');
    expect(pdfText).toContain('7.00');
    expect(pdfText).not.toContain('Ana Silva');
    expect(pdfText).not.toContain('Bruno Mendes');

    await testInfo.attach('relatorio-problema-anonimizado.pdf', {
      body: downloadedPdf,
      contentType: 'application/pdf',
    });
  });

  test('should export customized Excel report with only registration numbers and disabled feedbacks', async ({
    page,
  }) => {
    let capturedExcelParams: Record<string, string> = {};

    await page.route(/\/api\/salas\/sala-1\/problemas\/prob-1\/relatorio/, async (route) => {
      const url = new URL(route.request().url());
      const formato = url.searchParams.get('formato');
      const params = Object.fromEntries(url.searchParams.entries());

      if (formato === 'XLSX') {
        capturedExcelParams = params;
        await route.fulfill({
          status: 200,
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          body: 'mock-excel-anonymized-report',
        });
        return;
      }
      await route.fallback();
    });

    await page.goto('/turmas/sala-1/problemas/prob-1/notas');

    const excelBtn = page.getByRole('button', { name: 'Exportar em Excel' });
    await excelBtn.click();

    const excelModal = page.getByRole('dialog', { name: /Exportar em XLSX/i });
    await expect(excelModal).toBeVisible();

    const excelApenasMatricula = excelModal.getByRole('radio', { name: 'Apenas Matrícula' });
    await excelApenasMatricula.click();
    await expect(excelApenasMatricula).toHaveAttribute('aria-checked', 'true');

    const excelFeedbacksSwitch = excelModal.getByRole('switch', { name: 'Feedbacks' });
    await excelFeedbacksSwitch.click();
    await expect(excelFeedbacksSwitch).toHaveAttribute('aria-checked', 'false');

    const excelConfirmBtn = excelModal.getByRole('button', { name: 'Confirmar Exportação' });
    const [excelDownload] = await Promise.all([
      page.waitForEvent('download'),
      excelConfirmBtn.click(),
    ]);

    await expect(excelModal).not.toBeVisible();

    expect(capturedExcelParams.formato).toBe('XLSX');
    expect(capturedExcelParams.ocultarNomes).toBe('true');
    expect(capturedExcelParams.mostrarFeedback).toBe('false');
    expect(capturedExcelParams.mostrarPendencias).toBe('true');
    expect(capturedExcelParams.mostrarMarcacoes).toBe('true');
    expect(excelDownload.suggestedFilename()).toBe(
      'relatorio-problema-problema-1-dor-toracica.xlsx',
    );
  });

  test('should allow canceling export modal without triggering download or API requests', async ({
    page,
  }) => {
    let exportRequested = false;

    await page.route(/\/api\/salas\/sala-1\/problemas\/prob-1\/relatorio/, async (route) => {
      exportRequested = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/pdf',
        body: createMockProblemReportPdf(),
      });
    });

    await page.goto('/turmas/sala-1/problemas/prob-1/notas');

    // 1. Cancel via "Cancelar" button
    const pdfBtn = page.getByRole('button', { name: 'Exportar em PDF' });
    await pdfBtn.click();

    const pdfModal = page.getByRole('dialog', { name: /Exportar em PDF/i });
    await expect(pdfModal).toBeVisible();

    const cancelBtn = pdfModal.getByRole('button', { name: 'Cancelar' });
    await cancelBtn.click();
    await expect(pdfModal).not.toBeVisible();
    expect(exportRequested).toBe(false);

    // 2. Dismiss via Escape key
    const excelBtn = page.getByRole('button', { name: 'Exportar em Excel' });
    await excelBtn.click();

    const excelModal = page.getByRole('dialog', { name: /Exportar em XLSX/i });
    await expect(excelModal).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(excelModal).not.toBeVisible();
    expect(exportRequested).toBe(false);
  });

  test('should allow switching student identification back to full name and re-enabling sections', async ({
    page,
  }) => {
    let capturedParams: Record<string, string> = {};

    await page.route(/\/api\/salas\/sala-1\/problemas\/prob-1\/relatorio/, async (route) => {
      const url = new URL(route.request().url());
      capturedParams = Object.fromEntries(url.searchParams.entries());
      await route.fulfill({
        status: 200,
        contentType: 'application/pdf',
        body: createMockProblemReportPdf(),
      });
    });

    await page.goto('/turmas/sala-1/problemas/prob-1/notas');

    const pdfBtn = page.getByRole('button', { name: 'Exportar em PDF' });
    await pdfBtn.click();

    const pdfModal = page.getByRole('dialog', { name: /Exportar em PDF/i });
    await expect(pdfModal).toBeVisible();

    const apenasMatricula = pdfModal.getByRole('radio', { name: 'Apenas Matrícula' });
    const nomeEMatricula = pdfModal.getByRole('radio', { name: 'Nome e Matrícula' });
    const feedbacksSwitch = pdfModal.getByRole('switch', { name: 'Feedbacks' });

    // Switch to "Apenas Matrícula", then switch back to "Nome e Matrícula"
    await apenasMatricula.click();
    await expect(apenasMatricula).toHaveAttribute('aria-checked', 'true');

    await nomeEMatricula.click();
    await expect(nomeEMatricula).toHaveAttribute('aria-checked', 'true');
    await expect(apenasMatricula).toHaveAttribute('aria-checked', 'false');

    // Toggle Feedbacks off and then back on
    await feedbacksSwitch.click();
    await expect(feedbacksSwitch).toHaveAttribute('aria-checked', 'false');

    await feedbacksSwitch.click();
    await expect(feedbacksSwitch).toHaveAttribute('aria-checked', 'true');

    const confirmBtn = pdfModal.getByRole('button', { name: 'Confirmar Exportação' });
    await Promise.all([page.waitForEvent('download'), confirmBtn.click()]);

    expect(capturedParams.ocultarNomes).toBe('false');
    expect(capturedParams.mostrarFeedback).toBe('true');
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
