import type { GetSelfAssessmentOutput } from '../../application/use-cases/get-self-assessment.use-case';
import type { SaveSelfAssessmentDto } from '../../application/dtos/save-self-assessment.dto';
import type {
  StudentEvaluationSummaryResponseDto,
  SelfAssessmentResponseDto,
} from '../../application/dtos/student-evaluations-response.dto';
import type { SaveSelfAssessmentInput } from '../../application/use-cases/save-self-assessment.use-case';

export function toSaveSelfAssessmentInput(
  dto: SaveSelfAssessmentDto,
  sessionId: string,
  studentId: string,
): SaveSelfAssessmentInput {
  return {
    sessionId,
    studentId,
    items: dto.itens.map((item) => ({ criterionId: item.criterioId, score: item.nota })),
    submit: dto.enviar,
    notaCargo: dto.notaCargo,
  };
}

export function toStudentEvaluationSummaryResponse(output: {
  self: { released: boolean; deadline: Date | null; status: string };
  peers: { released: boolean; deadline: Date | null; submitted: number; total: number };
  feedback: { available: boolean; new: boolean };
}): StudentEvaluationSummaryResponseDto {
  return {
    autoavaliacao: {
      liberada: output.self.released,
      prazo: output.self.deadline,
      status: output.self.status,
    },
    pares: {
      liberada: output.peers.released,
      prazo: output.peers.deadline,
      avaliados: output.peers.submitted,
      total: output.peers.total,
    },
    feedback: { disponivel: output.feedback.available, novo: output.feedback.new },
  };
}

export function toSelfAssessmentResponse(
  output: GetSelfAssessmentOutput,
): SelfAssessmentResponseDto {
  return {
    status: output.status,
    prazo: output.deadline,
    enviadaEm: output.submittedAt,
    criterios: toCriteriaDto(output.criteria),
    itens: toItemsDto(output.items),
    papel: output.papel ?? null,
    notaCargo: output.notaCargo ?? null,
    formula: output.formula ?? { criteriaWeight: 70, roleWeight: 30 },
    ...(output.consolidatedScore === undefined
      ? {}
      : { notaConsolidada: output.consolidatedScore }),
  };
}

const toCriteriaDto = (criteria: GetSelfAssessmentOutput['criteria']) =>
  criteria.map((item) => ({
    id: item.id,
    nome: item.name,
    peso: item.weight,
    notaMaxima: item.maxScore,
  }));

const toItemsDto = (items: GetSelfAssessmentOutput['items']) =>
  items.map((item) => ({ criterioId: item.criterionId, nota: item.score }));
