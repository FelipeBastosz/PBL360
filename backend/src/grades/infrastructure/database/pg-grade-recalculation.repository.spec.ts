import { PgGradeRecalculationRepository } from './pg-grade-recalculation.repository';

describe('PgGradeRecalculationRepository', () => {
  it('lists a student’s recalculation notices in descending order', async () => {
    const notices = [
      {
        id: 'n1',
        sessionId: 'sess1',
        sessionTitle: 'Sessão 1',
        previousScore: 7,
        newScore: 8,
        reasonCode: 'EVALUATION_UPDATED',
        createdAt: new Date(),
      },
    ];
    const query = jest.fn().mockResolvedValue(notices);
    const repository = new PgGradeRecalculationRepository({ query } as never);

    await expect(repository.findNoticesByStudentId('s1')).resolves.toBe(notices);
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('ORDER BY history.created_at DESC'),
      ['s1'],
    );
    expect(query).toHaveBeenCalledWith(expect.stringContaining('LIMIT 100'), ['s1']);
  });
});
