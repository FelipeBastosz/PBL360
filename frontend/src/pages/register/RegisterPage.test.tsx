import { fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/services/apiError';
import { authService } from '@/services/auth.service';
import { renderApp, studentUser } from '@/testing/renderApp';

vi.mock('@/services/auth.service');

afterEach(() => {
  vi.resetAllMocks();
});

type User = ReturnType<typeof renderApp>['user'];

const photo = new File(['png'], 'ana.png', { type: 'image/png' });

const registered = {
  mensagem: 'Cadastro realizado.',
  usuarioId: studentUser.id,
  usuario: { ...studentUser, ativo: false },
};

async function fillCommonFields(user: User, email: string) {
  await user.type(await screen.findByLabelText('Nome completo'), 'Ana Souza');
  await user.type(screen.getByLabelText('Email Institucional'), email);
  await user.type(screen.getByLabelText('Senha'), 'senha-secreta');
  await user.type(screen.getByLabelText('Confirmar a Senha'), 'senha-secreta');
}

describe('RegisterPage', () => {
  it('names the profile being registered in the header', async () => {
    renderApp('/cadastro?perfil=professor');

    expect(await screen.findByRole('heading', { name: 'Criar conta' })).toBeInTheDocument();
    expect(screen.getByText('Cadastro de professor')).toBeInTheDocument();
  });

  it('marks registration number and photo as optional only for professors', async () => {
    renderApp('/cadastro?perfil=professor');

    expect(await screen.findByLabelText('Matrícula (opcional)')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Adicionar foto de perfil (opcional)' }),
    ).toBeInTheDocument();
  });

  it('asks students for registration number and photo', async () => {
    renderApp('/cadastro?perfil=aluno');

    expect(await screen.findByLabelText('Matrícula')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Adicionar foto de perfil' })).toBeInTheDocument();
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
    vi.mocked(authService.register).mockResolvedValue(registered);
    const { user } = renderApp('/cadastro?perfil=aluno');

    await fillCommonFields(user, 'ana@discente.uefs.br');
    await user.type(screen.getByLabelText('Matrícula'), '2024a0001');
    await user.upload(screen.getByLabelText('Foto de perfil'), photo);
    await user.click(screen.getByRole('button', { name: 'Criar conta' }));

    expect(await screen.findByRole('heading', { name: 'Confirmar e-mail' })).toBeInTheDocument();
    expect(authService.register).toHaveBeenCalledWith({
      nome: 'Ana Souza',
      email: 'ana@discente.uefs.br',
      senha: 'senha-secreta',
      tipo: 'ALUNO',
      matricula: '20240001',
      foto: photo,
    });
    expect(screen.getByText(/enviado para ana@discente\.uefs\.br/)).toBeInTheDocument();
  });

  it('registers a professor without registration number nor photo', async () => {
    vi.mocked(authService.register).mockResolvedValue(registered);
    const { user } = renderApp('/cadastro?perfil=professor');

    await fillCommonFields(user, 'carlos@uefs.br');
    await user.click(screen.getByRole('button', { name: 'Criar conta' }));

    expect(await screen.findByRole('heading', { name: 'Confirmar e-mail' })).toBeInTheDocument();
    expect(authService.register).toHaveBeenCalledWith({
      nome: 'Ana Souza',
      email: 'carlos@uefs.br',
      senha: 'senha-secreta',
      tipo: 'PROFESSOR',
    });
  });

  it('sends the optional registration number and photo of a professor', async () => {
    vi.mocked(authService.register).mockResolvedValue(registered);
    const { user } = renderApp('/cadastro?perfil=professor');

    await fillCommonFields(user, 'carlos@uefs.br');
    await user.type(screen.getByLabelText('Matrícula (opcional)'), '19990001');
    await user.upload(screen.getByLabelText('Foto de perfil'), photo);
    await user.click(screen.getByRole('button', { name: 'Criar conta' }));

    await screen.findByRole('heading', { name: 'Confirmar e-mail' });
    expect(authService.register).toHaveBeenCalledWith(
      expect.objectContaining({ matricula: '19990001', foto: photo }),
    );
  });

  it('still validates a registration number a professor chose to fill', async () => {
    const { user } = renderApp('/cadastro?perfil=professor');

    await fillCommonFields(user, 'carlos@uefs.br');
    await user.type(screen.getByLabelText('Matrícula (opcional)'), '1999');
    await user.click(screen.getByRole('button', { name: 'Criar conta' }));

    expect(screen.getByText('A matrícula deve conter exatamente 8 dígitos.')).toBeInTheDocument();
    expect(authService.register).not.toHaveBeenCalled();
  });

  it('previews the chosen photo and lets the student replace it', async () => {
    const { user } = renderApp('/cadastro?perfil=aluno');

    await user.upload(await screen.findByLabelText('Foto de perfil'), photo);

    const button = await screen.findByRole('button', { name: 'Trocar foto de perfil' });

    await waitFor(() =>
      expect(button.querySelector('img')).toHaveAttribute('src', expect.stringMatching(/^data:/)),
    );
  });

  it('asks the student for a photo before submitting', async () => {
    const { user } = renderApp('/cadastro?perfil=aluno');

    await fillCommonFields(user, 'ana@discente.uefs.br');
    await user.type(screen.getByLabelText('Matrícula'), '20240001');
    await user.click(screen.getByRole('button', { name: 'Criar conta' }));

    expect(screen.getByText('Envie uma foto sua.')).toBeInTheDocument();
    expect(authService.register).not.toHaveBeenCalled();
  });

  it('refuses a photo in an unsupported format', async () => {
    const { user } = renderApp('/cadastro?perfil=aluno');
    const svg = new File(['<svg/>'], 'ana.svg', { type: 'image/svg+xml' });

    await fillCommonFields(user, 'ana@discente.uefs.br');
    await user.type(screen.getByLabelText('Matrícula'), '20240001');
    fireEvent.change(screen.getByLabelText('Foto de perfil'), { target: { files: [svg] } });
    await user.click(screen.getByRole('button', { name: 'Criar conta' }));

    expect(screen.getByText('A foto deve ser uma imagem JPEG, PNG ou WebP.')).toBeInTheDocument();
    expect(authService.register).not.toHaveBeenCalled();
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
