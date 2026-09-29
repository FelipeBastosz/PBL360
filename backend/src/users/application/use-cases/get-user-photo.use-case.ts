import { Inject, Injectable } from '@nestjs/common';
import { ForbiddenError, NotFoundError } from '@/shared/errors/application.error';
import type { UserPhoto } from '../../domain/entities/user-photo.entity';
import {
  USER_PHOTO_REPOSITORY,
  type UserPhotoRepository,
} from '../../domain/repositories/user-photo.repository';
import { USER_REPOSITORY, type UserRepository } from '../../domain/repositories/user.repository';

export interface GetUserPhotoInput {
  userId: string;
  requesterId: string;
}

@Injectable()
export class GetUserPhotoUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(USER_PHOTO_REPOSITORY) private readonly photos: UserPhotoRepository,
  ) {}

  async execute(input: GetUserPhotoInput): Promise<UserPhoto> {
    await this.assertCanSeePhoto(input);

    const photo = await this.photos.findByUserId(input.userId);

    if (!photo) {
      throw new NotFoundError('Foto não encontrada.');
    }

    return photo;
  }

  private async assertCanSeePhoto({ userId, requesterId }: GetUserPhotoInput): Promise<void> {
    if (userId === requesterId) {
      return;
    }

    const requester = await this.users.findById(requesterId);

    if (!requester?.isTutor()) {
      throw new ForbiddenError('Apenas professores podem ver a foto de outros usuários.');
    }
  }
}
