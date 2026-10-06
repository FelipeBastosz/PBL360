export class GradesResponseDto {
  sessoes!: Array<{ id: string; rotulo: string; data: string }>;
  alunos!: Array<{
    alunoId: string;
    nome: string;
    matricula: string | null;
    sessoes: Array<{ sessaoId: string; nota: number | null; situacao: string }>;
    notaFinal: number | null;
  }>;
  mediaTurma!: number | null;
  versoesFormula!: { sessao: number | null; problema: number | null };
}
