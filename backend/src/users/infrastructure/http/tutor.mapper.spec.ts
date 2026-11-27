import { toTutorResponse } from './tutor.mapper';

describe('toTutorResponse', () => {
  it('maps a tutor summary to the Portuguese API fields', () => {
    expect(toTutorResponse({ id: 't1', name: 'Ana', email: 'ana@example.test' })).toEqual({
      id: 't1',
      nome: 'Ana',
      email: 'ana@example.test',
    });
  });
});
