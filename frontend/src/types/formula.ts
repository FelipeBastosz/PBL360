export type FormulaScope = 'SESSAO' | 'PROBLEMA';

export type FormulaComponentType = 'CRITERIO' | 'MEDIA_SESSOES';

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

export type FinalGradeSessionWeight = {
  sessaoId: string;
  rotulo: string;
  peso: number;
};

export type FinalGradeFormulaResponse = {
  padrao: boolean;
  versao: number | null;
  sessoes: FinalGradeSessionWeight[];
};
