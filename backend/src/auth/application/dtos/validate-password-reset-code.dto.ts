import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Matches } from 'class-validator';

export class ValidatePasswordResetCodeDto {
  @ApiProperty({
    format: 'email',
    example: 'ana@discente.uefs.br',
    description: 'E-mail que recebeu o código de recuperação.',
  })
  @IsEmail({}, { message: 'Informe um e-mail válido.' })
  @IsNotEmpty({ message: 'O e-mail é obrigatório.' })
  email: string;

  @ApiProperty({ example: '123456', description: 'Código de 6 dígitos recebido por e-mail.' })
  @IsString({ message: 'O código deve ser um texto.' })
  @Matches(/^\d{6}$/, { message: 'O código deve conter exatamente 6 dígitos.' })
  codigo: string;
}
