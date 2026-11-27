import { Evaluation } from '../../domain/entities/evaluation.entity';
import { EvaluationStatus } from '../../domain/enums/evaluation-status.enum';
import type { SessionEvaluationConfig } from '../../domain/entities/session-evaluation-config.entity';
import { readSubmittedConfig } from './submitted-student-config.reads';

describe('readSubmittedConfig', () => {
  const config: SessionEvaluationConfig = {
    tableId: 'pt1',
    tableName: 'Barema',
    criteria: [],
    frozen: false,
  };

  it.each([null, Object.assign(new Evaluation(), { status: EvaluationStatus.DRAFT })])(
    'returns the existing config when there is no submitted evaluation',
    async (evaluation) => {
      const query = jest.fn();
      await expect(readSubmittedConfig({ query } as never, 's1', evaluation, config)).resolves.toBe(
        config,
      );
      expect(query).not.toHaveBeenCalled();
    },
  );

  it('reads and normalizes the criterion snapshot for a submitted evaluation', async () => {
    const rows = [{ id: 'c1', name: 'Presença', description: null, orderIndex: 1, weight: '2.5' }];
    const query = jest.fn().mockResolvedValue(rows);
    const evaluation = Object.assign(new Evaluation(), {
      id: 'e1',
      status: EvaluationStatus.SUBMITTED,
    });
    await expect(
      readSubmittedConfig({ query } as never, 's1', evaluation, config),
    ).resolves.toEqual({
      ...config,
      criteria: [{ id: 'c1', name: 'Presença', description: null, orderIndex: 1, weight: 2.5 }],
    });
    expect(query).toHaveBeenCalledWith(expect.stringContaining('evaluation_items'), ['s1', 'e1']);
  });
});
