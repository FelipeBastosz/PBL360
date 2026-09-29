import { Controller, Get, Header, StreamableFile } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthenticatedUserId } from '@/shared/decorators/authenticated-user-id.decorator';
import { UuidParam } from '@/shared/decorators/uuid-param.decorator';
import { GetUserPhotoUseCase } from '../../application/use-cases/get-user-photo.use-case';
import { GetUserPhotoSwaggerDocs } from './users.swagger';

@ApiTags('Usuários')
@Controller('usuarios')
export class UsersController {
  constructor(private readonly getUserPhoto: GetUserPhotoUseCase) {}

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
