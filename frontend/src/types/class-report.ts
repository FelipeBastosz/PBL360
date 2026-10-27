export interface ClassReportRoom {
  id: string;
  nome: string;
  codigoDisciplina: string;
  semestre: string;
}

export interface ClassReportProblem {
  id: string;
  titulo: string;
  ordem: number;
}

export interface ClassReportStudentProblemGrade {
  problemaId: string;
  notaFinal: number | null;
}

export interface ClassReportStudent {
  id: string;
  nome: string;
  matricula: string | null;
  mediaGeral: number | null;
  isParcial: boolean;
  notasProblemas: ClassReportStudentProblemGrade[];
}

export interface ClassFinalReportResponse {
  sala: ClassReportRoom;
  problemas: ClassReportProblem[];
  alunos: ClassReportStudent[];
}
