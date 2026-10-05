import {
  BadRequestException,
  PayloadTooLargeException,
  UseInterceptors,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { catchError, throwError, type Observable } from 'rxjs';

export interface UploadedFileBuffer {
  buffer: Buffer;
  originalname?: string;
}

export interface FileUploadOptions {
  field: string;
  maxBytes: number;
  tooLargeMessage: string;
  wrongFieldMessage?: string;
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

export function translateUploadError(error: unknown, options: FileUploadOptions): unknown {
  if (isFileSizeError(error)) return new PayloadTooLargeException(options.tooLargeMessage);
  if (isFileFieldError(error)) {
    return new BadRequestException(
      options.wrongFieldMessage ?? `Envie um único arquivo no campo "${options.field}".`,
    );
  }
  if (isMulterError(error)) {
    return new BadRequestException('Não foi possível ler o formulário enviado.');
  }
  return error;
}

export class UploadErrorsInterceptor implements NestInterceptor {
  constructor(private readonly options: FileUploadOptions) {}

  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next
      .handle()
      .pipe(
        catchError((error: unknown) => throwError(() => translateUploadError(error, this.options))),
      );
  }
}

export const FileUpload = (options: FileUploadOptions): MethodDecorator & ClassDecorator =>
  UseInterceptors(
    new UploadErrorsInterceptor(options),
    FileInterceptor(options.field, {
      limits: { fileSize: options.maxBytes, files: 1 },
      defParamCharset: 'utf8',
    }),
  );
