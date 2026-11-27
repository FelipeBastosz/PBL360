import {
  BadRequestException,
  PayloadTooLargeException,
  type CallHandler,
  type ExecutionContext,
} from '@nestjs/common';
import { lastValueFrom, of, throwError } from 'rxjs';
import {
  FileUpload,
  UploadErrorsInterceptor,
  translateUploadError,
  type FileUploadOptions,
} from './file-upload';

const options: FileUploadOptions = {
  field: 'arquivo',
  maxBytes: 1024,
  tooLargeMessage: 'Arquivo muito grande.',
  wrongFieldMessage: 'Campo de arquivo inválido.',
};

const multerError = (code: string): Error & { code: string } =>
  Object.assign(new Error('Multer error'), { name: 'MulterError', code });

describe('file upload helpers', () => {
  it('translates file size errors to the configured payload error', () => {
    expect(translateUploadError(new PayloadTooLargeException(), options)).toEqual(
      new PayloadTooLargeException('Arquivo muito grande.'),
    );
    expect(translateUploadError(multerError('LIMIT_FILE_SIZE'), options)).toEqual(
      new PayloadTooLargeException('Arquivo muito grande.'),
    );
  });

  it('translates unexpected field and file count errors', () => {
    expect(translateUploadError(multerError('LIMIT_UNEXPECTED_FILE'), options)).toEqual(
      new BadRequestException('Campo de arquivo inválido.'),
    );
    expect(translateUploadError(multerError('LIMIT_FILE_COUNT'), options)).toEqual(
      new BadRequestException('Campo de arquivo inválido.'),
    );
    expect(
      translateUploadError(new BadRequestException('Unexpected field arquivo2'), options),
    ).toEqual(new BadRequestException('Campo de arquivo inválido.'));
  });

  it('uses the default field message and generic message for other Multer errors', () => {
    const withoutOverride = { ...options, wrongFieldMessage: undefined };
    expect(translateUploadError(multerError('LIMIT_UNEXPECTED_FILE'), withoutOverride)).toEqual(
      new BadRequestException('Envie um único arquivo no campo "arquivo".'),
    );
    expect(translateUploadError(multerError('LIMIT_PART_COUNT'), options)).toEqual(
      new BadRequestException('Não foi possível ler o formulário enviado.'),
    );
  });

  it('preserves unrelated errors', () => {
    const error = new Error('Unexpected failure');
    expect(translateUploadError(error, options)).toBe(error);
    expect(translateUploadError('invalid error', options)).toBe('invalid error');
  });

  it('passes successful interceptor responses through unchanged', async () => {
    const interceptor = new UploadErrorsInterceptor(options);
    const next = { handle: jest.fn().mockReturnValue(of('uploaded')) } as unknown as CallHandler;
    await expect(lastValueFrom(interceptor.intercept({} as ExecutionContext, next))).resolves.toBe(
      'uploaded',
    );
  });

  it('translates failures raised by the downstream interceptor', async () => {
    const interceptor = new UploadErrorsInterceptor(options);
    const next = {
      handle: jest.fn().mockReturnValue(throwError(() => multerError('LIMIT_FILE_SIZE'))),
    } as unknown as CallHandler;
    await expect(
      lastValueFrom(interceptor.intercept({} as ExecutionContext, next)),
    ).rejects.toThrow('Arquivo muito grande.');
  });

  it('creates a method decorator for the configured upload field', () => {
    expect(FileUpload(options)).toBeDefined();
  });
});
