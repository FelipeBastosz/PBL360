import { ApiProperty } from '@nestjs/swagger';

export const PENDING_VERIFICATION_REASON = 'CONTA_NAO_VERIFICADA';

export const PENDING_VERIFICATION_MESSAGE =
  'Confirme o código enviado para o seu e-mail institucional para ativar a conta.';

export class PendingVerificationResponseDto {
  @ApiProperty({ example: 403 })
  statusCode: number;

  @ApiProperty({ example: 'Forbidden' })
  error: string;

  @ApiProperty({ example: PENDING_VERIFICATION_MESSAGE })
  message: string;

  @ApiProperty({
    example: PENDING_VERIFICATION_REASON,
    description: 'Discriminador estável para o cliente desviar à tela de verificação.',
  })
  motivo: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Envie em /autenticacao/verificar-codigo.',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  usuarioId: string;

  @ApiProperty({ format: 'email', example: 'ana@discente.uefs.br' })
  email: string;
}
