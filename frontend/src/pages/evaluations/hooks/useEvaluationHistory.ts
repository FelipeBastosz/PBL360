import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useToast } from '@/hooks/useToast';
import { evaluationService } from '@/services/evaluation.service';
import { roomService } from '@/services/room.service';
import type { RoomStudent } from '@/types/room';
import type {
  StudentEvaluationHistoryItem,
  SessionEvaluationSummary,
  SelfAssessmentAdjustmentResponse,
} from '@/types/evaluation';

function toFallbackStudents(
  list: SessionEvaluationSummary[],
  roomStudents: RoomStudent[] = [],
): StudentEvaluationHistoryItem[] {
  return list.map((s, index) => {
    const matched = roomStudents.find((r) => r.id === s.alunoId);
    return {
      alunoId: s.alunoId,
      nome: s.nome,
      matricula: matched?.matricula ?? `2612119${index}`,
      notaAluno: s.notaSessao,
      notaAlunoOriginal: null,
      notaTutor: null,
      notaPares: null,
      avaliacoesPares: 0,
      situacaoAjuste: 'SEM_AJUSTE',
    };
  });
}

function enrichWithRoomStudents(
  items: StudentEvaluationHistoryItem[],
  roomStudents: RoomStudent[],
): StudentEvaluationHistoryItem[] {
  return items.map((item, index) => {
    if (item.matricula) return item;
    const matched = roomStudents.find((r) => r.id === item.alunoId);
    return {
      ...item,
      matricula: matched?.matricula ?? `2612119${index}`,
    };
  });
}

function updateStudentAdjustment(
  list: StudentEvaluationHistoryItem[],
  studentId: string,
  res: SelfAssessmentAdjustmentResponse,
  fallbackScore: number,
): StudentEvaluationHistoryItem[] {
  return list.map((item) => {
    if (item.alunoId !== studentId) return item;
    return {
      ...item,
      situacaoAjuste: 'AJUSTADA',
      notaAlunoOriginal: res.notaOriginal ?? item.notaAlunoOriginal ?? item.notaAluno,
      notaAluno: res.notaVigente ?? fallbackScore,
    };
  });
}

function useHistoryData(sessionId: string, roomId?: string) {
  const [students, setStudents] = useState<StudentEvaluationHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return undefined;
    let active = true;

    const fetchRoomStudents = roomId
      ? roomService.listStudents(roomId).catch(() => [] as RoomStudent[])
      : Promise.resolve([] as RoomStudent[]);

    evaluationService
      .getEvaluationHistory(sessionId)
      .then(async (history) => {
        const roomStudents = await fetchRoomStudents;
        if (active) setStudents(enrichWithRoomStudents(history.alunos, roomStudents));
      })
      .catch(() =>
        Promise.all([evaluationService.listBySession(sessionId), fetchRoomStudents])
          .then(([fallback, roomStudents]) => {
            if (active) setStudents(toFallbackStudents(fallback, roomStudents));
          })
          .catch((err: unknown) => {
            if (active)
              setError(err instanceof Error ? err.message : 'Falha ao carregar histórico');
          }),
      )
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [sessionId, roomId]);

  return { students, setStudents, isLoading, error };
}

function useAdjustmentAction(
  sessionId: string,
  selectedStudent: StudentEvaluationHistoryItem | null,
  setStudents: React.Dispatch<React.SetStateAction<StudentEvaluationHistoryItem[]>>,
  setSelectedStudent: (s: StudentEvaluationHistoryItem | null) => void,
) {
  const { notify } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveAdjustment = async (payload: { novaNota: number; justificativa: string }) => {
    if (!selectedStudent || !sessionId) return;
    setIsSaving(true);

    try {
      const res = await evaluationService.adjustSelfAssessment(
        sessionId,
        selectedStudent.alunoId,
        payload,
      );
      setStudents((prev) =>
        updateStudentAdjustment(prev, selectedStudent.alunoId, res, payload.novaNota),
      );
      notify({ tone: 'success', message: 'Ajuste de nota salvo com sucesso!' });
      setSelectedStudent(null);
    } catch (err: unknown) {
      notify({
        tone: 'error',
        message: err instanceof Error ? err.message : 'Não foi possível salvar o ajuste.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return { isSaving, handleSaveAdjustment };
}

export function useEvaluationHistory() {
  const {
    roomId,
    problemId,
    sessionId = '',
  } = useParams<{
    roomId: string;
    problemId: string;
    sessionId: string;
  }>();

  const { students, setStudents, isLoading, error } = useHistoryData(sessionId, roomId);
  const [hideNames, setHideNames] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentEvaluationHistoryItem | null>(null);
  const { isSaving, handleSaveAdjustment } = useAdjustmentAction(
    sessionId,
    selectedStudent,
    setStudents,
    setSelectedStudent,
  );

  const backUrl =
    roomId && problemId
      ? `/turmas/${roomId}/problemas/${problemId}/sessoes/${sessionId}`
      : `/sessoes/${sessionId}`;

  return {
    students,
    isLoading,
    error,
    hideNames,
    setHideNames,
    selectedStudent,
    setSelectedStudent,
    isSaving,
    handleSaveAdjustment,
    backUrl,
  };
}
