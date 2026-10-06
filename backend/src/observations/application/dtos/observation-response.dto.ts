import { ApiProperty } from '@nestjs/swagger';

export class ObservationTagResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Atraso' })
  nome: string;
}

export class ObservationResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ type: ObservationTagResponseDto, isArray: true })
  marcacoes: ObservationTagResponseDto[];

  @ApiProperty({ example: 'Chegou 15 minutos atrasado.', nullable: true })
  texto: string | null;

  @ApiProperty({ format: 'date-time' })
  criadaEm: Date;
}

export class StudentObservationsResponseDto {
  @ApiProperty({ type: ObservationResponseDto, isArray: true })
  observacoes: ObservationResponseDto[];

  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'number' },
    description: 'Quantas vezes cada marcação (pelo id) aparece nas observações.',
    example: { '8f2c6f18-4b34-4226-9d6f-1a2b3c4d5e6f': 2 },
  })
  contagem: Record<string, number>;
}
