import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ProblemExportModal } from './ExportConfigModal';

describe('ProblemExportModal', () => {
  it('renders modal with defaults and triggers onConfirm with default options', () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();

    render(
      <ProblemExportModal isOpen={true} format="PDF" onClose={onClose} onConfirm={onConfirm} />,
    );

    expect(screen.getByText('Exportar em PDF')).toBeInTheDocument();
    expect(screen.getByText('Nome e Matrícula')).toBeInTheDocument();
    expect(screen.getByText('Apenas Matrícula')).toBeInTheDocument();
    expect(screen.getByLabelText('Pendências de avaliação')).toBeInTheDocument();
    expect(screen.getByLabelText('Marcações das sessões')).toBeInTheDocument();
    expect(screen.getByLabelText('Feedbacks')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar Exportação' }));

    expect(onConfirm).toHaveBeenCalledWith({
      ocultarNomes: false,
      mostrarPendencias: true,
      mostrarMarcacoes: true,
      mostrarFeedback: true,
    });
  });

  it('allows selecting "Apenas Matrícula" and disabling sections', () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();

    render(
      <ProblemExportModal isOpen={true} format="XLSX" onClose={onClose} onConfirm={onConfirm} />,
    );

    fireEvent.click(screen.getByText('Apenas Matrícula'));
    fireEvent.click(screen.getByLabelText('Pendências de avaliação'));
    fireEvent.click(screen.getByLabelText('Marcações das sessões'));
    fireEvent.click(screen.getByLabelText('Feedbacks'));

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar Exportação' }));

    expect(onConfirm).toHaveBeenCalledWith({
      ocultarNomes: true,
      mostrarPendencias: false,
      mostrarMarcacoes: false,
      mostrarFeedback: false,
    });
  });

  it('calls onClose when Cancelar is clicked', () => {
    const onClose = vi.fn();

    render(<ProblemExportModal isOpen={true} format="PDF" onClose={onClose} onConfirm={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
