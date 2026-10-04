export type AttendanceStatus = 'PRESENTE' | 'ATRASADO' | 'JUSTIFICADO' | 'AUSENTE';

export type RollCallOrigin = 'REGISTRADA' | 'SESSAO_ANTERIOR' | 'VAZIA';

export type RollCallStudent = {
  alunoId: string;
  nome: string;
  iniciais: string;
  lugar: number | null;
  status: AttendanceStatus | null;
  justificativa: string | null;
};

export type RollCallTotals = {
  presentes: number;
  atrasados: number;
  justificados: number;
  ausentes: number;
  semRegistro: number;
};

export type RollCall = {
  sessaoId: string;
  origem: RollCallOrigin;
  sessaoReferencia: { id: string; data: string } | null;
  registradaEm: string | null;
  lugares: number;
  alunos: RollCallStudent[];
  totais: RollCallTotals;
};

export type AttendanceRecordPayload = {
  alunoId: string;
  status: AttendanceStatus;
  lugar: number | null;
  justificativa: string | null;
};

export type SessionRole = 'COORDENADOR' | 'SECRETARIO_QUADRO' | 'SECRETARIO_MESA';

export type SessionRoleAssignment = {
  alunoId: string;
  nome: string;
  papel: SessionRole;
  notaAdicional: number | null;
};

export type AssignSessionRolePayload = {
  papel: SessionRole | null;
  notaAdicional: number | null;
  transferir: boolean;
};

export type AssignedSessionRole = {
  alunoId: string;
  papel: SessionRole | null;
  notaAdicional: number | null;
};

export type RoleConflictResponse = {
  ocupadoPor?: { studentId: string; name: string };
};
