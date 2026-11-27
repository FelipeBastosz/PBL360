import type { EntityManager } from 'typeorm';
import { readFormulaComponents, readProblemGradeData } from './problem-grade-data.reads';

describe('problem grade reads', () => {
  it('reads all problem grade datasets in query order', async () => {
    const query = jest
      .fn<(...args: unknown[]) => Promise<unknown[]>>()
      .mockImplementation((_sql, params) => Promise.resolve([params]));
    const result = await readProblemGradeData(
      { query } as unknown as EntityManager,
      'room-1',
      'problem-1',
    );
    expect(query).toHaveBeenCalledTimes(13);
    expect(result).toMatchObject({
      sessions: [['problem-1']],
      students: [['room-1']],
      formulas: [['problem-1']],
      scores: [['problem-1']],
      feedbacks: [['problem-1']],
    });
  });

  it('returns no formula components without querying for an empty id list', async () => {
    const query = jest.fn();
    await expect(readFormulaComponents({ query } as never, [])).resolves.toEqual([]);
    expect(query).not.toHaveBeenCalled();
  });

  it('defaults missing query result rows to empty lists', async () => {
    const query = jest
      .fn<(...args: unknown[]) => Promise<unknown[]>>()
      .mockResolvedValue(undefined);
    const result = await readProblemGradeData(
      { query } as unknown as EntityManager,
      'room-1',
      'problem-1',
    );
    expect(result).toEqual({
      sessions: [],
      students: [],
      formulas: [],
      scores: [],
      attendances: [],
      roles: [],
      criteria: [],
      selfScores: [],
      peerScores: [],
      pokerScores: [],
      peerAdjustments: [],
      tutorAdjustments: [],
      feedbacks: [],
    });
  });

  it('queries formula components for provided ids', async () => {
    const rows = [{ formula_id: 'f1' }];
    const query = jest.fn().mockResolvedValue(rows);
    await expect(readFormulaComponents({ query } as never, ['f1'])).resolves.toBe(rows);
    expect(query).toHaveBeenCalledWith(expect.stringContaining('formula_components'), [['f1']]);
  });
});
