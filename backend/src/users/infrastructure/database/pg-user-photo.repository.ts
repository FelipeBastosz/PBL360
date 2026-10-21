import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { firstRowOrNull } from '@/shared/database/rows';
import { UserPhoto, type PhotoMimeType } from '../../domain/entities/user-photo.entity';
import type { UserPhotoRepository } from '../../domain/repositories/user-photo.repository';

interface UserPhotoRow {
  userId: string;
  content: Buffer;
  mimeType: PhotoMimeType;
  updatedAt: Date;
}

const USER_PHOTO_COLUMNS = `
    user_id AS "userId",
    content,
    mime_type AS "mimeType",
    updated_at AS "updatedAt"`;

@Injectable()
export class PgUserPhotoRepository implements UserPhotoRepository {
  constructor(@InjectRepository(UserPhoto) private readonly photos: Repository<UserPhoto>) {}

  async findByUserId(userId: string): Promise<UserPhoto | null> {
    const rows = await this.photos.query<UserPhotoRow[]>(
      `SELECT ${USER_PHOTO_COLUMNS}
        FROM user_photos
        WHERE user_id = $1
        LIMIT 1;`,
      [userId],
    );
    const row = firstRowOrNull(rows);

    return row ? this.photos.create(row) : null;
  }

  async save(userId: string, photo: UserPhoto): Promise<void> {
    await this.photos.query(
      `INSERT INTO user_photos (user_id, content, mime_type)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id) DO UPDATE
          SET content = EXCLUDED.content, mime_type = EXCLUDED.mime_type, updated_at = now();`,
      [userId, photo.content, photo.mimeType],
    );
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.photos.query(`DELETE FROM user_photos WHERE user_id = $1;`, [userId]);
  }
}
