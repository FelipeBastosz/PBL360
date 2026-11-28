import { validate } from 'class-validator';
import { SaveGeneralFeedbackDto } from './save-general-feedback.dto';

describe('SaveGeneralFeedbackDto', () => {
  const createDto = (texto?: unknown): SaveGeneralFeedbackDto =>
    Object.assign(new SaveGeneralFeedbackDto(), { texto });

  it.each([null, 123, undefined])('rejects invalid text type: %s', async (texto) => {
    await expect(validate(createDto(texto))).resolves.not.toHaveLength(0);
  });

  it('rejects text longer than 2000 characters', async () => {
    await expect(validate(createDto('x'.repeat(2001)))).resolves.not.toHaveLength(0);
  });

  it('accepts empty, whitespace-only, and valid text up to 2000 characters', async () => {
    await expect(validate(createDto(''))).resolves.toHaveLength(0);
    await expect(validate(createDto('   '))).resolves.toHaveLength(0);
    await expect(validate(createDto('Parecer válido.'))).resolves.toHaveLength(0);
    await expect(validate(createDto('x'.repeat(2000)))).resolves.toHaveLength(0);
  });
});
