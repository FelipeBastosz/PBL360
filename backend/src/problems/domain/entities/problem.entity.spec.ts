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
    const startDate = new Date('2026-03-01');
    const endDate = new Date('2026-03-15');

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
});
