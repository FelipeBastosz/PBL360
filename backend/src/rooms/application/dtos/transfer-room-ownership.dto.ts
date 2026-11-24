import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class TransferRoomOwnershipDto {
  @ApiProperty({
    description: 'Identificador do professor que se tornará o novo responsável pela sala.',
    example: '123e4567-e89b-42d3-a456-426614174000',
    format: 'uuid',
  })
  @IsUUID('4', { message: 'O identificador do professor deve ser um UUID válido.' })
  professorId: string;
}

export class TransferRoomOwnershipResponseDto {
  @ApiProperty({ format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Identificador do novo professor responsável pela sala.',
    example: '123e4567-e89b-42d3-a456-426614174000',
  })
  professorResponsavelId: string;
}
