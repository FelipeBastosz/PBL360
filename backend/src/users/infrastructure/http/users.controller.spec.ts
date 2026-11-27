import type { ChangeUserPasswordUseCase } from '../../application/use-cases/change-user-password.use-case';
import type { DeleteUserPhotoUseCase } from '../../application/use-cases/delete-user-photo.use-case';
import type { GetUserPhotoUseCase } from '../../application/use-cases/get-user-photo.use-case';
import type { GetUserPreferencesUseCase } from '../../application/use-cases/get-user-preferences.use-case';
import type { GetUserProfileUseCase } from '../../application/use-cases/get-user-profile.use-case';
import type { UpdateUserPreferencesUseCase } from '../../application/use-cases/update-user-preferences.use-case';
import type { UpdateUserProfileUseCase } from '../../application/use-cases/update-user-profile.use-case';
import type { UploadUserPhotoUseCase } from '../../application/use-cases/upload-user-photo.use-case';
import { StreamableFile } from '@nestjs/common';
import { UserThemePayload } from '../../application/dtos/user-theme-payload.enum';
import {
  DEFAULT_SYSTEM_COLOR,
  UserPreferences,
} from '../../domain/entities/user-preferences.entity';
import { UserTheme } from '../../domain/enums/user-theme.enum';
import { UserType } from '../../domain/enums/user-type.enum';
import { UserTypePayload } from '@/auth/application/dtos/user-type-payload.enum';
import { UsersController } from './users.controller';

