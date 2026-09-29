import { InvalidUserError } from '../errors/invalid-user.error';
import { pngPhotoBytes } from '../../testing/photo-fixtures';
import { MAX_PHOTO_BYTES, UserPhoto } from './user-photo.entity';

describe('UserPhoto (Domain)', () => {
  const padTo = (header: Buffer, size: number): Buffer =>
    Buffer.concat([header, Buffer.alloc(size - header.length)]);

  it('detects a PNG from its bytes', () => {
    const photo = UserPhoto.fromBytes(pngPhotoBytes());

    expect(photo.mimeType).toBe('image/png');
    expect(photo.content.equals(pngPhotoBytes())).toBe(true);
  });

  it('detects a JPEG from its bytes', () => {
    const jpeg = padTo(Buffer.from([0xff, 0xd8, 0xff, 0xe0]), 64);

    expect(UserPhoto.fromBytes(jpeg).mimeType).toBe('image/jpeg');
  });

  it('detects a WebP from its bytes', () => {
    const webp = padTo(Buffer.from('RIFF\0\0\0\0WEBPVP8 ', 'latin1'), 64);

    expect(UserPhoto.fromBytes(webp).mimeType).toBe('image/webp');
  });

  it('rejects a file that is not an accepted image, whatever its name says', () => {
    const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>');

    expect(() => UserPhoto.fromBytes(svg)).toThrow(
      new InvalidUserError('A foto deve ser uma imagem JPEG, PNG ou WebP.'),
    );
  });

  it('rejects an empty file', () => {
    expect(() => UserPhoto.fromBytes(Buffer.alloc(0))).toThrow('A foto enviada está vazia.');
  });

  it('rejects a photo above 2 MB', () => {
    const oversized = padTo(pngPhotoBytes(), MAX_PHOTO_BYTES + 1);

    expect(() => UserPhoto.fromBytes(oversized)).toThrow('A foto deve ter no máximo 2 MB.');
  });

  it('accepts a photo of exactly 2 MB', () => {
    const limit = padTo(pngPhotoBytes(), MAX_PHOTO_BYTES);

    expect(UserPhoto.fromBytes(limit).content).toHaveLength(MAX_PHOTO_BYTES);
  });
});
