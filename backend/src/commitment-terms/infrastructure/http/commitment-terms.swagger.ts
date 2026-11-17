import { applyDecorators } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { ErrorResponseDto } from '@/shared/dtos/error-response.dto';
import { CommitmentTermResponseDto } from '../../application/dtos/commitment-term-response.dto';

export const GetCurrentCommitmentTermSwaggerDocs = applyDecorators(
  ApiOperation({
    summary: 'Consulta pública do termo de compromisso vigente',
    description:
      'Retorna o título, a versão e o texto integral do termo de compromisso vigente no sistema. ' +
      'Não exige autenticação e não registra aceite.',
  }),
  ApiOkResponse({
    description: 'Termo de compromisso vigente retornado com sucesso.',
    type: CommitmentTermResponseDto,
  }),
  ApiNotFoundResponse({
    description: 'Nenhum termo de compromisso vigente foi encontrado.',
    type: ErrorResponseDto,
  }),
);
