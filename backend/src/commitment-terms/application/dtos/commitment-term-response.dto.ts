import { ApiProperty } from '@nestjs/swagger';

export class CommitmentTermResponseDto {
  @ApiProperty({ example: '1.1', description: 'Versão do termo de compromisso.' })
  versao: string;

  @ApiProperty({
    example: 'Termo de Compromisso e Uso do Sistema PBL360',
    description: 'Título do termo de compromisso.',
  })
  titulo: string;

  @ApiProperty({
    example: 'Texto completo do termo de compromisso...',
    description: 'Conteúdo integral do termo de compromisso.',
  })
  texto: string;
}
