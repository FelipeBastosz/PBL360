import type { SavePeerEvaluationDto } from '../../application/dtos/save-peer-evaluation.dto';
import type { SessionPeersResponseDto } from '../../application/dtos/session-peers-response.dto';
import type { PeerEvaluationResponseDto } from '../../application/dtos/peer-evaluation-response.dto';
import type { ListSessionPeersOutput } from '../../application/use-cases/list-session-peers.use-case';
import type { GetPeerEvaluationOutput } from '../../application/use-cases/get-peer-evaluation.use-case';
import type { SavePeerEvaluationInput } from '../../application/use-cases/save-peer-evaluation.use-case';

export function toSavePeerEvaluationInput(
  dto: SavePeerEvaluationDto,
  sessionId: string,
  peerId: string,
  studentId: string,
): SavePeerEvaluationInput {
  return {
    sessionId,
    peerId,
    studentId,
    itens: dto.itens.map((item) => ({
      criterionId: item.criterioId,
      score: item.nota,
    })),
    enviar: dto.enviar,
  };
}

export function toSessionPeersResponse(output: ListSessionPeersOutput): SessionPeersResponseDto {
  return {
    liberada: output.liberada,
    prazo: output.prazo,
    colegas: output.colegas.map((c) => ({
      alunoId: c.alunoId,
      nome: c.nome,
      iniciais: c.iniciais,
      status: c.status,
    })),
  };
}

const mapCriterion = (crit: GetPeerEvaluationOutput['criterios'][number]) => ({
  id: crit.id,
  nome: crit.nome,
  peso: crit.peso,
  notaMaxima: crit.notaMaxima,
});

const mapItem = (item: GetPeerEvaluationOutput['itens'][number]) => ({
  criterioId: item.criterioId,
  nota: item.nota,
});

export function toPeerEvaluationResponse(
  output: GetPeerEvaluationOutput,
): PeerEvaluationResponseDto {
  return {
    colega: { alunoId: output.colega.alunoId, nome: output.colega.nome },
    status: output.status,
    enviadaEm: output.enviadaEm,
    criterios: output.criterios.map(mapCriterion),
    itens: output.itens.map(mapItem),
  };
}
