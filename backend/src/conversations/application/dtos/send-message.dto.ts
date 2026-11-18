import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class SendMessageDto {
  @ApiProperty({
    minLength: 1,
    maxLength: 2000,
    description: 'Conteúdo textual da mensagem.',
    example: 'Olá professor, estou com dúvida no problema 1.',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.replace(/[\u200B-\u200D\uFEFF]/g, '').trim() : value,
  )
  @IsString({ message: 'texto deve ser uma string.' })
  @IsNotEmpty({ message: 'A mensagem não pode ser vazia.' })
  @MaxLength(2000, { message: 'A mensagem deve ter no máximo 2000 caracteres.' })
  texto: string;
}
