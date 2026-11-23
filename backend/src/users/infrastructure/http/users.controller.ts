import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Patch,
  Put,
  StreamableFile,
  UploadedFile,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthenticatedUserId } from '@/shared/decorators/authenticated-user-id.decorator';
import { UuidParam } from '@/shared/decorators/uuid-param.decorator';
import {
  PhotoUpload,
  type UploadedPhoto,
} from '@/auth/infrastructure/http/photo-upload.interceptor';
import { GetUserPhotoUseCase } from '../../application/use-cases/get-user-photo.use-case';
import { GetUserPreferencesUseCase } from '../../application/use-cases/get-user-preferences.use-case';
import { GetUserProfileUseCase } from '../../application/use-cases/get-user-profile.use-case';
import { UpdateUserPreferencesUseCase } from '../../application/use-cases/update-user-preferences.use-case';
import { UpdateUserProfileUseCase } from '../../application/use-cases/update-user-profile.use-case';
import { UploadUserPhotoUseCase } from '../../application/use-cases/upload-user-photo.use-case';
import { DeleteUserPhotoUseCase } from '../../application/use-cases/delete-user-photo.use-case';
import { ChangeUserPasswordUseCase } from '../../application/use-cases/change-user-password.use-case';
import { UpdateUserPreferencesDto } from '../../application/dtos/update-user-preferences.dto';
import { UpdateUserProfileDto } from '../../application/dtos/update-user-profile.dto';
import { ChangeUserPasswordDto } from '../../application/dtos/change-user-password.dto';
import type { UserPreferencesResponseDto } from '../../application/dtos/user-preferences-response.dto';
import type { UserProfileResponseDto } from '../../application/dtos/user-profile-response.dto';
import { toDomainTheme, toUserPreferencesResponse } from './user-preferences.mapper';
import {
  GetUserPreferencesSwaggerDocs,
  UpdateUserPreferencesSwaggerDocs,
} from './user-preferences.swagger';
import { toUserProfileResponse } from './user.mapper';
import {
  ChangeUserPasswordSwaggerDocs,
  DeleteUserPhotoSwaggerDocs,
  GetUserPhotoSwaggerDocs,
  GetUserProfileSwaggerDocs,
  UpdateUserProfileSwaggerDocs,
  UploadUserPhotoSwaggerDocs,
} from './users.swagger';

@ApiTags('Usuários')
@Controller('usuarios')
export class UsersController {
  constructor(
    private readonly getUserPhoto: GetUserPhotoUseCase,
    private readonly getUserProfile: GetUserProfileUseCase,
    private readonly updateUserProfile: UpdateUserProfileUseCase,
    private readonly uploadUserPhoto: UploadUserPhotoUseCase,
    private readonly deleteUserPhoto: DeleteUserPhotoUseCase,
    private readonly changeUserPassword: ChangeUserPasswordUseCase,
    private readonly getUserPreferences: GetUserPreferencesUseCase,
    private readonly updateUserPreferences: UpdateUserPreferencesUseCase,
  ) {}

  @Get('meu-perfil')
  @GetUserProfileSwaggerDocs
  async getProfile(@AuthenticatedUserId() userId: string): Promise<UserProfileResponseDto> {
    const user = await this.getUserProfile.execute({ userId });
    return toUserProfileResponse(user);
  }

  @Patch('meu-perfil')
  @UpdateUserProfileSwaggerDocs
  async updateProfile(
    @AuthenticatedUserId() userId: string,
    @Body() dto: UpdateUserProfileDto,
  ): Promise<UserProfileResponseDto> {
    const user = await this.updateUserProfile.execute({ userId, name: dto.nome });
    return toUserProfileResponse(user);
  }

  @Patch('minha-senha')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ChangeUserPasswordSwaggerDocs
  async changePassword(
    @AuthenticatedUserId() userId: string,
    @Body() dto: ChangeUserPasswordDto,
  ): Promise<void> {
    await this.changeUserPassword.execute({
      userId,
      currentPassword: dto.senhaAtual,
      newPassword: dto.novaSenha,
    });
  }

  @Put('minha-foto')
  @HttpCode(HttpStatus.NO_CONTENT)
  @PhotoUpload()
  @UploadUserPhotoSwaggerDocs
  async uploadPhoto(
    @AuthenticatedUserId() userId: string,
    @UploadedFile() photo?: UploadedPhoto,
  ): Promise<void> {
    await this.uploadUserPhoto.execute({ userId, bytes: photo?.buffer as Buffer });
  }

  @Delete('minha-foto')
  @HttpCode(HttpStatus.NO_CONTENT)
  @DeleteUserPhotoSwaggerDocs
  async deletePhoto(@AuthenticatedUserId() userId: string): Promise<void> {
    await this.deleteUserPhoto.execute({ userId });
  }

  @Get('minhas-preferencias')
  @GetUserPreferencesSwaggerDocs
  async getPreferences(@AuthenticatedUserId() userId: string): Promise<UserPreferencesResponseDto> {
    const preferences = await this.getUserPreferences.execute({ userId });
    return toUserPreferencesResponse(preferences);
  }

  @Put('minhas-preferencias')
  @UpdateUserPreferencesSwaggerDocs
  async updatePreferences(
    @AuthenticatedUserId() userId: string,
    @Body() dto: UpdateUserPreferencesDto,
  ): Promise<UserPreferencesResponseDto> {
    const preferences = await this.updateUserPreferences.execute({
      userId,
      theme: dto.tema === undefined ? undefined : toDomainTheme(dto.tema),
      color: dto.cor,
    });
    return toUserPreferencesResponse(preferences);
  }

  @Get(':id/foto')
  @Header('Cache-Control', 'private, no-store')
  @GetUserPhotoSwaggerDocs
  async photo(
    @UuidParam('id') userId: string,
    @AuthenticatedUserId() requesterId: string,
  ): Promise<StreamableFile> {
    const photo = await this.getUserPhoto.execute({ userId, requesterId });

    return new StreamableFile(photo.content, {
      type: photo.mimeType,
      length: photo.content.length,
      disposition: 'inline',
    });
  }
}
