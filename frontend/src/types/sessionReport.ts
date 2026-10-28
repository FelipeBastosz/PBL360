export type SessionReportStudent = {
  id: string;
  nome: string;
  matricula: string;
  notaFinal: number | null;
};

export const DEFAULT_SESSION_REPORT_STUDENTS: SessionReportStudent[] = [
  { id: '1', nome: 'Ana Souza', matricula: '20240001', notaFinal: 5.3 },
  { id: '2', nome: 'João Silva', matricula: '20240002', notaFinal: 7.5 },
];
