import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateSessionDto } from './create-session.dto';
import { UpdateSessionDto } from './update-session.dto';

describe('session date DTOs', () => {
  it.each([CreateSessionDto, UpdateSessionDto])('accepts calendar dates in %p', async (Dto) => {
    const errors = await validate(
      plainToInstance(Dto, { titulo: 'Sessão', descricao: null, data: '15-10-2026' }),
    );

    expect(errors).toHaveLength(0);
  });

  it.each(['15-10-2026T00:00:00.000Z', '30-02-2026', '15/10/2026'])(
    'rejects non-calendar date value %s',
    async (data) => {
      const errors = await validate(
        plainToInstance(CreateSessionDto, { titulo: 'Sessão', descricao: null, data }),
      );

      expect(errors.some((error) => error.property === 'data')).toBe(true);
    },
  );
});
