import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JWT_SECURITY_SCHEME } from '@/config/swagger.config';
import { StudentPerformanceResponseDto } from '../../application/dtos/student-performance-response.dto';

export const GetStudentPerformanceSwaggerDocs = applyDecorators(
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiOperation({
    summary: 'Consulta o desempenho individual nas sessões da sala',
    description:
      'Retorna as notas calculadas pelas regras vigentes, a situação, modalidade, presença e contagens de marcações por sessão. O filtro problemaId limita a consulta a um problema da sala. Sessões sem nota permanecem com nota nula; marcações não alteram a nota.',
  }),
  ApiParam({
    name: 'salaId',
    description: 'Identificador UUID da sala.',
    format: 'uuid',
  }),
  ApiParam({
    name: 'alunoId',
    description: 'Identificador UUID do aluno vinculado à sala.',
    format: 'uuid',
  }),
  ApiQuery({
    name: 'problemaId',
    required: false,
    description: 'Filtra por um problema pertencente à sala.',
    format: 'uuid',
  }),
  ApiOkResponse({
    type: StudentPerformanceResponseDto,
    description: 'Desempenho do aluno, ordenado por data e ordem de problema e sessão.',
    example: {
      sala: { id: '123e4567-e89b-42d3-a456-426614174000', nome: 'Turma 2026.2' },
      aluno: { id: '123e4567-e89b-42d3-a456-426614174001', nome: 'Ana Souza' },
      sessoes: [
        {
          sessaoId: '123e4567-e89b-42d3-a456-426614174002',
          problemaId: '123e4567-e89b-42d3-a456-426614174003',
          problemaTitulo: 'Problema 1',
          rotulo: 'Sessão 1',
          data: '02-10-2026',
          nota: 0,
          situacao: 'AVALIADA',
          modalidade: 'TUTOR',
          presenca: 'PRESENTE',
          marcacoes: [
            {
              id: '123e4567-e89b-42d3-a456-426614174004',
              nome: 'Colaboração',
              quantidade: 2,
            },
          ],
        },
      ],
    },
  }),
  ApiBadRequestResponse({ description: 'Identificador ou filtro inválido.' }),
  ApiUnauthorizedResponse({ description: 'Autenticação obrigatória.' }),
  ApiForbiddenResponse({
    description: 'Apenas o professor responsável ou co-tutor da sala pode consultar.',
  }),
  ApiNotFoundResponse({
    description: 'Sala, aluno vinculado ou problema no contexto da sala não encontrado.',
  }),
);
