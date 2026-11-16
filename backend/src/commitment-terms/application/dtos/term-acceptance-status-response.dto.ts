import { ApiProperty } from '@nestjs/swagger';

export class TermAcceptanceStatusResponseDto {
  @ApiProperty({
    example: true,
    description: 'Indica se o usuário já aceitou o termo de compromisso.',
  })
  aceito: boolean;

  @ApiProperty({
    example: '1.0',
    nullable: true,
    description: 'Versão do termo aceita pelo usuário (nulo se ainda não aceitou).',
  })
  versaoAceita: string | null;

  @ApiProperty({
    format: 'date-time',
    nullable: true,
    description:
      'Data e hora em que o aceite foi registrado pelo servidor (nulo se ainda não aceitou).',
  })
  aceitoEm: Date | null;

  @ApiProperty({
    example: '1.0',
    description: 'Versão vigente atual do termo de compromisso.',
  })
  versaoVigente: string;
}
