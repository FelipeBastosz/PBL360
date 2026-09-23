import { screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/services/apiError';
import { authService } from '@/services/auth.service';
import { renderApp, studentUser } from '@/testing/renderApp';

vi.mock('@/services/auth.service');

afterEach(() => {
  vi.resetAllMocks();
});

type User = ReturnType<typeof renderApp>['user'];

async function fillCommonFields(user: User, email: string) {
  await user.type(await screen.findByLabelText('Nome completo'), 'Ana Souza');
  await user.type(screen.getByLabelText('Email Institucional'), email);
  await user.type(screen.getByLabelText('Senha'), 'senha-secreta');
  await user.type(screen.getByLabelText('Confirmar Senha'), 'senha-secreta');
}

describe('RegisterPage', () => {
  it('asks students for registration number and photo, but not professors', async () => {
    const { user } = renderApp('/cadastro?perfil=aluno');

    expect(await screen.findByLabelText('Matrícula')).toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: 'Professor' }));

    expect(screen.queryByLabelText('Matrícula')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Link da foto')).not.toBeInTheDocument();
  });

  it('blocks a non-institutional e-mail', async () => {
    const { user } = renderApp('/cadastro?perfil=professor');

    await fillCommonFields(user, 'ana@gmail.com');
    await user.click(screen.getByRole('button', { name: 'Criar conta' }));

    expect(
      screen.getByText('Use seu e-mail institucional (@uefs.br ou @discente.uefs.br).'),
    ).toBeInTheDocument();
    expect(authService.register).not.toHaveBeenCalled();
  });

  it('registers a student and moves on to the e-mail confirmation', async () => {
    vi.mocked(authService.register).mockResolvedValue({
      mensagem: 'Cadastro realizado.',
      usuarioId: studentUser.id,
      usuario: { ...studentUser, ativo: false },
    });
    const { user } = renderApp('/cadastro?perfil=aluno');

    await fillCommonFields(user, 'ana@discente.uefs.br');
    await user.type(screen.getByLabelText('Matrícula'), '2024a0001');
    await user.type(screen.getByLabelText('Link da foto'), 'https://example.com/ana.png');
    await user.click(screen.getByRole('button', { name: 'Criar conta' }));

    expect(await screen.findByRole('heading', { name: 'Confirmar e-mail' })).toBeInTheDocument();
    expect(authService.register).toHaveBeenCalledWith({
      nome: 'Ana Souza',
      email: 'ana@discente.uefs.br',
      senha: 'senha-secreta',
      tipo: 'ALUNO',
      matricula: '20240001',
      fotoUrl: 'https://example.com/ana.png',
    });
    expect(screen.getByText(/enviado para ana@discente\.uefs\.br/)).toBeInTheDocument();
  });

  it('shows the API conflict message', async () => {
    vi.mocked(authService.register).mockRejectedValue(
      new ApiError(409, ['Já existe uma conta cadastrada com este e-mail.']),
    );
    const { user } = renderApp('/cadastro?perfil=professor');

    await fillCommonFields(user, 'carlos@uefs.br');
    await user.click(screen.getByRole('button', { name: 'Criar conta' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Já existe uma conta cadastrada com este e-mail.',
    );
  });
});
