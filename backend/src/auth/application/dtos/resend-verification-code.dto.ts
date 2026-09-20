import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MaxLength } from 'class-validator';

export class ResendVerificationCodeDto {
  @ApiProperty({
    format: 'email',
    maxLength: 160,
    description: 'E-mail da conta pendente de verificação.',
    example: 'ana@discente.uefs.br',
  })
  @IsEmail({}, { message: 'Informe um e-mail válido.' })
  @IsNotEmpty({ message: 'O e-mail é obrigatório.' })
  @MaxLength(160, { message: 'O e-mail deve ter no máximo 160 caracteres.' })
  email: string;
}
