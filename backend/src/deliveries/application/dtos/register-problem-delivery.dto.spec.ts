import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { MAX_DELIVERY_URL_LENGTH } from '../../domain/entities/delivery-url';
import { RegisterProblemDeliveryDto } from './register-problem-delivery.dto';

const validatePayload = async (payload: Record<string, unknown>): Promise<string[]> => {
  const dto = plainToInstance(RegisterProblemDeliveryDto, payload);
  const errors = await validate(dto);
  return errors.flatMap((error) => Object.values(error.constraints ?? {}));
};

describe('RegisterProblemDeliveryDto', () => {
  it('accepts a valid HTTPS delivery URL', async () => {
    const messages = await validatePayload({
      url: 'https://drive.google.com/drive/folders/1AbCdEfGhIjKlMnOp',
    });

    expect(messages).toEqual([]);
  });

  it('returns only the required string error when url is omitted', async () => {
    const messages = await validatePayload({});

    expect(messages).toEqual(['A URL da entrega é obrigatória e deve ser um texto.']);
  });

  it('returns only the required string error when url is not a string', async () => {
    const messages = await validatePayload({ url: 12345 });

    expect(messages).toEqual(['A URL da entrega é obrigatória e deve ser um texto.']);
  });

  it('returns only the max length error when url exceeds the maximum length', async () => {
    const messages = await validatePayload({
      url: `https://example.com/${'a'.repeat(MAX_DELIVERY_URL_LENGTH)}`,
    });

    expect(messages).toEqual([
      `A URL da entrega deve ter no máximo ${MAX_DELIVERY_URL_LENGTH} caracteres.`,
    ]);
  });

  it.each([
    '',
    '   ',
    'http://github.com/uefs/pbl360',
    'https://user:senha@github.com/uefs/pbl360',
    'https://10.0.0.1/admin',
    'https://[::1]/admin',
  ])('returns only the HTTPS URL error for invalid string: %s', async (url) => {
    const messages = await validatePayload({ url });

    expect(messages).toEqual(['Informe uma URL HTTPS válida para a entrega.']);
  });
});
