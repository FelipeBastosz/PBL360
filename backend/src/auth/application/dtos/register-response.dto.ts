import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from './user-response.dto';

export class RegisterResponseDto {
  @ApiProperty({
    example:
      'Cadastro realizado. Enviamos um código de verificação para o seu e-mail institucional.',
  })
  mensagem: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Envie este identificador em /autenticacao/verificar-codigo.',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  usuarioId: string;

  @ApiProperty({ type: UserResponseDto })
  usuario: UserResponseDto;
}
