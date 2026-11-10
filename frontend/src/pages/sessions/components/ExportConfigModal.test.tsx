import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ExportConfigModal } from './ExportConfigModal';

describe('ExportConfigModal', () => {
  it('renders with default configuration and format title', () => {
    render(<ExportConfigModal isOpen onClose={vi.fn()} onConfirm={vi.fn()} format="PDF" />);

    expect(screen.getByRole('heading', { level: 2, name: 'Exportar em PDF' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Nome e Matrícula' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    expect(screen.getByRole('radio', { name: 'Apenas Matrícula' })).toHaveAttribute(
      'aria-checked',
      'false',
    );
    expect(screen.getByRole('switch', { name: 'Feedbacks individuais' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    expect(screen.getByRole('switch', { name: 'Marcações da sessão' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });

  it('calls onConfirm with default options when confirmed immediately', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<ExportConfigModal isOpen onClose={vi.fn()} onConfirm={onConfirm} format="PDF" />);

    await user.click(screen.getByRole('button', { name: 'Confirmar Exportação' }));

    expect(onConfirm).toHaveBeenCalledWith({
      ocultarNome: false,
      mostrarFeedBack: true,
      mostrarMarcacoes: true,
    });
  });

  it('allows selecting Apenas Matrícula and toggling sections off', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<ExportConfigModal isOpen onClose={vi.fn()} onConfirm={onConfirm} format="XLSX" />);

    await user.click(screen.getByRole('radio', { name: 'Apenas Matrícula' }));
    await user.click(screen.getByRole('switch', { name: 'Feedbacks individuais' }));
    await user.click(screen.getByRole('switch', { name: 'Marcações da sessão' }));

    await user.click(screen.getByRole('button', { name: 'Confirmar Exportação' }));

    expect(onConfirm).toHaveBeenCalledWith({
      ocultarNome: true,
      mostrarFeedBack: false,
      mostrarMarcacoes: false,
    });
  });

  it('calls onClose when clicking Cancelar or X button', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<ExportConfigModal isOpen onClose={onClose} onConfirm={vi.fn()} format="PDF" />);

    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onClose).toHaveBeenCalledOnce();

    await user.click(screen.getByRole('button', { name: 'Fechar' }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('disables actions when isLoading is true', () => {
    render(
      <ExportConfigModal isOpen onClose={vi.fn()} onConfirm={vi.fn()} format="PDF" isLoading />,
    );

    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Confirmar Exportação' })).toBeDisabled();
    expect(screen.getByRole('switch', { name: 'Feedbacks individuais' })).toBeDisabled();
    expect(screen.getByRole('switch', { name: 'Marcações da sessão' })).toBeDisabled();
  });
});
