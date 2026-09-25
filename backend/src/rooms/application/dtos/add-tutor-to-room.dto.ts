import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AddTutorToRoomDto {
  @ApiProperty({
    description: 'Identificador do professor que será associado à sala.',
    example: '123e4567-e89b-42d3-a456-426614174000',
    format: 'uuid',
  })
  @IsUUID('4', { message: 'O identificador do professor deve ser um UUID válido.' })
  professorId: string;
}
