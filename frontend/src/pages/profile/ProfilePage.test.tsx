import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { userService } from '@/services/user.service';
import { AuthContext } from '@/contexts/authContext';
import ProfilePage from './ProfilePage';
import type { UserProfileResponse } from '@/types/user';
import type { UserResponse } from '@/types/auth';

vi.mock('@/services/user.service', () => ({
  userService: {
    getProfile: vi.fn(),
    updateProfile: vi.fn(),
    uploadPhoto: vi.fn(),
    deletePhoto: vi.fn(),
    getPhoto: vi.fn(),
  },
}));

vi.mock('@/hooks/useUserPhoto', () => ({
  useUserPhoto: vi.fn(() => null),
  clearUserPhotoCache: vi.fn(),
}));

const mockStudentProfile: UserProfileResponse = {
  id: 'user-1',
  nome: 'Aluno Teste',
  email: 'aluno@discente.uefs.br',
  tipo: 'ALUNO',
  matricula: '20241001',
  possuiFoto: false,
};

const mockTutorProfile: UserProfileResponse = {
  id: 'user-2',
  nome: 'Professor Teste',
  email: 'professor@uefs.br',
  tipo: 'PROFESSOR',
  matricula: null,
  possuiFoto: true,
};

const mockUser: UserResponse = {
  id: 'user-1',
  nome: 'Aluno Teste',
  email: 'aluno@discente.uefs.br',
  tipo: 'ALUNO',
  matricula: '20241001',
  possuiFoto: false,
  ativo: true,
  criadoEm: '2026-01-01',
};

function renderProfilePage(profileData = mockStudentProfile) {
  vi.mocked(userService.getProfile).mockResolvedValue(profileData);
  const updateUserMock = vi.fn();

  render(
    <AuthContext.Provider
      value={{
        user: mockUser,
        isAuthenticated: true,
        login: vi.fn(),
        logout: vi.fn(),
        updateUser: updateUserMock,
      }}
    >
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>
    </AuthContext.Provider>,
  );

  return { updateUserMock };
}

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders student profile data with read-only email and matricula', async () => {
    renderProfilePage(mockStudentProfile);

    expect(await screen.findByText('Aluno Teste')).toBeInTheDocument();
    expect(screen.getByText('aluno@discente.uefs.br')).toBeInTheDocument();
    expect(screen.getByText('20241001')).toBeInTheDocument();
    expect(screen.getAllByText('Apenas para consulta.')).toHaveLength(2);
    expect(screen.getByText('Aluno')).toBeInTheDocument();
    expect(screen.getByText('Adicionar foto')).toBeInTheDocument();
  });

  it('renders tutor profile without matricula field', async () => {
    renderProfilePage(mockTutorProfile);

    expect(await screen.findByText('Professor Teste')).toBeInTheDocument();
    expect(screen.getByText('professor@uefs.br')).toBeInTheDocument();
    expect(screen.queryByText('Matrícula')).not.toBeInTheDocument();
    expect(screen.getByText('Professor')).toBeInTheDocument();
    expect(screen.getByText('Alterar foto')).toBeInTheDocument();
    expect(screen.getByText('Remover')).toBeInTheDocument();
  });

  it('allows editing name with validation and cancellation', async () => {
    const user = userEvent.setup();
    renderProfilePage(mockStudentProfile);

    const editButton = await screen.findByRole('button', { name: /editar/i });
    await user.click(editButton);

    const input = screen.getByPlaceholderText('Seu nome completo');
    expect(input).toBeInTheDocument();

    // Test cancellation restores initial name
    await user.clear(input);
    await user.type(input, 'Nome Cancelado');
    await user.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(screen.getByText('Aluno Teste')).toBeInTheDocument();

    // Test invalid short name validation
    await user.click(screen.getByRole('button', { name: /editar/i }));
    const inputAgain = screen.getByPlaceholderText('Seu nome completo');
    await user.clear(inputAgain);
    await user.type(inputAgain, 'Ab');
    await user.click(screen.getByRole('button', { name: /salvar/i }));
    expect(
      await screen.findByText('O nome deve ter entre 3 e 120 caracteres.'),
    ).toBeInTheDocument();
  });

  it('successfully updates name and updates auth context', async () => {
    const user = userEvent.setup();
    vi.mocked(userService.updateProfile).mockResolvedValue({
      ...mockStudentProfile,
      nome: 'Aluno Novo Nome',
    });

    const { updateUserMock } = renderProfilePage(mockStudentProfile);

    await user.click(await screen.findByRole('button', { name: /editar/i }));
    const input = screen.getByPlaceholderText('Seu nome completo');
    await user.clear(input);
    await user.type(input, 'Aluno Novo Nome');
    await user.click(screen.getByRole('button', { name: /salvar/i }));

    expect(await screen.findByText('Nome atualizado com sucesso.')).toBeInTheDocument();
    expect(screen.getByText('Aluno Novo Nome')).toBeInTheDocument();
    expect(updateUserMock).toHaveBeenCalledWith({ nome: 'Aluno Novo Nome' });
  });

  it('handles photo upload and deletion', async () => {
    const user = userEvent.setup();
    vi.mocked(userService.uploadPhoto).mockResolvedValue();
    vi.mocked(userService.deletePhoto).mockResolvedValue();

    const { updateUserMock } = renderProfilePage(mockStudentProfile);

    const fileInput = await screen.findByTestId('photo-input');
    const fakeFile = new File(['fake-image'], 'avatar.png', { type: 'image/png' });

    await user.upload(fileInput, fakeFile);

    expect(await screen.findByText('Foto atualizada com sucesso.')).toBeInTheDocument();
    expect(updateUserMock).toHaveBeenCalledWith({ possuiFoto: true });

    // Now remove photo
    const removeButton = screen.getByRole('button', { name: /remover/i });
    await user.click(removeButton);

    expect(await screen.findByText('Foto removida com sucesso.')).toBeInTheDocument();
    expect(updateUserMock).toHaveBeenCalledWith({ possuiFoto: false });
  });

  it('renders error state and retry button on fetch failure', async () => {
    const user = userEvent.setup();
    vi.mocked(userService.getProfile).mockRejectedValue(new Error('Network error'));

    render(
      <AuthContext.Provider
        value={{
          user: mockUser,
          isAuthenticated: true,
          login: vi.fn(),
          logout: vi.fn(),
          updateUser: vi.fn(),
        }}
      >
        <MemoryRouter>
          <ProfilePage />
        </MemoryRouter>
      </AuthContext.Provider>,
    );

    expect(
      await screen.findByText('Não foi possível carregar as informações do seu perfil.'),
    ).toBeInTheDocument();

    const retryBtn = screen.getByRole('button', { name: /tentar novamente/i });
    expect(retryBtn).toBeInTheDocument();

    vi.mocked(userService.getProfile).mockResolvedValue(mockStudentProfile);
    await user.click(retryBtn);

    expect(await screen.findByText('Aluno Teste')).toBeInTheDocument();
  });
});
