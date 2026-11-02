import type {
  FinalGradeFormulaResponse,
  Formula,
  FormulaComponent,
  FormulaScope,
} from '@/types/formula';
import { api } from './api';

const formulasOf = (roomId: string, problemId: string) =>
  `/salas/${roomId}/problemas/${problemId}/formulas`;

const finalGradeOf = (roomId: string, problemId: string) =>
  `/salas/${roomId}/problemas/${problemId}/formula-final`;

const toPayload = ({ tipo, referenciaId, peso }: FormulaComponent) => ({
  tipo,
  referenciaId,
  peso,
});

export const formulaService = {
  get: (roomId: string, problemId: string, escopo: FormulaScope) =>
    api.get<Formula>(formulasOf(roomId, problemId), { params: { escopo } }).then((r) => r.data),

  save: (
    roomId: string,
    problemId: string,
    escopo: FormulaScope,
    componentes: FormulaComponent[],
  ) =>
    api
      .put<Formula>(formulasOf(roomId, problemId), {
        escopo,
        componentes: componentes.map(toPayload),
      })
      .then((r) => r.data),

  restoreDefault: (roomId: string, problemId: string, escopo: FormulaScope) =>
    api
      .post<Formula>(`${formulasOf(roomId, problemId)}/restaurar-padrao`, { escopo })
      .then((r) => r.data),

  getFinalGrade: (roomId: string, problemId: string) =>
    api.get<FinalGradeFormulaResponse>(finalGradeOf(roomId, problemId)).then((r) => r.data),

  saveFinalGrade: (
    roomId: string,
    problemId: string,
    sessoes: Array<{ sessaoId: string; peso: number }>,
  ) =>
    api
      .put<FinalGradeFormulaResponse>(finalGradeOf(roomId, problemId), { sessoes })
      .then((r) => r.data),

  restoreDefaultFinalGrade: (roomId: string, problemId: string) =>
    api
      .post<FinalGradeFormulaResponse>(`${finalGradeOf(roomId, problemId)}/restaurar-padrao`)
      .then((r) => r.data),
};
