import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class CreateConversationDto {
  @ApiProperty({
    format: 'uuid',
    description: 'ID do aluno ou professor destinatário.',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID('4', { message: 'destinatarioId deve ser um UUID válido.' })
  @IsNotEmpty({ message: 'destinatarioId é obrigatório.' })
  destinatarioId: string;
}
