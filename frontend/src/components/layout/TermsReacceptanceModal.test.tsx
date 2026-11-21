import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/services/apiError';
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

  it('renders notice with previous and current versions, disabled submit button', async () => {
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
    await waitFor(() => expect(commitmentTermsService.getCurrentTerm).toHaveBeenCalledTimes(1));
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

  it('reloads current term, unchecks agreement and shows updated text on 409 conflict', async () => {
    const user = userEvent.setup();
    const handleAccepted = vi.fn();
    vi.mocked(commitmentTermsService.getCurrentTerm)
      .mockResolvedValueOnce({
        versao: '1.2',
        titulo: 'Termos v1.2',
        texto: '### 1. Regras v1.2\n\nConteúdo antigo da versão 1.2.',
      })
      .mockResolvedValueOnce({
        versao: '1.3',
        titulo: 'Termos v1.3',
        texto: '### 1. Regras v1.3\n\nConteúdo atualizado da versão 1.3.',
      });
    vi.mocked(commitmentTermsService.acceptTerm)
      .mockRejectedValueOnce(new ApiError(409, ['Versão desatualizada.']))
      .mockResolvedValueOnce({
        aceito: true,
        versaoAceita: '1.3',
        aceitoEm: '2026-11-18T12:00:00.000Z',
        versaoVigente: '1.3',
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

    expect(await screen.findByText(/conteúdo antigo da versão 1\.2/i)).toBeInTheDocument();
    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);
    await user.click(screen.getByRole('button', { name: 'Confirmar' }));

    expect(
      await screen.findByText(
        /uma nova versão dos termos de uso e política de privacidade entrou em vigor/i,
      ),
    ).toBeInTheDocument();
    expect(await screen.findByText(/conteúdo atualizado da versão 1\.3/i)).toBeInTheDocument();
    expect(screen.getByText(/versão 1\.3/i, { selector: 'strong' })).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();

    await user.click(checkbox);
    await user.click(screen.getByRole('button', { name: 'Confirmar' }));

    expect(commitmentTermsService.acceptTerm).toHaveBeenLastCalledWith('1.3');
    expect(handleAccepted).toHaveBeenCalledTimes(1);
  });

  it('blocks confirmation without static fallback when loading current term fails and allows retry', async () => {
    const user = userEvent.setup();
    vi.mocked(commitmentTermsService.getCurrentTerm)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        versao: '1.2',
        titulo: 'Termos v1.2',
        texto: '### 1. Regras\n\nDocumento vigente carregado após tentativa.',
      });

    render(
      <TermsReacceptanceModal
        isOpen={true}
        currentVersion="1.2"
        previousVersion={null}
        onAccepted={vi.fn()}
        onLogout={vi.fn()}
      />,
    );

    expect(
      await screen.findByText(
        /não foi possível carregar os termos de uso e política de privacidade/i,
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/aplicação web experimental/i)).not.toBeInTheDocument();

    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);
    expect(screen.getByRole('button', { name: 'Confirmar' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    expect(
      await screen.findByText(/documento vigente carregado após tentativa/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirmar' })).toBeEnabled();
  });
});
