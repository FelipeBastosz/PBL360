import { ApiProperty } from '@nestjs/swagger';

export class FeedbackTemplateResponseDto {
  @ApiProperty({
    description: 'Identificador único do modelo de feedback.',
    format: 'uuid',
    example: '4f700000-0000-4000-8000-000000000001',
  })
  id: string;

  @ApiProperty({
    description: 'Título descritivo do cenário pedagógico do modelo.',
    example: 'Boa participação e engajamento',
    maxLength: 120,
  })
  titulo: string;

  @ApiProperty({
    description: 'Texto sugerido para adaptação no feedback de sessão (até 2000 caracteres).',
    example:
      'Demonstrou participação ativa durante a sessão tutorial, contribuindo com perguntas e reflexões pertinentes para o avanço da discussão do grupo.',
    maxLength: 2000,
  })
  texto: string;
}
