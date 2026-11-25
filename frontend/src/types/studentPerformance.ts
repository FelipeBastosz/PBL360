import type { SessionGradeModality } from '@/types/grades';
import type { AttendanceStatus } from '@/types/session';

export type StudentPerformanceMark = {
  id: string;
  nome: string;
  quantidade: number;
};

export type StudentPerformanceSession = {
  sessaoId: string;
  problemaId: string;
  problemaTitulo: string;
  rotulo: string;
  data: string;
  // Calculated by the API; null means there is no grade yet, while 0 is a real grade.
  nota: number | null;
  situacao: string;
  modalidade: SessionGradeModality;
  presenca: AttendanceStatus | null;
  marcacoes: StudentPerformanceMark[];
};

export type StudentPerformance = {
  sala: { id: string; nome: string };
  aluno: { id: string; nome: string };
  sessoes: StudentPerformanceSession[];
};
