import { ApiProperty } from '@nestjs/swagger';

export class PasswordResetTokenResponseDto {
  @ApiProperty({
    description: 'Token de curta duração, usado apenas em /autenticacao/redefinir-senha.',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  token: string;

  @ApiProperty({ format: 'date-time', example: '2026-09-22T10:15:00.000Z' })
  expiraEm: Date;
}
