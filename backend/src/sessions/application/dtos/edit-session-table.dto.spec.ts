import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { EditSessionTableDto } from './edit-session-table.dto';

const criterionId = '00000000-0000-4000-8000-000000000001';
const validatePayload = (criterion: object) =>
  validate(plainToInstance(EditSessionTableDto, { escopo: 'TODAS', criterios: [criterion] }), {
    whitelist: true,
    forbidNonWhitelisted: true,
  });

describe('EditSessionTableDto', () => {
  it.each([
    { nome: 'Participação', peso: 10 },
    { id: criterionId, peso: 10 },
  ])('accepts full and weight-only edits without a maximum', async (criterion) => {
    expect(await validatePayload(criterion)).toHaveLength(0);
  });

  it.each([5, 10, null])('rejects the configurable maximum %s', async (notaMaxima) => {
    const errors = await validatePayload({ nome: 'Participação', peso: 10, notaMaxima });
    const criterionErrors = errors.find((error) => error.property === 'criterios')?.children?.[0]
      ?.children;
    expect(criterionErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          property: 'notaMaxima',
          constraints: expect.objectContaining({
            whitelistValidation: expect.any(String) as unknown,
          }) as unknown,
        }),
      ]),
    );
  });
});
