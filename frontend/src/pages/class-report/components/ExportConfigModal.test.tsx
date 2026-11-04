import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ExportConfigModal } from './ExportConfigModal';

describe('ExportConfigModal', () => {
  it('renders modal with correct title for format', () => {
    render(<ExportConfigModal isOpen={true} format="PDF" onClose={vi.fn()} onConfirm={vi.fn()} />);

    expect(screen.getByText('Exportar em PDF')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Nome e Matrícula' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Apenas Matrícula' })).toBeInTheDocument();
  });

  it('submits default configuration with ocultarNomes: false', async () => {
    const user = userEvent.setup();
    const handleConfirm = vi.fn();

    render(
      <ExportConfigModal isOpen={true} format="XLSX" onClose={vi.fn()} onConfirm={handleConfirm} />,
    );

    await user.click(screen.getByRole('button', { name: 'Confirmar Exportação' }));

    expect(handleConfirm).toHaveBeenCalledWith({ ocultarNomes: false });
  });

  it('submits configuration with ocultarNomes: true when "Apenas Matrícula" is selected', async () => {
    const user = userEvent.setup();
    const handleConfirm = vi.fn();

    render(
      <ExportConfigModal isOpen={true} format="PDF" onClose={vi.fn()} onConfirm={handleConfirm} />,
    );

    await user.click(screen.getByRole('radio', { name: 'Apenas Matrícula' }));
    await user.click(screen.getByRole('button', { name: 'Confirmar Exportação' }));

    expect(handleConfirm).toHaveBeenCalledWith({ ocultarNomes: true });
  });

  it('calls onClose when clicking Cancel button', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();

    render(
      <ExportConfigModal isOpen={true} format="PDF" onClose={handleClose} onConfirm={vi.fn()} />,
    );

    await user.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('disables buttons when loading', () => {
    render(
      <ExportConfigModal
        isOpen={true}
        format="PDF"
        isLoading={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Confirmar Exportação' })).toBeDisabled();
  });
});
