import { FeedbackTemplate } from '../../domain/entities/feedback-template.entity';
import { PgFeedbackTemplateRepository } from './pg-feedback-template.repository';

describe('PgFeedbackTemplateRepository', () => {
  it('lists templates in repository order and maps each row to an entity', async () => {
    const rows = [
      { id: 'f1', title: 'Modelo', text: 'Texto', createdAt: new Date(), updatedAt: new Date() },
    ];
    const query = jest.fn().mockResolvedValue(rows);
    const repository = new PgFeedbackTemplateRepository({ query } as never);

    const result = await repository.findAll();
    expect(result).toHaveLength(1);
    expect(result[0]).toBeInstanceOf(FeedbackTemplate);
    expect(result[0]).toMatchObject(rows[0]);
    expect(query).toHaveBeenCalledWith(expect.stringContaining('ORDER BY id ASC;'));
  });
});
