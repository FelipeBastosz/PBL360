import { FormulaScope } from '../../domain/entities/formula.entity';

export class FormulaComponentResponseDto {
  tipo: string;
  referenciaId: string | null;
  nome: string | null;
  peso: number;
}

export class FormulaResponseDto {
  escopo: FormulaScope;
  padrao: boolean;
  versao: number | null;
  componentes: FormulaComponentResponseDto[];
}
