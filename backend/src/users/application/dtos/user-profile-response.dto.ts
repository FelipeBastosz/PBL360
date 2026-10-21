import { ApiProperty } from '@nestjs/swagger';
import { UserTypePayload } from '@/auth/application/dtos/user-type-payload.enum';

export class UserProfileResponseDto {
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

  @ApiProperty({
    description: 'Indica se há foto cadastrada, disponível em GET /usuarios/{id}/foto.',
    example: true,
  })
  possuiFoto: boolean;
}
