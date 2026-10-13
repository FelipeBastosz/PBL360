export interface EvaluationComponentResponse {
  nota: number | null;
  situacao: string;
}

export class GradesResponseDto {
  sessoes!: Array<{
    id: string;
    rotulo: string;
    nome?: string;
    title?: string;
    data: string;
  }>;
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
