import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ format: 'email', example: 'ana@discente.uefs.br' })
  @IsEmail({}, { message: 'Informe um e-mail válido.' })
  email!: string;

  @ApiProperty({ format: 'password', example: 'senha-secreta' })
  @IsString({ message: 'A senha é obrigatória.' })
  @IsNotEmpty({ message: 'A senha é obrigatória.' })
  senha!: string;
}
