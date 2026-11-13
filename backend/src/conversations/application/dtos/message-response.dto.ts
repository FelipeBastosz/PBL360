import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RemetenteResponseDto {
  @ApiProperty({ format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'Carlos Mendes' })
  nome: string;
}

export class MessageResponseDto {
  @ApiProperty({ format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440001' })
  id: string;

  @ApiProperty({ type: () => RemetenteResponseDto })
  remetente: RemetenteResponseDto;

  @ApiProperty({ example: 'Olá, podemos revisar na sessão de amanhã.' })
  texto: string;

  @ApiProperty({ format: 'date-time' })
  enviadaEm: Date;
}

export class MessagesListResponseDto {
  @ApiProperty({ type: () => [MessageResponseDto] })
  itens: MessageResponseDto[];

  @ApiPropertyOptional({
    nullable: true,
    description:
      'ID da próxima mensagem para buscar histórico mais antigo, ou null se chegou ao início.',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  proximoCursor: string | null;
}
