import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { InvalidUserError } from '../errors/invalid-user.error';

export const MAX_PHOTO_BYTES = 2 * 1024 * 1024;

export const PHOTO_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

export type PhotoMimeType = (typeof PHOTO_MIME_TYPES)[number];

const SIGNATURES: { mimeType: PhotoMimeType; matches: (bytes: Buffer) => boolean }[] = [
  {
    mimeType: 'image/jpeg',
    matches: (bytes) => bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff])),
  },
  {
    mimeType: 'image/png',
    matches: (bytes) =>
      bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  },
  {
    mimeType: 'image/webp',
    matches: (bytes) =>
      bytes.subarray(0, 4).toString('latin1') === 'RIFF' &&
      bytes.subarray(8, 12).toString('latin1') === 'WEBP',
  },
];

@Entity('user_photos')
export class UserPhoto {
  @PrimaryColumn({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ type: 'bytea' })
  content: Buffer;

  @Column({ name: 'mime_type', type: 'varchar', length: 20 })
  mimeType: PhotoMimeType;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  static fromBytes(content: Buffer): UserPhoto {
    if (content.length === 0) {
      throw new InvalidUserError('A foto enviada está vazia.');
    }

    if (content.length > MAX_PHOTO_BYTES) {
      throw new InvalidUserError('A foto deve ter no máximo 2 MB.');
    }

    const signature = SIGNATURES.find(({ matches }) => matches(content));

    if (!signature) {
      throw new InvalidUserError('A foto deve ser uma imagem JPEG, PNG ou WebP.');
    }

    const photo = new UserPhoto();
    photo.content = content;
    photo.mimeType = signature.mimeType;

    return photo;
  }
}
