import type {
  ProblemDeliveriesListResponseDto,
  ProblemDeliveryResponseDto,
} from '../../application/dtos/problem-delivery-response.dto';
import type { ListProblemDeliveriesOutput } from '../../application/use-cases/list-problem-deliveries.use-case';
import type { ProblemDeliverySummary } from '../../domain/repositories/problem-delivery.repository';

export const toProblemDeliveryResponse = (
  delivery: ProblemDeliverySummary,
): ProblemDeliveryResponseDto => ({
  id: delivery.id,
  url: delivery.url,
  enviadoPor: {
    id: delivery.submittedBy.id,
    nome: delivery.submittedBy.name,
  },
  enviadoEm: delivery.submittedAt,
});

export const toProblemDeliveriesListResponse = (
  output: ListProblemDeliveriesOutput,
): ProblemDeliveriesListResponseDto => ({
  minhaEntregaId: output.myDeliveryId,
  entregas: output.deliveries.map(toProblemDeliveryResponse),
});
