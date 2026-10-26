import { UserPhoto } from '../domain/entities/user-photo.entity';

const PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR42mP4z8AAAAMBAQD3A0FDAAAAAElFTkSuQmCC';

export const pngPhotoBytes = (): Buffer => Buffer.from(PNG_BASE64, 'base64');

export const jpegPhotoBytes = (): Buffer =>
  Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(60)]);

export const webpPhotoBytes = (): Buffer =>
  Buffer.concat([Buffer.from('RIFF\0\0\0\0WEBPVP8 ', 'latin1'), Buffer.alloc(52)]);

export const buildPhoto = (): UserPhoto => UserPhoto.fromBytes(pngPhotoBytes());
