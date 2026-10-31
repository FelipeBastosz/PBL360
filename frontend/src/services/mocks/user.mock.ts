import type { UpdateUserProfilePayload, UserProfileResponse } from '@/types/user';

let currentMockProfile: UserProfileResponse = {
  id: 'mock-user-123',
  nome: 'Lucas Silva',
  email: 'lucas.silva@discente.uefs.br',
  tipo: 'ALUNO',
  matricula: '20240001',
  possuiFoto: false,
};

let mockPhotoBlob: Blob | null = null;

export const mockUserService = {
  getProfile: async (): Promise<UserProfileResponse> => {
    await new Promise((r) => setTimeout(r, 400));
    return { ...currentMockProfile };
  },

  updateProfile: async (payload: UpdateUserProfilePayload): Promise<UserProfileResponse> => {
    await new Promise((r) => setTimeout(r, 400));
    currentMockProfile = { ...currentMockProfile, nome: payload.nome };
    return { ...currentMockProfile };
  },

  uploadPhoto: async (file: File): Promise<void> => {
    await new Promise((r) => setTimeout(r, 500));
    mockPhotoBlob = file;
    currentMockProfile = { ...currentMockProfile, possuiFoto: true };
  },

  deletePhoto: async (): Promise<void> => {
    await new Promise((r) => setTimeout(r, 300));
    mockPhotoBlob = null;
    currentMockProfile = { ...currentMockProfile, possuiFoto: false };
  },

  getPhoto: async (_userId: string): Promise<Blob> => {
    await new Promise((r) => setTimeout(r, 200));
    if (!mockPhotoBlob) {
      throw new Error('Foto não encontrada');
    }
    return mockPhotoBlob;
  },

  changePassword: async (_payload: { senhaAtual: string; novaSenha: string }): Promise<void> => {
    await new Promise((r) => setTimeout(r, 400));
  },
};
