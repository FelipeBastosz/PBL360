import { ApiProperty } from '@nestjs/swagger';

export class BehaviorTagResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Atraso' })
  nome: string;

  @ApiProperty({
    example: true,
    description: 'Verdadeiro para as marcações do sistema, que nenhum professor pode alterar.',
  })
  predefinida: boolean;

  @ApiProperty({ example: true })
  ativa: boolean;
}
