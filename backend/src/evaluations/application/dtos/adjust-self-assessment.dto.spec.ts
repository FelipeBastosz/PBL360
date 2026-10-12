import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { AdjustSelfAssessmentDto } from './adjust-self-assessment.dto';

const justificativa = 'Revisão após conversa com o aluno.';
const validatePayload = (payload: Record<string, unknown>) =>
  validate(plainToInstance(AdjustSelfAssessmentDto, payload), {
    whitelist: true,
    forbidNonWhitelisted: true,
  });

describe('AdjustSelfAssessmentDto', () => {
  it.each([0, 10, 8.75])('accepts the score %s', async (novaNota) => {
    expect(await validatePayload({ novaNota, justificativa })).toEqual([]);
  });

  it.each([undefined, null, '8.5', 8.756, -0.01, 10.01, NaN, Infinity])(
    'rejects an invalid score: %s',
    async (novaNota) => {
      const errors = await validatePayload({ novaNota, justificativa });
      expect(errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ property: 'novaNota' })]),
      );
    },
  );

  it.each([undefined, null, 123])('rejects a non-text justification: %s', async (value) => {
    const errors = await validatePayload({ novaNota: 8, justificativa: value });
    expect(errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ property: 'justificativa' })]),
    );
  });

  it('trims the justification', () => {
    const dto = plainToInstance(AdjustSelfAssessmentDto, {
      novaNota: 8,
      justificativa: `  ${justificativa}  `,
    });
    expect(dto.justificativa).toBe(justificativa);
  });

  it('rejects an author supplied in the request body', async () => {
    const errors = await validatePayload({ novaNota: 8, justificativa, autorId: 'tutor' });
    expect(errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ property: 'autorId' })]),
    );
  });
});
