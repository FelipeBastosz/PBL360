import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProfessorResponsavelDto {
  @ApiProperty({ format: 'uuid', example: '123e4567-e89b-42d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'Carlos Mendes' })
  nome: string;

  @ApiProperty({ example: 'carlos.tutor@uefs.br' })
  email: string;
}

export class RoomResponseDto {
  @ApiProperty({ format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Professor responsável pela sala.',
    example: '123e4567-e89b-42d3-a456-426614174000',
  })
  professorResponsavelId: string;

  @ApiPropertyOptional({
    description: 'Dados públicos do professor responsável pela sala.',
    type: () => ProfessorResponsavelDto,
  })
  professorResponsavel?: ProfessorResponsavelDto;

  @ApiProperty({ example: 'Engenharia de Software' })
  nome: string;

  @ApiProperty({ example: 'EXA123' })
  codigoDisciplina: string;

  @ApiProperty({
    description: 'Código de 8 caracteres gerado pelo sistema para o ingresso na sala.',
    example: 'aB7kP2x9',
  })
  codigoSala: string;

  @ApiProperty({ example: '2026.2' })
  semestre: string;

  @ApiProperty({ example: true })
  ativo: boolean;

  @ApiProperty({ format: 'date-time' })
  criadoEm: Date;
}

export class RoomSummaryResponseDto extends RoomResponseDto {
  @ApiProperty({ example: 24 })
  totalAlunos: number;

  @ApiProperty({ example: 8 })
  totalProblemas: number;
}
