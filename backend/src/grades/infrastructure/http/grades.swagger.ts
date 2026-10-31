import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiOkResponse, ApiParam } from '@nestjs/swagger';
import { JWT_SECURITY_SCHEME } from '@/config/swagger.config';
import { GradesResponseDto } from '../../application/dtos/grades-response.dto';

export const GetProblemGradesSwaggerDocs = applyDecorators(
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiOperation({
    summary: 'Calcula as notas de um problema',
    description:
      'Por aluno e por sessão, inclui autoavaliacao e pares com { nota, situacao }. Autoavaliação: nota enviada ou ajustada pelo professor (AVALIADA); dentro do prazo sem envio, sem dado (PENDENTE); prazo vencido ou liberação desligada sem envio, conta 0 (NAO_ENVIADA); sessão nunca liberada fica fora (NAO_LIBERADA). Pares: média das notas recebidas após o prazo (AVALIADA); dentro do prazo, sem dado (PENDENTE); sem avaliações recebidas, sem dado (SEM_AVALIACOES). Aluno ausente ou justificado fica fora da sessão (AUSENTE/JUSTIFICADA). A nota final do problema é a média simples ou ponderada das notas das sessões com nota; autoavaliação e pares não entram nesse cálculo.',
  }),
  ApiParam({ name: 'roomId', description: 'Identificador da sala' }),
  ApiParam({ name: 'problemId', description: 'Identificador do problema' }),
  ApiOkResponse({
    description: 'Notas calculadas do problema.',
    type: GradesResponseDto,
    example: {
      sessoes: [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          rotulo: 'S1',
          data: '2026-10-02',
        },
      ],
      alunos: [
        {
          alunoId: '123e4567-e89b-12d3-a456-426614174001',
          nome: 'Ana Souza',
          matricula: '202012345',
          sessoes: [
            {
              sessaoId: '123e4567-e89b-12d3-a456-426614174000',
              nota: 8.5,
              situacao: 'AVALIADA',
              autoavaliacao: { nota: 9, situacao: 'AVALIADA' },
              pares: { nota: 7, situacao: 'AVALIADA' },
            },
          ],
          notaFinal: 8.5,
          autoavaliacao: { nota: 9, situacao: 'AVALIADA' },
          pares: { nota: 7, situacao: 'AVALIADA' },
        },
      ],
      mediaTurma: 8.5,
      versoesFormula: {
        sessao: 1,
        problema: 1,
      },
    },
  }),
);
