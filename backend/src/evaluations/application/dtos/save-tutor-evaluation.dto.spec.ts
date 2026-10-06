import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { SaveTutorEvaluationDto } from './save-tutor-evaluation.dto';

const criterionId = '91e1473d-1955-4ed2-8ae6-8d18af2efdd9';
const validatePayload = (payload: Record<string, unknown>) =>
  validate(plainToInstance(SaveTutorEvaluationDto, payload), {
    whitelist: true,
    forbidNonWhitelisted: true,
  });

describe('SaveTutorEvaluationDto', () => {
  it('accepts a zero score in a draft', async () => {
    const errors = await validatePayload({
      itens: [{ criterioId: criterionId, nota: 0 }],
      enviar: false,
    });

    expect(errors).toEqual([]);
  });

  it('accepts an empty draft without a justification', async () => {
    expect(await validatePayload({ itens: [], enviar: false })).toEqual([]);
  });

  it('accepts a submission payload with decimal scores', async () => {
    expect(
      await validatePayload({
        itens: [{ criterioId: criterionId, nota: 8.75 }],
        enviar: true,
      }),
    ).toEqual([]);
  });

  it('rejects an author supplied in the request body', async () => {
    const errors = await validatePayload({
      itens: [],
      enviar: false,
      autorId: criterionId,
    });

    expect(errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ property: 'autorId' })]),
    );
  });

  it.each([undefined, null, 'false', 0])('rejects an invalid submit flag: %s', async (enviar) => {
    const errors = await validatePayload({ itens: [], enviar });
    expect(errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ property: 'enviar' })]),
    );
  });

  it.each([undefined, null, 'items', {}])('rejects an invalid items list: %s', async (itens) => {
    const errors = await validatePayload({ itens, enviar: false });
    expect(errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ property: 'itens' })]),
    );
  });

  it.each([undefined, null, 'invalid-id'])(
    'rejects invalid nested criterion ids: %s',
    async (criterioId) => {
      const errors = await validatePayload({ itens: [{ criterioId, nota: 8 }], enviar: false });
      expect(errors[0]?.children?.[0]?.children).toEqual(
        expect.arrayContaining([expect.objectContaining({ property: 'criterioId' })]),
      );
    },
  );

  it.each([undefined, null, '8.5', 8.756, NaN, Infinity])(
    'rejects malformed scores: %s',
    async (nota) => {
      const errors = await validatePayload({
        itens: [{ criterioId: criterionId, nota }],
        enviar: false,
      });
      expect(errors[0]?.children?.[0]?.children).toEqual(
        expect.arrayContaining([expect.objectContaining({ property: 'nota' })]),
      );
    },
  );

  it.each([null, 123, 'Curta', '          ', 'a'.repeat(501)])(
    'rejects an invalid justification: %s',
    async (justificativa) => {
      const errors = await validatePayload({ itens: [], enviar: false, justificativa });
      expect(errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ property: 'justificativa' })]),
      );
    },
  );

  it.each([10, 500])('accepts a justification with %s characters', async (length) => {
    expect(
      await validatePayload({
        itens: [],
        enviar: false,
        justificativa: 'a'.repeat(length),
      }),
    ).toEqual([]);
  });

  it('trims the justification before checking its length', async () => {
    const dto = plainToInstance(SaveTutorEvaluationDto, {
      itens: [],
      enviar: false,
      justificativa: '  Correção após revisão.  ',
    });

    expect(dto.justificativa).toBe('Correção após revisão.');
    expect(await validate(dto)).toEqual([]);
    expect(
      await validatePayload({
        itens: [],
        enviar: false,
        justificativa: '      curta      ',
      }),
    ).toEqual(expect.arrayContaining([expect.objectContaining({ property: 'justificativa' })]));
  });
});
