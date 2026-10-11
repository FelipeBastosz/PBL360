import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiOkResponse, ApiParam } from '@nestjs/swagger';
import { JWT_SECURITY_SCHEME } from '@/config/swagger.config';
import { GradesResponseDto } from '../../application/dtos/grades-response.dto';

export const GetProblemGradesSwaggerDocs = applyDecorators(
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiOperation({ summary: 'Calcula as notas de um problema' }),
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
            },
          ],
          notaFinal: 8.5,
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
