export type FormulaScope = 'SESSAO' | 'PROBLEMA';

export type FormulaComponentType = 'CRITERIO' | 'MEDIA_SESSOES';

// Mirrors GET /salas/:roomId/problemas/:problemId/formulas. Weights are percentages.
export type FormulaComponent = {
  tipo: FormulaComponentType;
  referenciaId: string | null;
  nome: string | null;
  peso: number;
};

export type Formula = {
  escopo: FormulaScope;
  padrao: boolean;
  versao: number | null;
  componentes: FormulaComponent[];
};
