import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import type { StudentGradeRow } from '@/types/grades';
import type {
  ProblemFeedbacksResponse,
  StudentProblemFeedbackResponse,
  GeneralFeedbackResponse,
} from '@/types/feedback';
import { useProblemGradesData } from './useProblemGradesData';
import type { EvaluationContext } from '../StudentGradeField';

function updateStudentFeedbacks(
  prev: ProblemFeedbacksResponse | null,
  saved: StudentProblemFeedbackResponse,
  fallbackName = '',
): ProblemFeedbacksResponse | null {
  if (!prev) return prev;
  const updatedAlunos = prev.alunos.map((item) =>
    item.alunoId === saved.destinatarioId ? { ...item, feedback: saved } : item,
  );
  if (!updatedAlunos.some((item) => item.alunoId === saved.destinatarioId)) {
    updatedAlunos.push({ alunoId: saved.destinatarioId, nome: fallbackName, feedback: saved });
  }
  return { ...prev, alunos: updatedAlunos };
}

export function useProblemGradesController() {
  const { roomId = '', problemId = '' } = useParams<{ roomId: string; problemId: string }>();
  const { user } = useAuth();
  const isProfessor = user?.tipo === 'PROFESSOR';

  const data = useProblemGradesData(roomId, problemId, isProfessor);
  const [hideNames, setHideNames] = useState(false);
  const [selectedEvaluation, setSelectedEvaluation] = useState<EvaluationContext | null>(null);
  const [selectedStudentState, setSelectedStudentState] = useState<StudentGradeRow | null>(null);
  const [isGeneralModalOpen, setIsGeneralModalOpen] = useState(false);

  const handleClose = () => {
    setSelectedEvaluation(null);
    setSelectedStudentState(null);
  };

  const selectedStudent =
    selectedStudentState ??
    (selectedEvaluation
      ? (data.grades?.alunos.find((a) => a.alunoId === selectedEvaluation.studentId) ?? null)
      : null);

  const handleStudentFeedbackSaved = (saved: StudentProblemFeedbackResponse) => {
    data.setFeedbacks((prev) => updateStudentFeedbacks(prev, saved, selectedStudent?.nome));
  };

  const handleGeneralFeedbackSaved = (saved: GeneralFeedbackResponse) => {
    data.setFeedbacks((prev) => (prev ? { ...prev, geral: saved } : prev));
  };

  const currentStudentFeedback = selectedStudent
    ? (data.feedbacks?.alunos.find((a) => a.alunoId === selectedStudent.alunoId)?.feedback ?? null)
    : null;

  return {
    roomId,
    problemId,
    ...data,
    hideNames,
    setHideNames,
    selectedEvaluation,
    setSelectedEvaluation,
    selectedStudent,
    setSelectedStudent: setSelectedStudentState,
    handleClose,
    isGeneralModalOpen,
    setIsGeneralModalOpen,
    currentStudentFeedback,
    handleStudentFeedbackSaved,
    handleGeneralFeedbackSaved,
  };
}
