import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { LegalDocumentModal } from './LegalDocumentModal';

describe('LegalDocumentModal', () => {
  it('does not render when isOpen is false', () => {
    render(
      <LegalDocumentModal
        isOpen={false}
        title="Termos de Uso"
        content="Conteúdo de teste"
        onClose={vi.fn()}
      />,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders title and content when open', () => {
    render(
      <LegalDocumentModal
        isOpen={true}
        title="Termos de Uso"
        content="Termos e Politica em desenvolvimento"
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Termos de Uso' })).toBeInTheDocument();
    expect(screen.getByText('Termos e Politica em desenvolvimento')).toBeInTheDocument();
  });

  it('renders custom children when provided', () => {
    render(
      <LegalDocumentModal isOpen={true} title="Conteúdo Customizado" onClose={vi.fn()}>
        <span data-testid="custom-child">Filho customizado</span>
      </LegalDocumentModal>,
    );

    expect(screen.getByTestId('custom-child')).toBeInTheDocument();
  });

  it('calls onClose when close icon or Fechar button is clicked', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();

    render(
      <LegalDocumentModal
        isOpen={true}
        title="Política de Privacidade"
        content="Conteúdo de teste"
        onClose={handleClose}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Fechar' }));
    expect(handleClose).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: /fechar política de privacidade/i }));
    expect(handleClose).toHaveBeenCalledTimes(2);
  });
});
