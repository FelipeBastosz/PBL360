import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProfessorResponsavelDto } from './room-response.dto';

export class StudentRoomResponseDto {
  @ApiProperty({ format: 'uuid' })
  salaId!: string;

  @ApiProperty()
  nome!: string;

  @ApiProperty({ example: '2026.1' })
  semestre!: string;

  @ApiProperty({ example: 24 })
  totalAlunos!: number;

  @ApiProperty({ example: 3 })
  totalProblemas!: number;

  @ApiPropertyOptional({
    description: 'Dados públicos do professor responsável pela sala.',
    type: () => ProfessorResponsavelDto,
  })
  professorResponsavel?: ProfessorResponsavelDto;
}
