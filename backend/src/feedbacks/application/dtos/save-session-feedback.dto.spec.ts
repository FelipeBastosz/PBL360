import { validate } from 'class-validator';
import { SaveSessionFeedbackDto } from './save-session-feedback.dto';

describe('SaveSessionFeedbackDto', () => {
  const createDto = (texto?: unknown): SaveSessionFeedbackDto =>
    Object.assign(new SaveSessionFeedbackDto(), { texto });

  it.each([null, 123, undefined])('rejects invalid text type: %s', async (texto) => {
    await expect(validate(createDto(texto))).resolves.not.toHaveLength(0);
  });

  it('rejects text longer than 2000 characters', async () => {
    await expect(validate(createDto('x'.repeat(2001)))).resolves.not.toHaveLength(0);
  });

  it('accepts empty, whitespace-only, and valid text up to 2000 characters', async () => {
    await expect(validate(createDto(''))).resolves.toHaveLength(0);
    await expect(validate(createDto('   '))).resolves.toHaveLength(0);
    await expect(validate(createDto('Feedback válido.'))).resolves.toHaveLength(0);
    await expect(validate(createDto('x'.repeat(2000)))).resolves.toHaveLength(0);
  });
});
