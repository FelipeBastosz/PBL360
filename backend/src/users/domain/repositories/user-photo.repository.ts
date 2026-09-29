import type { UserPhoto } from '../entities/user-photo.entity';

export interface UserPhotoRepository {
  findByUserId(userId: string): Promise<UserPhoto | null>;
}

export const USER_PHOTO_REPOSITORY = Symbol('UserPhotoRepository');
