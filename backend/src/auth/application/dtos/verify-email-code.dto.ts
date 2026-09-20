import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, IsUUID, Matches } from 'class-validator';

export class VerifyEmailCodeDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Identificador devolvido pelo cadastro.',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @IsUUID('4', { message: 'Informe um identificador de usuário válido.' })
  usuarioId: string;

  @ApiProperty({
    format: 'email',
    example: 'ana@discente.uefs.br',
    description: 'E-mail cadastrado',
  })
  @IsEmail({}, { message: 'Informe um e-mail válido.' })
  @IsNotEmpty({ message: 'O e-mail é obrigatório.' })
  email: string;

  @ApiProperty({ example: '123456', description: 'Código de 6 dígitos recebido' })
  @IsString()
  @Matches(/^\d{6}$/, { message: 'O código deve conter exatamente 6 dígitos.' })
  codigo: string;
}
