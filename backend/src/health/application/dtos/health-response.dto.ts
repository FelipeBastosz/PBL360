import { ApiProperty } from '@nestjs/swagger';

export class HealthCheckResponseDto {
  @ApiProperty({ example: 'ok', description: 'Status geral da API' })
  status: string;

  @ApiProperty({ example: 'ok', description: 'Status da conexão com o banco de dados' })
  banco: string;

  @ApiProperty({ example: '0.1.0', description: 'Versão atual da API' })
  versao: string;
}
