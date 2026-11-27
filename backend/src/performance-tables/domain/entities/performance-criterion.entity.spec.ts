import { InvalidPerformanceTableError } from '../errors/invalid-performance-table.error';
import { PerformanceCriterion } from './performance-criterion.entity';

describe('PerformanceCriterion', () => {
  it('creates a criterion with defaults and trims optional text', () => {
    const criterion = PerformanceCriterion.create({ name: '  Participação  ' });

    expect(criterion.name).toBe('Participação');
    expect(criterion.description).toBeNull();
    expect(criterion.orderIndex).toBe(1);
    expect(criterion.weight).toBe(1);
  });

  it('preserves a trimmed description and valid boundary values', () => {
    const criterion = PerformanceCriterion.create({
      name: 'Critério',
      description: '  Descrição  ',
      orderIndex: 2,
      weight: 10,
    });

    expect(criterion.description).toBe('Descrição');
    expect(criterion.orderIndex).toBe(2);
    expect(criterion.weight).toBe(10);
  });

  it.each(['', '   '])('rejects an empty name (%j)', (name) => {
    expect(() => PerformanceCriterion.create({ name })).toThrow(InvalidPerformanceTableError);
  });

  it('rejects a name longer than 120 characters', () => {
    expect(() => PerformanceCriterion.create({ name: 'a'.repeat(121) })).toThrow(
      InvalidPerformanceTableError,
    );
  });

  it.each([0, -1, 1.5, Number.NaN])('rejects invalid order index %s', (orderIndex) => {
    expect(() => PerformanceCriterion.create({ name: 'Critério', orderIndex })).toThrow(
      InvalidPerformanceTableError,
    );
  });

  it.each([-0.01, 10.01, Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects invalid weight %s',
    (weight) => {
      expect(() => PerformanceCriterion.create({ name: 'Critério', weight })).toThrow(
        InvalidPerformanceTableError,
      );
    },
  );
});
