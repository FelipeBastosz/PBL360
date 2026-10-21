import type { UserPhoto } from '../entities/user-photo.entity';

export interface UserPhotoRepository {
  findByUserId(userId: string): Promise<UserPhoto | null>;
  save(userId: string, photo: UserPhoto): Promise<void>;
  deleteByUserId(userId: string): Promise<void>;
}


export const USER_PHOTO_REPOSITORY = Symbol('UserPhotoRepository');
