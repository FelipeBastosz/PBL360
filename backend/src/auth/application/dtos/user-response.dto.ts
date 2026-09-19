import { ApiProperty } from '@nestjs/swagger';
import { UserTypePayload } from './user-type-payload.enum';

export class UserResponseDto {
  @ApiProperty({ format: 'uuid', example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  id: string;

  @ApiProperty({ example: 'Ana Souza' })
  nome: string;

  @ApiProperty({ format: 'email', example: 'ana@discente.uefs.br' })
  email: string;

  @ApiProperty({ enum: UserTypePayload, example: UserTypePayload.ALUNO })
  tipo: UserTypePayload;

  @ApiProperty({ nullable: true, example: '20240001' })
  matricula: string | null;

  @ApiProperty({ nullable: true, example: 'https://uefs.br/fotos/ana.png' })
  fotoUrl: string | null;

  @ApiProperty({ example: true })
  ativo: boolean;

  @ApiProperty({ format: 'date-time', example: '2026-09-19T13:45:10.120Z' })
  criadoEm: Date;
}
