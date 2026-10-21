import { Inject, Injectable } from '@nestjs/common';
import { InvalidRequestError, NotFoundError } from '@/shared/errors/application.error';

import { UserPhoto } from '../../domain/entities/user-photo.entity';
import {
  USER_PHOTO_REPOSITORY,
  type UserPhotoRepository,
} from '../../domain/repositories/user-photo.repository';
import { USER_REPOSITORY, type UserRepository } from '../../domain/repositories/user.repository';

export interface UploadUserPhotoInput {
  userId: string;
  bytes: Buffer;
}

@Injectable()
export class UploadUserPhotoUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(USER_PHOTO_REPOSITORY) private readonly photos: UserPhotoRepository,
  ) {}

  async execute(input: UploadUserPhotoInput): Promise<void> {
    if (!input.bytes || input.bytes.length === 0) {
      throw new InvalidRequestError('Envie uma única foto no campo "foto".');
    }

    const user = await this.users.findById(input.userId);

    if (!user) {
      throw new NotFoundError('Usuário não encontrado.');
    }

    const photo = UserPhoto.fromBytes(input.bytes);
    await this.photos.save(input.userId, photo);
  }

}
