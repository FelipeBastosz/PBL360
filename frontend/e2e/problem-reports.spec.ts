import { test, expect, type Page } from '@playwright/test';
import { loginAsTeacher, openSeedProblem, skipIfBackendUnavailable } from './helpers/fullstack';

test.describe('E2E Full-Stack: relatório do problema, anonimização e exportação', () => {
  test.beforeEach(async () => {
    await skipIfBackendUnavailable();
  });

  test('alterna a identificação dos estudantes e baixa relatórios PDF e XLSX', async ({ page }) => {
    await loginAsTeacher(page);
    await openSeedProblem(page);
    const problemRoute = new URL(page.url()).pathname.match(
      /^\/turmas\/([^/]+)\/problemas\/([^/]+)$/,
    );
    expect(problemRoute).not.toBeNull();
    await page.goto(`/turmas/${problemRoute![1]}/problemas/${problemRoute![2]}/notas`);
    await expect(page).toHaveURL(/\/turmas\/[^/]+\/problemas\/[^/]+\/notas$/);

    const gradesTable = page.getByRole('table');
    await expect(gradesTable.getByRole('columnheader', { name: 'ALUNO' })).toBeVisible();
    await expect(gradesTable.getByText('Ana Souza')).toBeVisible();

    const hideNames = page.getByRole('switch', { name: 'Ocultar nomes' });
    await hideNames.click();
    await expect(hideNames).toHaveAttribute('aria-checked', 'true');
    await expect(gradesTable.getByRole('columnheader', { name: 'MATRÍCULA' })).toBeVisible();
    await expect(gradesTable.getByText('20240001')).toBeVisible();
    await expect(gradesTable.getByText('Ana Souza')).toHaveCount(0);

    await hideNames.click();
    await expect(hideNames).toHaveAttribute('aria-checked', 'false');
    await expect(gradesTable.getByText('Ana Souza')).toBeVisible();

    await downloadReport(page, 'PDF', '.pdf');
    await downloadReport(page, 'Excel', '.xlsx');
  });
});

async function downloadReport(page: Page, format: 'PDF' | 'Excel', extension: '.pdf' | '.xlsx') {
  await page.getByRole('button', { name: `Exportar em ${format}` }).click();
  const dialogTitle = format === 'Excel' ? 'Exportar em XLSX' : 'Exportar em PDF';
  const dialog = page.getByRole('dialog', { name: dialogTitle });
  await expect(dialog).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await dialog.getByRole('button', { name: 'Confirmar Exportação' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(new RegExp(`${extension.replace('.', '\\.')}$`));
  expect(await download.failure()).toBeNull();
}
