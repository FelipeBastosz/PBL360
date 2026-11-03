import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { SaveStudentProblemFeedbackDto } from './save-student-problem-feedback.dto';

const validateDto = (payload: Record<string, unknown>) =>
  validate(plainToInstance(SaveStudentProblemFeedbackDto, payload));

describe('SaveStudentProblemFeedbackDto', () => {
  it('accepts valid payload without justificativa', async () => {
    const errors = await validateDto({
      nota: 8.5,
      texto: 'Ótimo desempenho durante a sessão.',
    });
    expect(errors).toHaveLength(0);
  });

  it('accepts valid payload with justificativa', async () => {
    const errors = await validateDto({
      nota: 9.0,
      texto: 'Ótimo desempenho durante a sessão.',
      justificativa: 'Nota revisada com base na participação do aluno.',
    });
    expect(errors).toHaveLength(0);
  });

  it('rejects justificativa with fewer than 10 characters', async () => {
    const errors = await validateDto({
      nota: 9.0,
      texto: 'Ótimo desempenho.',
      justificativa: 'Curto',
    });
    expect(errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ property: 'justificativa' })]),
    );
  });

  it('rejects justificativa with more than 500 characters', async () => {
    const errors = await validateDto({
      nota: 9.0,
      texto: 'Ótimo desempenho.',
      justificativa: 'a'.repeat(501),
    });
    expect(errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ property: 'justificativa' })]),
    );
  });

  it('rejects non-string justificativa', async () => {
    const errors = await validateDto({
      nota: 9.0,
      texto: 'Ótimo desempenho.',
      justificativa: 1234567890,
    });
    expect(errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ property: 'justificativa' })]),
    );
  });
});
