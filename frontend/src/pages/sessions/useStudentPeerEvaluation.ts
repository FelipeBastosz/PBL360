import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { useToast } from '@/hooks/useToast';
import { evaluationService } from '@/services/evaluation.service';
import { sessionService } from '@/services/session.service';
import type {
  EvaluationCriterion,
  EvaluationFormula,
  SessionPeerStudent,
} from '@/types/evaluation';
import type { MemberSession, SessionRole } from '@/types/session';
import { normalizeSessionRole } from '@/utils/sessionRoles';

export type PeerEvaluationState = {
  peerId: string;
  name: string;
  isSubmitted: boolean;
  criteria: EvaluationCriterion[];
  scores: Record<string, number>;
  papel?: SessionRole | null;
  notaCargo?: number | null;
};

type LoadedPeersResult = {
  peers: PeerEvaluationState[];
  prazo: string | null;
  didNotParticipate: boolean;
  chamadaRealizada: boolean;
  formula?: EvaluationFormula;
};

async function fetchPeerCards(
  sessionId: string,
  colegas: SessionPeerStudent[],
): Promise<PeerEvaluationState[]> {
  return Promise.all(
    colegas.map(async (c) => {
      const evalData = await evaluationService.getPeerEvaluation(sessionId, c.alunoId);
      const scores: Record<string, number> = {};
      evalData.criterios.forEach((crit) => {
        const item = evalData.itens.find((i) => i.criterioId === crit.id);
        scores[crit.id] = item?.nota ?? 0;
      });
      return {
        peerId: c.alunoId,
        name: c.nome,
        isSubmitted: evalData.status === 'ENVIADA',
        criteria: evalData.criterios,
        scores,
        papel: normalizeSessionRole(c.papel),
        notaCargo: evalData.notaCargo ?? (c.papel ? 0 : null),
      };
    }),
  );
}

async function loadPeersData(sessionId: string): Promise<LoadedPeersResult> {
  const [response, summary] = await Promise.all([
    evaluationService.listSessionPeers(sessionId),
    Promise.resolve(evaluationService.getMyEvaluationsSummary(sessionId)).catch(() => null),
  ]);

  const chamadaRealizada = response.chamadaRealizada ?? true;
  const isRollCallDone = Boolean(chamadaRealizada);

  const didNotParticipate =
    isRollCallDone &&
    (response.participou === false ||
      summary?.participou === false ||
      summary?.autoavaliacao.status === 'NAO_PARTICIPOU');

  if (
    !chamadaRealizada ||
    didNotParticipate ||
    !response.liberada ||
    response.colegas.length === 0
  ) {
    return {
      peers: [],
      prazo: response.prazo,
      didNotParticipate,
      chamadaRealizada,
      formula: response.formula,
    };
  }

  const peers = await fetchPeerCards(sessionId, response.colegas);
  return {
    peers,
    prazo: response.prazo,
    didNotParticipate: false,
    chamadaRealizada: true,
    formula: response.formula,
  };
}

const toPeerPayload = (peer: PeerEvaluationState, enviar = true) => ({
  itens: Object.entries(peer.scores).map(([criterioId, nota]) => ({ criterioId, nota })),
  notaCargo: peer.papel ? (peer.notaCargo ?? 0) : null,
  enviar,
});

async function savePendingPeers(sessionId: string, peers: PeerEvaluationState[]) {
  const pendings = peers.filter((p) => !p.isSubmitted);
  await Promise.all(
    pendings.map((p) =>
      evaluationService.savePeerEvaluation(sessionId, p.peerId, toPeerPayload(p, true)),
    ),
  );
}

function schedulePeerDraft(
  timers: Record<string, ReturnType<typeof setTimeout>>,
  sessionId: string,
  targetPeer: PeerEvaluationState,
) {
  const { peerId } = targetPeer;
  if (timers[peerId]) clearTimeout(timers[peerId]);
  timers[peerId] = setTimeout(() => {
    evaluationService
      .savePeerEvaluation(sessionId, peerId, toPeerPayload(targetPeer, false))
      .catch(() => {});
  }, 500);
}

