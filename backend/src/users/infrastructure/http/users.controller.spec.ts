import type { ChangeUserPasswordUseCase } from '../../application/use-cases/change-user-password.use-case';
import type { DeleteUserPhotoUseCase } from '../../application/use-cases/delete-user-photo.use-case';
import type { GetUserPhotoUseCase } from '../../application/use-cases/get-user-photo.use-case';
import type { GetUserPreferencesUseCase } from '../../application/use-cases/get-user-preferences.use-case';
import type { GetUserProfileUseCase } from '../../application/use-cases/get-user-profile.use-case';
import type { UpdateUserPreferencesUseCase } from '../../application/use-cases/update-user-preferences.use-case';
import type { UpdateUserProfileUseCase } from '../../application/use-cases/update-user-profile.use-case';
import type { UploadUserPhotoUseCase } from '../../application/use-cases/upload-user-photo.use-case';
import { UserThemePayload } from '../../application/dtos/user-theme-payload.enum';
import {
  DEFAULT_SYSTEM_COLOR,
  UserPreferences,
} from '../../domain/entities/user-preferences.entity';
import { UserTheme } from '../../domain/enums/user-theme.enum';
import { UsersController } from './users.controller';

describe('UsersController (preferences)', () => {
  let controller: UsersController;
  let getUserPreferences: { execute: jest.Mock };
  let updateUserPreferences: { execute: jest.Mock };

  beforeEach(() => {
    getUserPreferences = { execute: jest.fn() };
    updateUserPreferences = { execute: jest.fn() };

    controller = new UsersController(
      {} as GetUserPhotoUseCase,
      {} as GetUserProfileUseCase,
      {} as UpdateUserProfileUseCase,
      {} as UploadUserPhotoUseCase,
      {} as DeleteUserPhotoUseCase,
      {} as ChangeUserPasswordUseCase,
      getUserPreferences as unknown as GetUserPreferencesUseCase,
      updateUserPreferences as unknown as UpdateUserPreferencesUseCase,
    );
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
