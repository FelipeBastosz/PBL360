import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AdditionalInfoModal } from './AdditionalInfoModal';

describe('AdditionalInfoModal', () => {
  it('does not render when isOpen is false', () => {
    render(<AdditionalInfoModal isOpen={false} onClose={vi.fn()} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders centered logo and legal links when open', () => {
    render(<AdditionalInfoModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText('PBL360')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Termos de Uso' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Política de Privacidade' })).toBeInTheDocument();
  });

  it('opens terms of use modal when clicking the terms link', async () => {
    const user = userEvent.setup();
    render(<AdditionalInfoModal isOpen={true} onClose={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Termos de Uso' }));

    expect(screen.getByRole('heading', { name: 'Termos de Uso' })).toBeInTheDocument();
    expect(screen.getByText('Termos e Politica em desenvolvimento')).toBeInTheDocument();
  });

  it('opens privacy policy modal when clicking the privacy link', async () => {
    const user = userEvent.setup();
    render(<AdditionalInfoModal isOpen={true} onClose={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Política de Privacidade' }));

    expect(screen.getByRole('heading', { name: 'Política de Privacidade' })).toBeInTheDocument();
    expect(screen.getByText('Termos e Politica em desenvolvimento')).toBeInTheDocument();
  });

  it('calls onClose when close icon is clicked', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();
    render(<AdditionalInfoModal isOpen={true} onClose={handleClose} />);

    await user.click(screen.getByRole('button', { name: /fechar informações adicionais/i }));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
