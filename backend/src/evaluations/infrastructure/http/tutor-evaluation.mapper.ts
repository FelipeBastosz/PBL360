import type { SaveTutorEvaluationDto } from '../../application/dtos/save-tutor-evaluation.dto';
import type { SaveTutorEvaluationInput } from '../../application/inputs/save-tutor-evaluation.input';

export const toSaveTutorEvaluationInput = (
  dto: SaveTutorEvaluationDto,
  sessionId: string,
  studentId: string,
  authorId: string,
): SaveTutorEvaluationInput => ({
  sessionId,
  studentId,
  authorId,
  items: dto.itens.map((item) => ({
    criterionId: item.criterioId,
    score: item.nota,
  })),
  submit: dto.enviar,
  justification: dto.justificativa,
});
