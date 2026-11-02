import { Inject, Injectable } from '@nestjs/common';
import { ForbiddenError, NotFoundError } from '@/shared/errors/application.error';
import {
  USER_PHOTO_REPOSITORY,
  type UserPhotoRepository,
} from '../../domain/repositories/user-photo.repository';
import { USER_REPOSITORY, type UserRepository } from '../../domain/repositories/user.repository';

export interface DeleteUserPhotoInput {
  userId: string;
}

@Injectable()
export class DeleteUserPhotoUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(USER_PHOTO_REPOSITORY) private readonly photos: UserPhotoRepository,
  ) {}

  async execute(input: DeleteUserPhotoInput): Promise<void> {
    const user = await this.users.findById(input.userId);

    if (!user) {
      throw new NotFoundError('Usuário não encontrado.');
    }

    if (user.isStudent()) {
      throw new ForbiddenError('Alunos não podem remover a foto de perfil.');
    }

    await this.photos.deleteByUserId(input.userId);
  }
}
