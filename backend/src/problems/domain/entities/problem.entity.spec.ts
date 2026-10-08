import { Problem } from './problem.entity';
import { InvalidProblemError } from '../errors/invalid-problem.error';

describe('Problem Entity', () => {
  const validProblemProps = () => ({
    roomId: 'room-uuid-1',
    title: 'Problema 1 - Diagnóstico Clínico',
    description: 'Caso clínico detalhado para tutorial.',
    orderIndex: 1,
    createdBy: 'tutor-uuid-1',
  });

  it('creates a valid problem instance successfully', () => {
    const problem = Problem.create(validProblemProps());

    expect(problem.roomId).toBe('room-uuid-1');
    expect(problem.title).toBe('Problema 1 - Diagnóstico Clínico');
    expect(problem.description).toBe('Caso clínico detalhado para tutorial.');
    expect(problem.orderIndex).toBe(1);
    expect(problem.createdBy).toBe('tutor-uuid-1');
    expect(problem.selfEvalReleased).toBe(false);
    expect(problem.peerEvalReleased).toBe(false);
    expect(problem.startDate).toBeNull();
    expect(problem.endDate).toBeNull();
  });

  it('creates a problem with optional evaluation and date properties', () => {
    const startDate = '2026-03-01';
    const endDate = '2026-03-15';

    const problem = Problem.create({
      ...validProblemProps(),
      startDate,
      endDate,
      selfEvalReleased: true,
      peerEvalReleased: true,
    });

    expect(problem.startDate).toBe(startDate);
    expect(problem.endDate).toBe(endDate);
    expect(problem.selfEvalReleased).toBe(true);
    expect(problem.peerEvalReleased).toBe(true);
  });

  it('creates a problem without description (nullable)', () => {
    const problem = Problem.create({
      ...validProblemProps(),
      description: undefined,
    });

    expect(problem.description).toBeNull();
  });

  it('creates a problem without orderIndex (pending automatic assignment)', () => {
    const problem = Problem.create({
      ...validProblemProps(),
      orderIndex: undefined,
    });

    expect(problem.orderIndex).toBeUndefined();
  });

  it('trims string properties upon creation', () => {
    const problem = Problem.create({
      roomId: '  room-uuid-1  ',
      title: '  Problema com espaços  ',
      description: '  Descrição com espaços  ',
      orderIndex: 2,
      createdBy: '  tutor-uuid-1  ',
    });

    expect(problem.roomId).toBe('room-uuid-1');
    expect(problem.title).toBe('Problema com espaços');
    expect(problem.description).toBe('Descrição com espaços');
    expect(problem.createdBy).toBe('tutor-uuid-1');
  });

  it('throws InvalidProblemError when roomId is empty', () => {
    expect(() =>
      Problem.create({
        ...validProblemProps(),
        roomId: '',
      }),
    ).toThrow(new InvalidProblemError('A sala do problema é obrigatória.'));
  });

  it('throws InvalidProblemError when createdBy is empty', () => {
    expect(() =>
      Problem.create({
        ...validProblemProps(),
        createdBy: '   ',
      }),
    ).toThrow(new InvalidProblemError('O autor do problema é obrigatório.'));
  });

  it('throws InvalidProblemError when title is empty', () => {
    expect(() =>
      Problem.create({
        ...validProblemProps(),
        title: '',
      }),
    ).toThrow(new InvalidProblemError('O título do problema é obrigatório.'));
  });

  it('throws InvalidProblemError when title exceeds 120 characters', () => {
    expect(() =>
      Problem.create({
        ...validProblemProps(),
        title: 'a'.repeat(121),
      }),
    ).toThrow(new InvalidProblemError('O título do problema deve ter no máximo 120 caracteres.'));
  });

  it('throws InvalidProblemError when orderIndex is less than 1', () => {
    expect(() =>
      Problem.create({
        ...validProblemProps(),
        orderIndex: 0,
      }),
    ).toThrow(new InvalidProblemError('A ordem do problema deve ser um número inteiro positivo.'));
  });

  it('throws InvalidProblemError when orderIndex is not an integer', () => {
    expect(() =>
      Problem.create({
        ...validProblemProps(),
        orderIndex: 1.5,
      }),
    ).toThrow(new InvalidProblemError('A ordem do problema deve ser um número inteiro positivo.'));
  });

  it('rejects an end date before the start date', () => {
    expect(() =>
      Problem.create({
        roomId: 'room-1',
        title: 'Problema',
        createdBy: 'tutor-1',
        startDate: '2026-03-15',
        endDate: '2026-03-01',
      }),
    ).toThrow(new InvalidProblemError('A data de término não pode ser anterior à data de início.'));
  });

  it('accepts a problem that starts and ends on the same day', () => {
    const problem = Problem.create({
      roomId: 'room-1',
      title: 'Problema',
      createdBy: 'tutor-1',
      startDate: '2026-03-01',
      endDate: '2026-03-01',
    });

    expect(problem.endDate).toBe('2026-03-01');
  });

  describe('evaluation releases', () => {
    const now = new Date('2026-10-07T12:00:00Z');
    const tomorrow = new Date('2026-10-08T12:00:00Z');
    const yesterday = new Date('2026-10-06T12:00:00Z');

    it('releases self evaluation with a deadline and records author and time', () => {
      const problem = Problem.create(validProblemProps());

      problem.changeRelease('self', { released: true, deadline: tomorrow }, 'tutor-uuid-2', now);

      expect(problem.selfEvalReleased).toBe(true);
      expect(problem.selfEvalDeadline).toBe(tomorrow);
      expect(problem.peerEvalReleased).toBe(false);
      expect(problem.releasedAt).toBe(now);
      expect(problem.releasedBy).toBe('tutor-uuid-2');
    });

    it('releases peer evaluation without a deadline', () => {
      const problem = Problem.create(validProblemProps());

      problem.changeRelease('peer', { released: true, deadline: null }, 'tutor-uuid-1', now);

      expect(problem.peerEvalReleased).toBe(true);
      expect(problem.peerEvalDeadline).toBeNull();
      expect(problem.selfEvalReleased).toBe(false);
    });

    it('rejects a deadline in the past', () => {
      const problem = Problem.create(validProblemProps());

      expect(() =>
        problem.changeRelease('peer', { released: true, deadline: yesterday }, 'tutor-uuid-1', now),
      ).toThrow(InvalidProblemError);
      expect(problem.peerEvalReleased).toBe(false);
    });

    it('is open only while released and before the deadline', () => {
      const problem = Problem.create(validProblemProps());
      problem.changeRelease('self', { released: true, deadline: tomorrow }, 'tutor-uuid-1', now);

      expect(problem.isReleaseOpen('self', now)).toBe(true);
      expect(problem.isReleaseOpen('self', tomorrow)).toBe(false);
      expect(problem.isReleaseOpen('peer', now)).toBe(false);
    });

    it('closes submissions when released is turned off', () => {
      const problem = Problem.create(validProblemProps());
      problem.changeRelease('self', { released: true, deadline: null }, 'tutor-uuid-1', now);

      problem.changeRelease('self', { released: false, deadline: null }, 'tutor-uuid-1', now);

      expect(problem.isReleaseOpen('self', now)).toBe(false);
    });
  });
});
