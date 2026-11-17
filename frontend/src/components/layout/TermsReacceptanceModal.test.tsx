import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { commitmentTermsService } from '@/services/commitmentTerms.service';
import { TermsReacceptanceModal } from './TermsReacceptanceModal';

vi.mock('@/services/commitmentTerms.service');

describe('TermsReacceptanceModal', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(commitmentTermsService.getCurrentTerm).mockResolvedValue({
      versao: '1.2',
      titulo: 'Termos de Uso e Política de Privacidade – PBL360',
      texto: '# Termos de Uso e Política de Privacidade – PBL360',
    });
  });

  it('renders notice with previous and current versions, disabled submit button', () => {
    render(
      <TermsReacceptanceModal
        isOpen={true}
        currentVersion="1.2"
        previousVersion="1.1"
        onAccepted={vi.fn()}
        onLogout={vi.fn()}
      />,
    );

    expect(
      screen.getByRole('heading', {
        name: 'Atualização dos Termos de Uso e Política de Privacidade',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/sua versão anterior: v1.1/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirmar' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Sair da conta' })).toBeEnabled();
  });

  it('calls onLogout when clicking Sair da conta', async () => {
    const user = userEvent.setup();
    const handleLogout = vi.fn();

    render(
      <TermsReacceptanceModal
        isOpen={true}
        currentVersion="1.2"
        previousVersion="1.1"
        onAccepted={vi.fn()}
        onLogout={handleLogout}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Sair da conta' }));
    expect(handleLogout).toHaveBeenCalledTimes(1);
  });

  it('enables submit button after checking agreement and calls acceptTerm on confirm', async () => {
    const user = userEvent.setup();
    const handleAccepted = vi.fn();
    vi.mocked(commitmentTermsService.acceptTerm).mockResolvedValueOnce({
      aceito: true,
      versaoAceita: '1.2',
      aceitoEm: '2026-11-17T12:00:00.000Z',
      versaoVigente: '1.2',
    });

    render(
      <TermsReacceptanceModal
        isOpen={true}
        currentVersion="1.2"
        previousVersion="1.1"
        onAccepted={handleAccepted}
        onLogout={vi.fn()}
      />,
    );

    const submitButton = screen.getByRole('button', { name: 'Confirmar' });
    expect(submitButton).toBeDisabled();

    const checkbox = screen.getByRole('checkbox', {
      name: /eu li e concordo com os termos de uso e política de privacidade atualizados/i,
    });
    await user.click(checkbox);
    expect(checkbox).toBeChecked();
    expect(submitButton).toBeEnabled();

    await user.click(submitButton);

    expect(commitmentTermsService.acceptTerm).toHaveBeenCalledWith('1.2');
    expect(handleAccepted).toHaveBeenCalledTimes(1);
  });

  it('displays error message if acceptTerm fails', async () => {
    const user = userEvent.setup();
    vi.mocked(commitmentTermsService.acceptTerm).mockRejectedValueOnce(new Error('Network error'));

    render(
      <TermsReacceptanceModal
        isOpen={true}
        currentVersion="1.2"
        previousVersion={null}
        onAccepted={vi.fn()}
        onLogout={vi.fn()}
      />,
    );

    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);
    await user.click(screen.getByRole('button', { name: 'Confirmar' }));

    expect(
      await screen.findByText('Não foi possível registrar o aceite. Tente novamente.'),
    ).toBeInTheDocument();
  });
});
