import { SessionGeneralEvaluation } from '../../domain/entities/session-general-evaluation.entity';
import { PgSessionGeneralEvaluationRepository } from './pg-session-general-evaluation.repository';

describe('PgSessionGeneralEvaluationRepository', () => {
  const row = {
    id: 'e1',
    sessionId: 'sess1',
    text: 'Avaliação geral',
    createdBy: 't1',
    updatedBy: 't1',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-02T00:00:00Z'),
    authorId: 't1',
    authorName: 'Tutor',
  };

  it('lists evaluations by creation order and maps author data', async () => {
    const query = jest.fn().mockResolvedValue([row]);
    const repository = new PgSessionGeneralEvaluationRepository({ query } as never);

    const result = await repository.findBySessionId('sess1');
    expect(result).toHaveLength(1);
    expect(result[0]).toBeInstanceOf(SessionGeneralEvaluation);
    expect(result[0]).toMatchObject({
      id: 'e1',
      text: 'Avaliação geral',
      author: { id: 't1', name: 'Tutor' },
    });
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('ORDER BY evaluation.created_at, evaluation.id'),
      ['sess1'],
    );
  });

  it('upserts the tutor evaluation and requires the returned row', async () => {
    const query = jest.fn().mockResolvedValueOnce([row]).mockResolvedValueOnce([]);
    const repository = new PgSessionGeneralEvaluationRepository({ query } as never);

    await expect(repository.save('sess1', 'Avaliação geral', 't1')).resolves.toMatchObject({
      id: 'e1',
      author: { id: 't1', name: 'Tutor' },
    });
    expect(query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('ON CONFLICT (session_id, created_by)'),
      ['sess1', 'Avaliação geral', 't1'],
    );
    await expect(repository.save('sess1', 'Sem retorno', 't1')).rejects.toThrow(
      'Failed to save session general evaluation.',
    );
  });
});
