import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AdditionalInfoModal } from './AdditionalInfoModal';
import { TEAM_MEMBERS } from '@/content/projectInfo';

describe('AdditionalInfoModal', () => {
  it('does not render when isOpen is false', () => {
    render(<AdditionalInfoModal isOpen={false} onClose={vi.fn()} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders centered logo and all links when open', () => {
    render(<AdditionalInfoModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText('PBL360')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sobre o Projeto' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Desenvolvedores' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Termos de Uso e Política de Privacidade' }),
    ).toBeInTheDocument();
  });

  it('opens about project modal with summary and course details', async () => {
    const user = userEvent.setup();
    render(<AdditionalInfoModal isOpen={true} onClose={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Sobre o Projeto' }));

    expect(screen.getByRole('heading', { name: 'Sobre o Projeto' })).toBeInTheDocument();
    expect(
      screen.getByText(/Desenvolvido na matéria de MI de Engenharia de Software - EXA613/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/professora Larissa Rocha Soares Bastos/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'contato.pbl360@gmail.com' })).toHaveAttribute(
      'href',
      'mailto:contato.pbl360@gmail.com',
    );
  });

  it('opens team members modal with members in alphabetical order', async () => {
    const user = userEvent.setup();
    render(<AdditionalInfoModal isOpen={true} onClose={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Desenvolvedores' }));

    expect(screen.getByRole('heading', { name: 'Desenvolvedores' })).toBeInTheDocument();
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(TEAM_MEMBERS.length);

    TEAM_MEMBERS.forEach((member, index) => {
      expect(links[index].textContent?.trim()).toBe(member.name);
      expect(links[index]).toHaveAttribute('href', member.github);
      expect(links[index]).toHaveAttribute('target', '_blank');
    });
  });

  it('opens unified terms of use and privacy policy modal with contact email', async () => {
    const user = userEvent.setup();
    render(<AdditionalInfoModal isOpen={true} onClose={vi.fn()} />);

    await user.click(
      screen.getByRole('button', { name: 'Termos de Uso e Política de Privacidade' }),
    );
    expect(
      screen.getByRole('heading', { name: 'Termos de Uso e Política de Privacidade' }),
    ).toBeInTheDocument();
    expect(await screen.findByText(/contato\.pbl360@gmail\.com/i)).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: /contato\.pbl360@gmail\.com/i }),
    ).not.toBeInTheDocument();
  });

  it('calls onClose when close icon is clicked', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();
    render(<AdditionalInfoModal isOpen={true} onClose={handleClose} />);

    await user.click(screen.getByRole('button', { name: /fechar informações adicionais/i }));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
