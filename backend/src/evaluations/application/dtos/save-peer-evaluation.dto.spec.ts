import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { SavePeerEvaluationDto } from './save-peer-evaluation.dto';

const criterionId = '91e1473d-1955-4ed2-8ae6-8d18af2efdd9';
const validatePayload = (payload: Record<string, unknown>) =>
  validate(plainToInstance(SavePeerEvaluationDto, payload), {
    whitelist: true,
    forbidNonWhitelisted: true,
  });

describe('SavePeerEvaluationDto', () => {
  it('accepts a valid draft payload', async () => {
    const errors = await validatePayload({
      itens: [{ criterioId: criterionId, nota: 0 }],
      enviar: false,
    });

    expect(errors).toEqual([]);
  });

  it('accepts an empty draft', async () => {
    expect(await validatePayload({ itens: [], enviar: false })).toEqual([]);
  });

  it('accepts a valid submission payload with decimal scores', async () => {
    expect(
      await validatePayload({
        itens: [{ criterioId: criterionId, nota: 8.75 }],
        enviar: true,
      }),
    ).toEqual([]);
  });

  it('rejects forbidden extra properties', async () => {
    const errors = await validatePayload({
      itens: [],
      enviar: false,
      autorId: criterionId,
    });

    expect(errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ property: 'autorId' })]),
    );
  });

  it.each([undefined, null, 'false', 0])('rejects invalid enviar flag: %s', async (enviar) => {
    const errors = await validatePayload({ itens: [], enviar });
    expect(errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ property: 'enviar' })]),
    );
  });

  it('rejects invalid items payload structure', async () => {
    const errors = await validatePayload({
      itens: [{ criterioId: 'invalid-uuid', nota: -1 }],
      enviar: false,
    });

    expect(errors.length).toBeGreaterThan(0);
  });
});
