import {
  BadRequestException,
  Injectable,
  PayloadTooLargeException,
  UseInterceptors,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { catchError, throwError, type Observable } from 'rxjs';
import { MAX_PHOTO_BYTES } from '@/users/domain/entities/user-photo.entity';

export const PHOTO_FIELD = 'foto';

export interface UploadedPhoto {
  buffer: Buffer;
}

const FILE_FIELD_CODES = ['LIMIT_UNEXPECTED_FILE', 'LIMIT_FILE_COUNT'];

const FILE_FIELD_MESSAGES = ['Unexpected field', 'Too many files'];

interface MulterError extends Error {
  code: string;
}

const isMulterError = (error: unknown): error is MulterError =>
  error instanceof Error && error.name === 'MulterError';

const isFileSizeError = (error: unknown): boolean =>
  error instanceof PayloadTooLargeException ||
  (isMulterError(error) && error.code === 'LIMIT_FILE_SIZE');

const isFileFieldError = (error: unknown): boolean =>
  (isMulterError(error) && FILE_FIELD_CODES.includes(error.code)) ||
  (error instanceof BadRequestException &&
    FILE_FIELD_MESSAGES.some((message) => error.message.startsWith(message)));

const translateUploadError = (error: unknown): unknown => {
  if (isFileSizeError(error)) {
    return new PayloadTooLargeException('A foto deve ter no máximo 2 MB.');
  }

  if (isFileFieldError(error)) {
    return new BadRequestException(`Envie uma única foto no campo "${PHOTO_FIELD}".`);
  }

  if (isMulterError(error)) {
    return new BadRequestException('Não foi possível ler o formulário enviado.');
  }

  return error;
};

@Injectable()
export class PhotoUploadErrorsInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next
      .handle()
      .pipe(catchError((error: unknown) => throwError(() => translateUploadError(error))));
  }
}

export const PhotoUpload = (): MethodDecorator & ClassDecorator =>
  UseInterceptors(
    PhotoUploadErrorsInterceptor,
    FileInterceptor(PHOTO_FIELD, { limits: { fileSize: MAX_PHOTO_BYTES, files: 1 } }),
  );