function usePeerEvaluationData(sessionId: string) {
  const [peers, setPeers] = useState<PeerEvaluationState[]>([]);
  const [prazo, setPrazo] = useState<string | null>(null);
  const [didNotParticipate, setDidNotParticipate] = useState(false);
  const [chamadaRealizada, setChamadaRealizada] = useState(true);
  const [formula, setFormula] = useState<EvaluationFormula | undefined>(undefined);
  const [session, setSession] = useState<MemberSession | null>(null);

  const { run: loadSession } = useAsyncAction(
    useCallback(() => sessionService.getForMember(sessionId), [sessionId]),
  );
  const {
    run: loadPeers,
    isLoading,
    error,
  } = useAsyncAction(useCallback(() => loadPeersData(sessionId), [sessionId]));

  useEffect(() => {
    loadSession().then((r) => r.ok && setSession(r.data));
    loadPeers().then((r) => {
      if (r.ok) {
        setPeers(r.data.peers);
        setPrazo(r.data.prazo);
        setDidNotParticipate(r.data.didNotParticipate);
        setChamadaRealizada(r.data.chamadaRealizada);
        setFormula(r.data.formula);
      }
    });
  }, [loadSession, loadPeers]);

  return {
    peers,
    setPeers,
    prazo,
    didNotParticipate,
    chamadaRealizada,
    formula,
    session,
    isLoading,
    error,
  };
}

function usePeerScoreHandlers(
  sessionId: string,
  setPeers: React.Dispatch<React.SetStateAction<PeerEvaluationState[]>>,
) {
  const draftTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    const timers = draftTimersRef.current;
    return () => Object.values(timers).forEach(clearTimeout);
  }, []);

  const setScore = (peerId: string, critId: string, s: number) => {
    setPeers((prev) => {
      const next = prev.map((p) =>
        p.peerId === peerId ? { ...p, scores: { ...p.scores, [critId]: s } } : p,
      );
      const target = next.find((p) => p.peerId === peerId);
      if (target && !target.isSubmitted)
        schedulePeerDraft(draftTimersRef.current, sessionId, target);
      return next;
    });
  };

  const setCargoScore = (peerId: string, s: number) => {
    setPeers((prev) => {
      const next = prev.map((p) => (p.peerId === peerId ? { ...p, notaCargo: s } : p));
      const target = next.find((p) => p.peerId === peerId);
      if (target && !target.isSubmitted)
        schedulePeerDraft(draftTimersRef.current, sessionId, target);
      return next;
    });
  };

  const clearTimers = useCallback(() => {
    Object.values(draftTimersRef.current).forEach(clearTimeout);
  }, []);

  return { setScore, setCargoScore, clearTimers };
}

export function useStudentPeerEvaluation(sessionId: string) {
  const navigate = useNavigate();
  const { notify } = useToast();
  const data = usePeerEvaluationData(sessionId);
  const { setScore, setCargoScore, clearTimers } = usePeerScoreHandlers(sessionId, data.setPeers);

  const {
    run: saveAll,
    isLoading: isSaving,
    error: saveError,
  } = useAsyncAction(
    useCallback(() => savePendingPeers(sessionId, data.peers), [sessionId, data.peers]),
  );

  const handleSave = async () => {
    clearTimers();
    const res = await saveAll();
    if (res.ok) {
      notify({ tone: 'success', message: 'Avaliações de colegas enviadas com sucesso!' });
      navigate(-1);
    }
  };

  const isNonParticipant =
    data.didNotParticipate || Boolean(data.error && /não participou/i.test(data.error.message));

  return {
    peers: data.peers,
    prazo: data.prazo,
    formula: data.formula,
    session: data.session,
    isLoading: data.isLoading,
    isSaving,
    error: data.error,
    saveError,
    didNotParticipate: isNonParticipant,
    chamadaRealizada: data.chamadaRealizada,
    canSave: data.chamadaRealizada && !isNonParticipant && data.peers.some((p) => !p.isSubmitted),
    handleSave,
    setScore,
    setCargoScore,
  };
}
