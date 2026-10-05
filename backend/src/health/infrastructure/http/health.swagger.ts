import { applyDecorators } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiServiceUnavailableResponse } from '@nestjs/swagger';
import { HealthCheckResponseDto } from '../../application/dtos/health-response.dto';

export const HealthSwaggerDocs = applyDecorators(
  ApiOperation({
    summary: 'Verifica o status da API e do banco de dados',
    description: 'Informa se a API e o banco estão no ar. Sem autenticação.',
  }),
  ApiOkResponse({
    description: 'API e banco de dados operando normalmente.',
    type: HealthCheckResponseDto,
  }),
  ApiServiceUnavailableResponse({
    description: 'Banco de dados inacessível ou com falha.',
    type: HealthCheckResponseDto,
  }),
);
