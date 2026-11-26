import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { validationExceptionFactory } from '@/shared/pipes/validation-exception.factory';
import { DEFAULT_SYSTEM_COLOR, UpdateUserPreferencesDto } from './update-user-preferences.dto';
import { UserThemePayload } from './user-theme-payload.enum';

const createPipe = (): ValidationPipe =>
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    exceptionFactory: validationExceptionFactory,
  });

const validateBody = (body: unknown): Promise<UpdateUserPreferencesDto> =>
  createPipe().transform(body, {
    type: 'body',
    metatype: UpdateUserPreferencesDto,
  }) as Promise<UpdateUserPreferencesDto>;

describe('UpdateUserPreferencesDto', () => {
  it('accepts valid partial and complete payloads including lowercase hex and default color', async () => {
    await expect(validateBody({ tema: UserThemePayload.ESCURO })).resolves.toMatchObject({
      tema: UserThemePayload.ESCURO,
    });
    await expect(validateBody({ cor: '#ff00aa' })).resolves.toMatchObject({
      cor: '#ff00aa',
    });
    await expect(
      validateBody({ tema: UserThemePayload.CLARO, cor: DEFAULT_SYSTEM_COLOR }),
    ).resolves.toMatchObject({
      tema: UserThemePayload.CLARO,
      cor: DEFAULT_SYSTEM_COLOR,
    });
    await expect(validateBody({})).resolves.toEqual({});
  });

  it.each([
    ['invalid theme value', { tema: 'AZUL' }],
    ['english theme value', { tema: 'DARK' }],
    ['empty theme string', { tema: '' }],
    ['explicit null theme', { tema: null }],
    ['3-digit hex color', { cor: '#fff' }],
    ['hex color without hash', { cor: '112233' }],
    ['hex color with invalid characters', { cor: '#GGGGGG' }],
    ['empty color string', { cor: '' }],
    ['named color', { cor: 'blue' }],
    ['color with leading space', { cor: ' #112233' }],
    ['color with trailing space', { cor: '#112233 ' }],
    ['8-digit hex color', { cor: '#11223344' }],
    ['explicit null color', { cor: null }],
    ['extra usuarioId field', { tema: UserThemePayload.ESCURO, usuarioId: 'other-user' }],
    ['extra userId field', { cor: '#112233', userId: 'other-user' }],
    ['extra id field', { id: 'other-user' }],
  ])('rejects %s with BadRequestException (400)', async (_label, payload) => {
    await expect(validateBody(payload)).rejects.toThrow(BadRequestException);
  });
});
