import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { JWT_SECURITY_SCHEME } from '@/config/swagger.config';
import { ErrorResponseDto } from '@/shared/dtos/error-response.dto';
import { RecordRollCallDto, RollCallResponseDto } from '../../application/dtos/roll-call.dto';

const COMMON = [
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiUnauthorizedResponse({
    description: 'JWT não informado, inválido ou expirado.',
    type: ErrorResponseDto,
  }),
  ApiForbiddenResponse({
    description: 'O professor não está vinculado à sala da sessão.',
    type: ErrorResponseDto,
  }),
  ApiNotFoundResponse({ description: 'Sessão não encontrada.', type: ErrorResponseDto }),
];

export const GetRollCallSwaggerDocs = applyDecorators(
  ApiOperation({
    summary: 'Consulta a chamada da sessão',
    description:
      'Devolve a chamada salva (origem REGISTRADA). Se ainda não houver, devolve como sugestão ' +
      'a mesa da sessão mais recente da mesma sala com chamada salva, mesmo de outro problema ' +
      '(origem SESSAO_ANTERIOR): quem estava sentado volta ao mesmo lugar como PRESENTE e os ' +
      'demais ficam fora da mesa, sem status. Na primeira sessão da sala a origem é VAZIA. ' +
      'A sugestão não é gravada até o professor salvar.',
  }),
  ApiOkResponse({ type: RollCallResponseDto }),
  ApiBadRequestResponse({
    description: 'Identificador que não é um UUID.',
    type: ErrorResponseDto,
  }),
  ...COMMON,
);

export const RecordRollCallSwaggerDocs = applyDecorators(
  ApiOperation({
    summary: 'Grava a chamada da sessão em lote',
    description:
      'Grava presença e lugares numa única transação. Alunos fora da lista mantêm o registro ' +
      'atual. O horário e o autor são definidos pelo servidor. Só PRESENTE e ATRASADO podem ' +
      'ter lugar, e a justificativa só é aceita com JUSTIFICADO.',
  }),
  ApiBody({ type: RecordRollCallDto }),
  ApiOkResponse({ type: RollCallResponseDto }),
  ApiBadRequestResponse({
    description:
      'Justificativa com outro status, lugar com JUSTIFICADO ou AUSENTE, ou payload inválido.',
    type: ErrorResponseDto,
  }),
  ApiConflictResponse({
    description: 'Dois alunos no mesmo lugar da mesa.',
    type: ErrorResponseDto,
  }),
  ApiUnprocessableEntityResponse({
    description: 'Aluno não matriculado na sala ou lugar fora da mesa.',
    type: ErrorResponseDto,
  }),
  ...COMMON,
);
