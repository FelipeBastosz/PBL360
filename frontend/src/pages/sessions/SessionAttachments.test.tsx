import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider } from '@/contexts/ToastProvider';
import { sessionService } from '@/services/session.service';
import type { SessionAttachment } from '@/types/session';
import { SessionAttachments } from './SessionAttachments';

vi.mock('@/services/session.service');

const attachment = (id: string, nomeArquivo: string, minutesAgo = 120): SessionAttachment => ({
  id,
  nomeArquivo,
  tipo: 'application/pdf',
  tamanho: 1024,
  enviadoPor: { id: 'u1', nome: 'João Pedro' },
  enviadoEm: new Date(Date.now() - minutesAgo * 60_000).toISOString(),
});

function renderAttachments(canUpload = true) {
  return render(
    <ToastProvider>
      <SessionAttachments sessionId="s1" canUpload={canUpload} />
    </ToastProvider>,
  );
}

const pick = (file: File) =>
  fireEvent.change(screen.getByLabelText('Documento PDF'), { target: { files: [file] } });

describe('SessionAttachments', () => {
  beforeEach(() => {
    vi.mocked(sessionService.listAttachments).mockResolvedValue([
      attachment('a1', 'Relatório_Parcial_Fase1.pdf'),
    ]);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('lists the attachments with who sent them and when', async () => {
    renderAttachments();

    expect(await screen.findByText('Relatório_Parcial_Fase1.pdf')).toBeInTheDocument();
    expect(screen.getByText('Enviado por João • Há 2 horas')).toBeInTheDocument();
    expect(screen.getByText('1 arquivo')).toBeInTheDocument();
  });

  it('uploads a PDF and shows it at the top of the list', async () => {
    vi.mocked(sessionService.uploadAttachment).mockResolvedValue(
      attachment('a2', 'Pesquisa.pdf', 0),
    );
    renderAttachments();
    await screen.findByText('Relatório_Parcial_Fase1.pdf');
    const file = new File(['%PDF-1.7'], 'Pesquisa.pdf', { type: 'application/pdf' });

    pick(file);

    expect(await screen.findByText('Documento anexado.')).toBeInTheDocument();
    expect(sessionService.uploadAttachment).toHaveBeenCalledWith('s1', file);
    expect(screen.getAllByRole('listitem')[0]).toHaveTextContent('Pesquisa.pdf');
    expect(screen.getByText('2 arquivos')).toBeInTheDocument();
  });

  it('refuses a file that is not a PDF without calling the API', async () => {
    renderAttachments();
    await screen.findByText('Relatório_Parcial_Fase1.pdf');

    pick(new File(['docx'], 'trabalho.docx', { type: 'application/vnd.openxmlformats' }));

    expect(await screen.findByText('Envie um arquivo PDF.')).toBeInTheDocument();
    expect(sessionService.uploadAttachment).not.toHaveBeenCalled();
  });

  it('refuses a PDF above 10 MB without calling the API', async () => {
    renderAttachments();
    await screen.findByText('Relatório_Parcial_Fase1.pdf');
    const big = new File(['%PDF'], 'grande.pdf', { type: 'application/pdf' });
    Object.defineProperty(big, 'size', { value: 10 * 1024 * 1024 + 1 });

    pick(big);

    expect(await screen.findByText('O arquivo deve ter no máximo 10 MB.')).toBeInTheDocument();
    expect(sessionService.uploadAttachment).not.toHaveBeenCalled();
  });

  it('downloads an attachment with its file name', async () => {
    vi.mocked(sessionService.downloadAttachment).mockResolvedValue(new Blob(['%PDF']));
    URL.createObjectURL = vi.fn(() => 'blob:anexo');
    URL.revokeObjectURL = vi.fn();
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined);
    renderAttachments(false);

    fireEvent.click(
      await screen.findByRole('button', { name: 'Baixar Relatório_Parcial_Fase1.pdf' }),
    );

    await waitFor(() => expect(click).toHaveBeenCalled());
    expect(sessionService.downloadAttachment).toHaveBeenCalledWith('s1', 'a1');
    expect(screen.queryByRole('button', { name: /Adicionar Documento/ })).not.toBeInTheDocument();
    click.mockRestore();
  });
});
