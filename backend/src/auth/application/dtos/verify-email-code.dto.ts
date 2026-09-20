import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class VerifyEmailCodeDto {
  @ApiProperty({ example: 'aluno@uefs.br', description: 'E-mail cadastrado' })
  @IsEmail({}, { message: 'Informe um e-mail válido.' })
  @IsNotEmpty({ message: 'O e-mail é obrigatório.' })
  email: string;

  @ApiProperty({ example: '123456', description: 'Código de 6 dígitos recebido' })
  @IsString()
  @Length(6, 6, { message: 'O código deve conter exatamente 6 dígitos.' })
  codigo: string;
}
