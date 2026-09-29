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
}
