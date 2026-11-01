export type Session = {
  id: string;
  titulo: string;
  descricao: string | null;
  data: string;
  ordem: number;
  status: string;
};

export type CreateSessionPayload = {
  titulo: string;
  descricao?: string | null;
  data: string;
};

export type UpdateSessionPayload = {
  titulo: string;
  descricao?: string | null;
  data: string;
};

export type SessionDeletionImpact = {
  podeExcluir: boolean;
  chamada: number;
  papeis: number;
  observacoes: number;
  avaliacoes: number;
  feedbacks: number;
};

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

export type SessionAttachment = {
  id: string;
  nomeArquivo: string;
  tipo: string;
  tamanho: number;
  enviadoPor: { id: string; nome: string };
  enviadoEm: string;
};

export type MemberSession = Session & {
  problemaId: string;
  salaId: string;
  problemaTitulo: string;
};

export type RoomSession = {
  id: string;
  titulo: string;
  data: string;
  ordem: number;
  status: string;
  problemaId: string;
  problemaTitulo: string;
};

export type EvaluationReleaseInfo = {
  liberada: boolean;
  prazo: string | null;
  enviadas: number;
  esperadas: number;
};

export type SessionReleasesResponse = {
  autoavaliacao: EvaluationReleaseInfo;
  pares: EvaluationReleaseInfo;
  atualizadoEm: string;
  atualizadoPor: string;
};

export type UpdateReleasesPayload = {
  autoavaliacao?: { liberada: boolean; prazo: string | null };
  pares?: { liberada: boolean; prazo: string | null };
};

export type SessionTableCriterion = {
  id: string;
  nome: string;
  peso: number;
};

export type SessionTableConfig = {
  id: string;
  nome: string;
  padrao: boolean;
  origem?: 'PADRAO' | 'PRIMEIRA_SESSAO' | null;
  criterios: SessionTableCriterion[];
};

export type SessionFormulaComponentType = 'CRITERIOS' | 'PAPEL';

export type SessionFormulaComponent = {
  tipo: SessionFormulaComponentType;
  peso: number;
};

export type SessionFormulaConfig = {
  padrao: boolean;
  versao: number | null;
  componentes: SessionFormulaComponent[];
};

export type SessionEvaluationConfig = {
  tabela: SessionTableConfig;
  formula: SessionFormulaConfig;
  bloqueada: boolean;
};

export type ApplySessionTablePayload = {
  tabelaId: string;
  aplicarNasSeguintes: boolean;
};

export type SessionTableIgnored = {
  sessaoId: string;
  rotulo: string;
  motivo: string;
};

export type SessionTableUpdated = {
  sessaoId: string;
  rotulo: string;
};

export type SessionTableUpdateResult = {
  sessoesAtualizadas: SessionTableUpdated[];
  sessoesIgnoradas: SessionTableIgnored[];
};

export type TableSessionUsage = {
  sessaoId: string;
  rotulo: string;
  jaAconteceu: boolean;
};

export type SessionTableEditPermissions = {
  podeEditarCriterios: boolean;
  motivo: string | null;
  sessoesQueUsam: TableSessionUsage[];
};

export type EditSessionCriterionPayload = {
  id?: string;
  nome?: string;
  peso: number;
};

export type EditSessionTablePayload = {
  escopo: 'SESSAO' | 'TODAS';
  nome?: string;
  criterios: EditSessionCriterionPayload[];
};

export type EditSessionTableResponse = {
  tabela: { id: string; nome: string };
  sessoesAtualizadas: Array<{ sessaoId: string; rotulo: string }>;
};

export type UpdateSessionFormulaPayload = {
  componentes: SessionFormulaComponent[];
  aplicarNasSeguintes?: boolean;
};
