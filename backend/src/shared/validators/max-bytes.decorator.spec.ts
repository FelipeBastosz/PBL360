import { validate } from 'class-validator';
import { MaxBytes } from './max-bytes.decorator';

class Payload {
  @MaxBytes(4, { message: 'grande demais' })
  value: unknown;
}

const errorsFor = async (value: unknown) =>
  validate(Object.assign(new Payload(), { value })).then((errors) => errors.length);

describe('MaxBytes', () => {
  it('accepts text within the limit', async () => {
    await expect(errorsFor('abcd')).resolves.toBe(0);
  });

  it('counts bytes, not characters', async () => {
    await expect(errorsFor('ááá')).resolves.toBe(1);
  });

  it('leaves non-strings to other validators', async () => {
    await expect(errorsFor(12345)).resolves.toBe(0);
  });
});
