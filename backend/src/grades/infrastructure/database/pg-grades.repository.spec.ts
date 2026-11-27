import { PgGradesRepository } from './pg-grades.repository';

describe('PgGradesRepository', () => {
  it('looks up problem ownership and returns empty session details without querying', async () => {
    const query = jest.fn().mockResolvedValueOnce([{ id: 'p1' }]);
    const repository = new PgGradesRepository({
      query,
      manager: { query },
      transaction: jest.fn(),
    } as never);

    await expect(repository.findProblem('p1', 'r1')).resolves.toEqual({ id: 'p1' });
    await expect(repository.findStudentSessionDetails('r1', 's1', [])).resolves.toEqual([]);
    expect(query).toHaveBeenCalledTimes(1);
    expect(query).toHaveBeenCalledWith(expect.stringContaining('room_id = $2'), ['p1', 'r1']);
  });

  it('reads formula components and student session details when ids are provided', async () => {
    const managerQuery = jest.fn().mockResolvedValue([{ formula_id: 'f1', type: 'CRITERIO' }]);
    const query = jest.fn().mockResolvedValue([{ sessionId: 'sess1', attendance: 'PRESENT' }]);
    const repository = new PgGradesRepository({ query, manager: { query: managerQuery } } as never);

    await expect(repository.findFormulaComponents(['f1'])).resolves.toEqual([
      { formula_id: 'f1', type: 'CRITERIO' },
    ]);
    expect(managerQuery).toHaveBeenCalledWith(expect.stringContaining('ANY($1::uuid[])'), [['f1']]);
    await expect(repository.findStudentSessionDetails('r1', 's1', ['p1'])).resolves.toEqual([
      { sessionId: 'sess1', attendance: 'PRESENT' },
    ]);
    expect(query).toHaveBeenCalledWith(expect.stringContaining('p.id = ANY($3::uuid[])'), [
      'r1',
      's1',
      ['p1'],
    ]);
  });

  it('parses observation tags from arrays and JSON, ignores invalid JSON and persists rounded grades', async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce([
        {
          studentId: 's1',
          sessionId: 'sess1',
          sessionTitle: 'S1',
          sessionOrderIndex: 1,
          tags: ['A', 2],
        },
        {
          studentId: 's1',
          sessionId: 'sess2',
          sessionTitle: 'S2',
          sessionOrderIndex: 2,
          tags: '["B", 3]',
        },
        {
          studentId: 's1',
          sessionId: 'sess3',
          sessionTitle: 'S3',
          sessionOrderIndex: 3,
          tags: 'invalid',
        },
        { studentId: 's1', sessionId: 'sess4', sessionTitle: 'S4', sessionOrderIndex: 4, tags: 4 },
      ])
      .mockResolvedValue(undefined);
    const managerQuery = jest.fn().mockResolvedValue([]);
    const transaction = jest.fn(async (operation: (manager: never) => Promise<void>) =>
      operation({ query: managerQuery } as never),
    );
    const repository = new PgGradesRepository({
      query,
      manager: { query: managerQuery },
      transaction,
    } as never);

    await expect(repository.findProblemObservationTags('p1')).resolves.toMatchObject([
      { tags: ['A'] },
      { tags: ['B'] },
      { tags: [] },
      { tags: [] },
    ]);
    await repository.saveGrades('p1', {
      sessionRows: [
        {
          session_id: 'sess1',
          student_id: 's1',
          grade: 8.126,
          situation: 'OK',
          formula_version: 1,
        },
      ],
      problemRows: [{ student_id: 's1', grade: 9.995, formula_version: 2 }],
    });
    expect(managerQuery).toHaveBeenCalledTimes(2);
    expect(managerQuery).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('INSERT INTO session_grades'),
      expect.any(Array),
    );
    expect(managerQuery).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('INSERT INTO problem_grades'),
      expect.any(Array),
    );
    expect(transaction).toHaveBeenCalledTimes(1);
  });

  it('returns no formula rows when the id list is empty and builds problem data in a transaction', async () => {
    const managerQuery = jest.fn().mockResolvedValue([]);
    const transaction = jest.fn(
      async (_isolation: string, operation: (manager: never) => Promise<unknown>) =>
        operation({ query: managerQuery } as never),
    );
    const repository = new PgGradesRepository({
      query: jest.fn(),
      manager: { query: managerQuery },
      transaction,
    } as never);

    await expect(repository.findFormulaComponents([])).resolves.toEqual([]);
    const result = await repository.findProblemData('r1', 'p1');
    expect(Object.keys(result)).toEqual([
      'sessions',
      'students',
      'formulas',
      'scores',
      'attendances',
      'roles',
      'criteria',
      'selfScores',
      'peerScores',
      'pokerScores',
      'peerAdjustments',
      'tutorAdjustments',
      'feedbacks',
    ]);
    expect(transaction).toHaveBeenCalledWith('REPEATABLE READ', expect.any(Function));
    expect(managerQuery).toHaveBeenCalledTimes(13);
  });
});
