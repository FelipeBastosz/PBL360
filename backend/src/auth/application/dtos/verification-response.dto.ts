import { ApiProperty } from '@nestjs/swagger';
import { SessionResponseDto } from './session-response.dto';

export class VerificationResponseDto extends SessionResponseDto {
  @ApiProperty({ example: 'Conta ativada com sucesso.' })
  mensagem: string;
}