describe('UsersController (preferences)', () => {
  let controller: UsersController;
  let getUserPhoto: { execute: jest.Mock };
  let getUserProfile: { execute: jest.Mock };
  let updateUserProfile: { execute: jest.Mock };
  let uploadUserPhoto: { execute: jest.Mock };
  let deleteUserPhoto: { execute: jest.Mock };
  let changeUserPassword: { execute: jest.Mock };
  let getUserPreferences: { execute: jest.Mock };
  let updateUserPreferences: { execute: jest.Mock };

  beforeEach(() => {
    getUserPhoto = { execute: jest.fn() };
    getUserProfile = { execute: jest.fn() };
    updateUserProfile = { execute: jest.fn() };
    uploadUserPhoto = { execute: jest.fn() };
    deleteUserPhoto = { execute: jest.fn() };
    changeUserPassword = { execute: jest.fn() };
    getUserPreferences = { execute: jest.fn() };
    updateUserPreferences = { execute: jest.fn() };

    controller = new UsersController(
      getUserPhoto as unknown as GetUserPhotoUseCase,
      getUserProfile as unknown as GetUserProfileUseCase,
      updateUserProfile as unknown as UpdateUserProfileUseCase,
      uploadUserPhoto as unknown as UploadUserPhotoUseCase,
      deleteUserPhoto as unknown as DeleteUserPhotoUseCase,
      changeUserPassword as unknown as ChangeUserPasswordUseCase,
      getUserPreferences as unknown as GetUserPreferencesUseCase,
      updateUserPreferences as unknown as UpdateUserPreferencesUseCase,
    );
  });

  it('gets the authenticated user profile and maps its public fields', async () => {
    getUserProfile.execute.mockResolvedValue({
      id: 'user-1',
      name: 'Ana Souza',
      email: 'ana@discente.uefs.br',
      type: UserType.STUDENT,
      registrationNumber: '20240001',
      hasPhoto: true,
    });

    await expect(controller.getProfile('user-1')).resolves.toEqual({
      id: 'user-1',
      nome: 'Ana Souza',
      email: 'ana@discente.uefs.br',
      tipo: UserTypePayload.ALUNO,
      matricula: '20240001',
      possuiFoto: true,
    });
    expect(getUserProfile.execute).toHaveBeenCalledWith({ userId: 'user-1' });
  });

  it('updates the profile name and returns the mapped profile', async () => {
    updateUserProfile.execute.mockResolvedValue({
      id: 'user-1',
      name: 'Ana Silva',
      email: 'ana@uefs.br',
      type: UserType.TUTOR,
      registrationNumber: null,
      hasPhoto: false,
    });

    await expect(controller.updateProfile('user-1', { nome: 'Ana Silva' })).resolves.toMatchObject({
      nome: 'Ana Silva',
      tipo: UserTypePayload.PROFESSOR,
      matricula: null,
    });
    expect(updateUserProfile.execute).toHaveBeenCalledWith({ userId: 'user-1', name: 'Ana Silva' });
  });

  it('changes the password and delegates both password values', async () => {
    await expect(
      controller.changePassword('user-1', {
        senhaAtual: 'old-password',
        novaSenha: 'new-password',
      }),
    ).resolves.toBeUndefined();
    expect(changeUserPassword.execute).toHaveBeenCalledWith({
      userId: 'user-1',
      currentPassword: 'old-password',
      newPassword: 'new-password',
    });
  });

  it('uploads a photo for the authenticated user', async () => {
    const buffer = Buffer.from('photo-bytes');
    await controller.uploadPhoto('user-1', { buffer });
    expect(uploadUserPhoto.execute).toHaveBeenCalledWith({ userId: 'user-1', bytes: buffer });
  });

  it('forwards a missing photo buffer to the upload use case', async () => {
    await controller.uploadPhoto('user-1');
    expect(uploadUserPhoto.execute).toHaveBeenCalledWith({ userId: 'user-1', bytes: undefined });
  });

  it('deletes the authenticated user photo', async () => {
    await expect(controller.deletePhoto('user-1')).resolves.toBeUndefined();
    expect(deleteUserPhoto.execute).toHaveBeenCalledWith({ userId: 'user-1' });
  });

  it('returns another user photo as an inline stream', async () => {
    const content = Buffer.from('photo-bytes');
    getUserPhoto.execute.mockResolvedValue({ content, mimeType: 'image/png' });

    const response = await controller.photo('user-2', 'user-1');
    expect(response).toBeInstanceOf(StreamableFile);
    expect(getUserPhoto.execute).toHaveBeenCalledWith({ userId: 'user-2', requesterId: 'user-1' });
  });

  it('delegates getPreferences with authenticated userId and maps response', async () => {
    getUserPreferences.execute.mockResolvedValue(UserPreferences.defaults('user-1'));

    const response = await controller.getPreferences('user-1');

    expect(getUserPreferences.execute).toHaveBeenCalledWith({ userId: 'user-1' });
    expect(response).toEqual({
      tema: UserThemePayload.CLARO,
      cor: DEFAULT_SYSTEM_COLOR,
    });
  });

  it('delegates updatePreferences with mapped domain theme and color', async () => {
    updateUserPreferences.execute.mockResolvedValue(
      UserPreferences.create({
        userId: 'user-1',
        theme: UserTheme.DARK,
        color: '#FF00AA',
      }),
    );

    const response = await controller.updatePreferences('user-1', {
      tema: UserThemePayload.ESCURO,
      cor: '#ff00aa',
    });

    expect(updateUserPreferences.execute).toHaveBeenCalledWith({
      userId: 'user-1',
      theme: UserTheme.DARK,
      color: '#ff00aa',
    });
    expect(response).toEqual({
      tema: UserThemePayload.ESCURO,
      cor: '#FF00AA',
    });
  });

  it('leaves theme undefined when omitted in partial update', async () => {
    updateUserPreferences.execute.mockResolvedValue(
      UserPreferences.create({
        userId: 'user-1',
        theme: UserTheme.LIGHT,
        color: '#112233',
      }),
    );

    const response = await controller.updatePreferences('user-1', { cor: '#112233' });

    expect(updateUserPreferences.execute).toHaveBeenCalledWith({
      userId: 'user-1',
      theme: undefined,
      color: '#112233',
    });
    expect(response).toEqual({
      tema: UserThemePayload.CLARO,
      cor: '#112233',
    });
  });
});
