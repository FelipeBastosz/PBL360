import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdatePerformanceTableDto } from './update-performance-table.dto';

const criterionId = '91e1473d-1955-4ed2-8ae6-8d18af2efdd9';
const validatePayload = (criterios: unknown, extra: Record<string, unknown> = {}) =>
  validate(plainToInstance(UpdatePerformanceTableDto, { nome: 'Barema', criterios, ...extra }), {
    whitelist: true,
    forbidNonWhitelisted: true,
  });

describe('UpdatePerformanceTableDto', () => {
  it('accepts existing and new criteria with a null table description', async () => {
    await expect(
      validatePayload(
        [
          { id: criterionId, nome: 'Participação', peso: 3, ordem: 1 },
          { nome: 'Evolução', peso: 2, ordem: 2 },
        ],
        { descricao: null },
      ),
    ).resolves.toEqual([]);
  });

  it.each([null, '', 'invalid-id', 123])('rejects an invalid criterion id: %s', async (id) => {
    expect(await validatePayload([{ id, nome: 'Participação' }])).not.toHaveLength(0);
  });

  it('rejects an empty list', async () => {
    expect(await validatePayload([])).not.toHaveLength(0);
  });

  it('requires the table name', async () => {
    expect(await validatePayload([{ nome: 'Participação' }], { nome: undefined })).not.toHaveLength(
      0,
    );
  });

  it('keeps the existing criterion field validation', async () => {
    expect(
      await validatePayload([{ id: criterionId, nome: '', peso: 11, ordem: 0 }]),
    ).not.toHaveLength(0);
  });

  it('rejects fields outside the current contract', async () => {
    expect(
      await validatePayload([{ nome: 'Participação', categoria: 'CONTENT', notaMaxima: 10 }]),
    ).not.toHaveLength(0);
  });
});
