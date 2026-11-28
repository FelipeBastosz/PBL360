import { validate } from 'class-validator';
import { SaveSessionGeneralEvaluationDto } from './save-session-general-evaluation.dto';

describe('SaveSessionGeneralEvaluationDto', () => {
  const createDto = (texto?: unknown): SaveSessionGeneralEvaluationDto =>
    Object.assign(new SaveSessionGeneralEvaluationDto(), { texto });

  it.each([null, 123, undefined])('rejects invalid text: %s', async (texto) => {
    const dto = createDto(texto);

    await expect(validate(dto)).resolves.not.toHaveLength(0);
  });

  it('rejects text longer than 2000 characters', async () => {
    await expect(validate(createDto('x'.repeat(2001)))).resolves.not.toHaveLength(0);
  });

  it('accepts empty, whitespace-only, and valid text up to 2000 characters', async () => {
    await expect(validate(createDto(''))).resolves.toHaveLength(0);
    await expect(validate(createDto('   '))).resolves.toHaveLength(0);
    await expect(validate(createDto('Relato válido.'))).resolves.toHaveLength(0);
    await expect(validate(createDto('x'.repeat(2000)))).resolves.toHaveLength(0);
  });
});
