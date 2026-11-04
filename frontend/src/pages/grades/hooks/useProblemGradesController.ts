import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import type { ProblemGradesResponse, StudentGradeRow } from '@/types/grades';
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

function updateStudentGradeOptimistic(
  prev: ProblemGradesResponse | null,
  studentId: string,
  sessionId?: string,
  newGrade?: number | null,
): ProblemGradesResponse | null {
  if (!prev || !sessionId || newGrade === undefined) return prev;
  const updatedAlunos = prev.alunos.map((aluno) => {
    if (aluno.alunoId !== studentId) return aluno;
    const updatedSessoes = aluno.sessoes.map((s) =>
      s.sessaoId === sessionId ? { ...s, nota: newGrade } : s,
    );
    return { ...aluno, sessoes: updatedSessoes };
  });
  return { ...prev, alunos: updatedAlunos };
}

function applyFeedbackSaved(
  data: ReturnType<typeof useProblemGradesData>,
  saved: StudentProblemFeedbackResponse,
  studentName?: string,
  sessionId?: string,
) {
  data.setFeedbacks((prev) => updateStudentFeedbacks(prev, saved, studentName));
  if (sessionId) {
    data.setGrades((prev) =>
      updateStudentGradeOptimistic(prev, saved.destinatarioId, sessionId, saved.nota),
    );
  }
  data.refetch();
}

function resolveSelectedStudent(
  state: StudentGradeRow | null,
  evalCtx: EvaluationContext | null,
  grades: ProblemGradesResponse | null,
): StudentGradeRow | null {
  if (state) return state;
  if (!evalCtx || !grades) return null;
  return grades.alunos.find((a) => a.alunoId === evalCtx.studentId) ?? null;
}

export function useProblemGradesController() {
  const { roomId = '', problemId = '' } = useParams<{ roomId: string; problemId: string }>();
  const { user } = useAuth();
  const data = useProblemGradesData(roomId, problemId, user?.tipo === 'PROFESSOR');
  const [hideNames, setHideNames] = useState(false);
  const [selectedEvaluation, setSelectedEvaluation] = useState<EvaluationContext | null>(null);
  const [selectedStudentState, setSelectedStudentState] = useState<StudentGradeRow | null>(null);
  const [isGeneralModalOpen, setIsGeneralModalOpen] = useState(false);

  const selectedStudent = resolveSelectedStudent(
    selectedStudentState,
    selectedEvaluation,
    data.grades,
  );

  const handleClose = () => {
    setSelectedEvaluation(null);
    setSelectedStudentState(null);
  };

  const handleStudentFeedbackSaved = (saved: StudentProblemFeedbackResponse) => {
    applyFeedbackSaved(data, saved, selectedStudent?.nome, selectedEvaluation?.sessionId);
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
    handleGeneralFeedbackSaved: (saved: GeneralFeedbackResponse) =>
      data.setFeedbacks((prev) => (prev ? { ...prev, geral: saved } : prev)),
  };
}
