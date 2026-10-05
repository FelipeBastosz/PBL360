import { InvalidObservationError } from '../errors/invalid-observation.error';
import { Observation, type NewObservation } from './observation.entity';

describe('Observation (Domain)', () => {
  const props = (overrides: Partial<NewObservation> = {}): NewObservation => ({
    sessionId: 'session-1',
    studentId: 'student-1',
    authorId: 'tutor-1',
    text: null,
    tags: [{ id: 'tag-1', name: 'Atraso' }],
    ...overrides,
  });

  it('registers an observation made only of tags', () => {
    const observation = Observation.register(props());

    expect(observation.text).toBeNull();
    expect(observation.tags).toEqual([{ id: 'tag-1', name: 'Atraso' }]);
  });

  it('registers an observation made only of text, trimmed', () => {
    const observation = Observation.register(props({ text: '  Chegou atrasado  ', tags: [] }));

    expect(observation.text).toBe('Chegou atrasado');
  });

  it('treats blank text as no text', () => {
    expect(Observation.register(props({ text: '   ' })).text).toBeNull();
  });

  it('rejects an observation without text and without tags', () => {
    expect(() => Observation.register(props({ text: '  ', tags: [] }))).toThrow(
      InvalidObservationError,
    );
  });

  it('complements the observation with trimmed text', () => {
    const observation = Observation.register(props());

    observation.complement('  Usou o celular duas vezes ');

    expect(observation.text).toBe('Usou o celular duas vezes');
  });

  it('rejects complementing with blank text', () => {
    expect(() => Observation.register(props()).complement('   ')).toThrow(InvalidObservationError);
  });

  it('knows its author', () => {
    const observation = Observation.register(props());

    expect(observation.isAuthoredBy('tutor-1')).toBe(true);
    expect(observation.isAuthoredBy('tutor-2')).toBe(false);
  });
});
