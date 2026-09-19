import { ApiProperty } from '@nestjs/swagger';
import { SessionResponseDto } from './session-response.dto';

export class RegisterResponseDto extends SessionResponseDto {
  @ApiProperty({
    example:
      'Cadastro realizado. Enviamos um código de verificação para o seu e-mail institucional.',
  })
  mensagem: string;
}
