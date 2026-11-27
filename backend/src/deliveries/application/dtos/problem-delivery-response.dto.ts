import { ApiProperty } from '@nestjs/swagger';

export class DeliveryAuthorResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Ana Souza' })
  nome!: string;
}

export class ProblemDeliveryResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'https://drive.google.com/drive/folders/1AbCdEfGhIjKlMnOp' })
  url!: string;

  @ApiProperty({ type: DeliveryAuthorResponseDto })
  enviadoPor!: DeliveryAuthorResponseDto;

  @ApiProperty({ type: String, format: 'date-time' })
  enviadoEm!: Date;
}

export class ProblemDeliveriesListResponseDto {
  @ApiProperty({ format: 'uuid', nullable: true })
  minhaEntregaId!: string | null;

  @ApiProperty({ type: [ProblemDeliveryResponseDto] })
  entregas!: ProblemDeliveryResponseDto[];
}
