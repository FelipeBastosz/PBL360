import { ApiProperty } from '@nestjs/swagger';
import { AttachmentCategoryPayload, AttachmentUploaderDto } from './session-attachment.dto';

export class ProblemTableReportSessionDto {
  @ApiProperty({ format: 'uuid', description: 'Identificador UUID da sessão.' })
  id: string;

  @ApiProperty({ example: 'Abertura do problema', description: 'Título da sessão.' })
  titulo: string;

  @ApiProperty({
    example: '15-10-2026',
    pattern: '^\\d{2}-\\d{2}-\\d{4}$',
    description: 'Data da sessão no formato DD-MM-AAAA.',
  })
  data: string;

  @ApiProperty({ example: 1, description: 'Ordem sequencial da sessão no problema.' })
  ordem: number;
}

export class ProblemTableReportResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Relatorio_Mesa_Sessao1.pdf' })
  nomeArquivo: string;

  @ApiProperty({ example: 'application/pdf' })
  tipo: string;

  @ApiProperty({ description: 'Tamanho em bytes.', example: 245_812 })
  tamanho: number;

  @ApiProperty({
    description: 'Categoria do anexo.',
    enum: AttachmentCategoryPayload,
    example: AttachmentCategoryPayload.RELATORIO_MESA,
  })
  categoria: AttachmentCategoryPayload;

  @ApiProperty({ type: AttachmentUploaderDto })
  enviadoPor: AttachmentUploaderDto;

  @ApiProperty({ format: 'date-time' })
  enviadoEm: Date;

  @ApiProperty({ format: 'uuid', description: 'Identificador UUID da sessão de origem.' })
  sessaoId: string;

  @ApiProperty({
    type: ProblemTableReportSessionDto,
    description: 'Contexto da sessão à qual o relatório de mesa pertence.',
  })
  sessao: ProblemTableReportSessionDto;

  @ApiProperty({
    example:
      '/sessoes/123e4567-e89b-12d3-a456-426614174000/anexos/123e4567-e89b-12d3-a456-426614174001',
    description: 'Rota relativa da API para download autenticado do relatório de mesa.',
  })
  urlDownload: string;
}
