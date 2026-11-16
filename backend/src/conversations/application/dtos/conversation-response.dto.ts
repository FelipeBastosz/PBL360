import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserTypePayload } from '@/auth/application/dtos/user-type-payload.enum';

export class InterlocutorResponseDto {
  @ApiProperty({ format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'Ana Souza' })
  nome: string;

  @ApiProperty({ enum: UserTypePayload, example: UserTypePayload.ALUNO })
  tipo: UserTypePayload;

  @ApiProperty({ example: false })
  possuiFoto: boolean;
}

export class UltimaMensagemResponseDto {
  @ApiProperty({ example: 'Tudo bem professor, obrigado!' })
  texto: string;

  @ApiProperty({ format: 'date-time' })
  enviadaEm: Date;
}

export class ConversationResponseDto {
  @ApiProperty({ format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ type: () => InterlocutorResponseDto })
  interlocutor: InterlocutorResponseDto;

  @ApiPropertyOptional({ type: () => UltimaMensagemResponseDto, nullable: true })
  ultimaMensagem?: UltimaMensagemResponseDto | null;
}

export class CreateConversationResponseDto {
  @ApiProperty({ format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ type: () => InterlocutorResponseDto })
  interlocutor: InterlocutorResponseDto;
}
