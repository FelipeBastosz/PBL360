import { UserPhoto } from '../domain/entities/user-photo.entity';

const PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR42mP4z8AAAAMBAQD3A0FDAAAAAElFTkSuQmCC';

export const pngPhotoBytes = (): Buffer => Buffer.from(PNG_BASE64, 'base64');

export const buildPhoto = (): UserPhoto => UserPhoto.fromBytes(pngPhotoBytes());
