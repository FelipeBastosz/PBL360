import { FileUpload, type UploadedFileBuffer } from '@/shared/http/file-upload';
import { MAX_PHOTO_BYTES } from '@/users/domain/entities/user-photo.entity';

export const PHOTO_FIELD = 'foto';

export type UploadedPhoto = UploadedFileBuffer;

export const PhotoUpload = (): MethodDecorator & ClassDecorator =>
  FileUpload({
    field: PHOTO_FIELD,
    maxBytes: MAX_PHOTO_BYTES,
    tooLargeMessage: 'A foto deve ter no máximo 2 MB.',
    wrongFieldMessage: `Envie uma única foto no campo "${PHOTO_FIELD}".`,
  });
