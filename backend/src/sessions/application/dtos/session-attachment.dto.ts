import { ApiProperty } from '@nestjs/swagger';

export enum AttachmentCategoryPayload {
  RELATORIO_MESA = 'RELATORIO_MESA',
  ANEXO_SESSAO = 'ANEXO_SESSAO',
}

export class AttachmentUploaderDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ example: 'Ana Souza' }) nome: string;
}

export class SessionAttachmentResponseDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ example: 'Relatório_Parcial_Fase1.pdf' }) nomeArquivo: string;
  @ApiProperty({ example: 'application/pdf' }) tipo: string;
  @ApiProperty({ description: 'Tamanho em bytes.', example: 245_812 }) tamanho: number;
  @ApiProperty({
    description: 'Categoria do anexo.',
    enum: AttachmentCategoryPayload,
    example: AttachmentCategoryPayload.ANEXO_SESSAO,
  })
  categoria: AttachmentCategoryPayload;
  @ApiProperty({ type: AttachmentUploaderDto }) enviadoPor: AttachmentUploaderDto;
  @ApiProperty({ format: 'date-time' }) enviadoEm: Date;
}

export class UploadSessionAttachmentDto {
  @ApiProperty({ type: 'string', format: 'binary', description: 'PDF de até 10 MB.' })
  arquivo: unknown;

  @ApiProperty({
    description: 'Categoria do anexo.',
    enum: AttachmentCategoryPayload,
    example: AttachmentCategoryPayload.ANEXO_SESSAO,
  })
  categoria: AttachmentCategoryPayload;
}
