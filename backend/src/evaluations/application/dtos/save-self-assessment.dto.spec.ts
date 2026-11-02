import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { SaveSelfAssessmentDto } from './save-self-assessment.dto';

const criterionId = '91e1473d-1955-4ed2-8ae6-8d18af2efdd9';
const validatePayload = (payload: Record<string, unknown>) =>
  validate(plainToInstance(SaveSelfAssessmentDto, payload), {
    whitelist: true,
    forbidNonWhitelisted: true,
  });

describe('SaveSelfAssessmentDto', () => {
  it('accepts a valid draft payload with notaCargo', async () => {
    const errors = await validatePayload({
      itens: [{ criterioId: criterionId, nota: 8.5 }],
      enviar: false,
      notaCargo: 9.5,
    });

    expect(errors).toEqual([]);
  });

  it('accepts boundary notaCargo values 0 and 10', async () => {
    expect(
      await validatePayload({
        itens: [{ criterioId: criterionId, nota: 0 }],
        enviar: false,
        notaCargo: 0,
      }),
    ).toEqual([]);

    expect(
      await validatePayload({
        itens: [{ criterioId: criterionId, nota: 10 }],
        enviar: true,
        notaCargo: 10,
      }),
    ).toEqual([]);
  });

  it('accepts payload without notaCargo (null or undefined)', async () => {
    expect(
      await validatePayload({
        itens: [{ criterioId: criterionId, nota: 7 }],
        enviar: true,
      }),
    ).toEqual([]);

    expect(
      await validatePayload({
        itens: [{ criterioId: criterionId, nota: 7 }],
        enviar: true,
        notaCargo: null,
      }),
    ).toEqual([]);
  });

  it('rejects notaCargo with more than 1 decimal place', async () => {
    const errors = await validatePayload({
      itens: [{ criterioId: criterionId, nota: 8 }],
      enviar: false,
      notaCargo: 8.75,
    });

    expect(errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ property: 'notaCargo' })]),
    );
  });

  it.each([-0.1, 10.1, -5, 15])('rejects out of bounds notaCargo: %s', async (notaCargo) => {
    const errors = await validatePayload({
      itens: [{ criterioId: criterionId, nota: 8 }],
      enviar: false,
      notaCargo,
    });

    expect(errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ property: 'notaCargo' })]),
    );
  });

  it('rejects non-whitelisted properties', async () => {
    const errors = await validatePayload({
      itens: [],
      enviar: false,
      extraProperty: 'not-allowed',
    });

    expect(errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ property: 'extraProperty' })]),
    );
  });
});
