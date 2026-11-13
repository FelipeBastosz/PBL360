import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class ListMessagesQueryDto {
  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'ID da mensagem anterior para buscar o histórico mais antigo (scroll para cima). Deixe vazio para carregar as mensagens mais recentes.',
  })
  @IsOptional()
  @IsUUID('4', { message: 'cursor deve ser um UUID válido.' })
  cursor?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'ID da última mensagem recebida para buscar apenas mensagens mais novas (polling). Deixe vazio para carregar o histórico normal.',
  })
  @IsOptional()
  @IsUUID('4', { message: 'apos deve ser um UUID válido.' })
  apos?: string;

  @ApiPropertyOptional({
    minimum: 1,
    maximum: 50,
    default: 30,
    description: 'Quantidade máxima de mensagens a retornar.',
    example: 30,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limite deve ser um número inteiro.' })
  @Min(1, { message: 'limite mínimo é 1.' })
  @Max(50, { message: 'limite máximo é 50.' })
  limite?: number = 30;
}
