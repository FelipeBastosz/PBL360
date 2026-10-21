import { Body, Controller, Get, Header, Patch, StreamableFile } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthenticatedUserId } from '@/shared/decorators/authenticated-user-id.decorator';
import { UuidParam } from '@/shared/decorators/uuid-param.decorator';
import { GetUserPhotoUseCase } from '../../application/use-cases/get-user-photo.use-case';
import { GetUserProfileUseCase } from '../../application/use-cases/get-user-profile.use-case';
import { UpdateUserProfileUseCase } from '../../application/use-cases/update-user-profile.use-case';
import { UpdateUserProfileDto } from '../../application/dtos/update-user-profile.dto';
import type { UserProfileResponseDto } from '../../application/dtos/user-profile-response.dto';
import { toUserProfileResponse } from './user.mapper';
import {
  GetUserPhotoSwaggerDocs,
  GetUserProfileSwaggerDocs,
  UpdateUserProfileSwaggerDocs,
} from './users.swagger';

@ApiTags('Usuários')
@Controller('usuarios')
export class UsersController {
  constructor(
    private readonly getUserPhoto: GetUserPhotoUseCase,
    private readonly getUserProfile: GetUserProfileUseCase,
    private readonly updateUserProfile: UpdateUserProfileUseCase,
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


  @Get(':id/foto')
  @Header('Cache-Control', 'private, max-age=3600')
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

