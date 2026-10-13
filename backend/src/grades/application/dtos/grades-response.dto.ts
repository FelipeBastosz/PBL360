export interface EvaluationComponentResponse {
  nota: number | null;
  situacao: string;
  origem?: 'FORMULARIO' | 'PLANNING_POKER';
}

export class GradesResponseDto {
  sessoes!: Array<{ id: string; rotulo: string; data: string }>;
  alunos!: Array<{
    alunoId: string;
    nome: string;
    matricula: string | null;
    sessoes: Array<{
      sessaoId: string;
      nota: number | null;
      situacao: string;
      autoavaliacao: EvaluationComponentResponse;
      pares: EvaluationComponentResponse;
    }>;
    notaFinal: number | null;
    autoavaliacao: EvaluationComponentResponse;
    pares: EvaluationComponentResponse;
  }>;
  mediaTurma!: number | null;
  versoesFormula!: { sessao: number | null; problema: number | null };
}
