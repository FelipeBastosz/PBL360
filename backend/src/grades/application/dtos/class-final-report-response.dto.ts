import { ApiProperty } from '@nestjs/swagger';

export class ClassReportRoomDto {
  @ApiProperty({ format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })
  id!: string;

  @ApiProperty({ example: 'Turma A' })
  nome!: string;

  @ApiProperty({ example: 'EXA123' })
  codigoDisciplina!: string;

  @ApiProperty({ example: '2026.2' })
  semestre!: string;
}

export class ClassReportProblemDto {
  @ApiProperty({ format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440001' })
  id!: string;

  @ApiProperty({ example: 'Problema 1 - Dor torácica' })
  titulo!: string;

  @ApiProperty({ example: 1 })
  ordem!: number;
}

export class ClassReportStudentProblemGradeDto {
  @ApiProperty({ format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440001' })
  problemaId!: string;

  @ApiProperty({ nullable: true, type: Number, example: 8.5 })
  notaFinal!: number | null;
}

export class ClassReportStudentDto {
  @ApiProperty({ format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440002' })
  id!: string;

  @ApiProperty({ example: 'Ana Souza' })
  nome!: string;

  @ApiProperty({ nullable: true, type: String, example: '20260001' })
  matricula!: string | null;

  @ApiProperty({ type: [ClassReportStudentProblemGradeDto] })
  notasProblemas!: ClassReportStudentProblemGradeDto[];

  @ApiProperty({ nullable: true, type: Number, example: 7.0 })
  mediaGeral!: number | null;

  @ApiProperty({ example: false })
  isParcial!: boolean;
}

export class ClassFinalReportResponseDto {
  @ApiProperty({ type: ClassReportRoomDto })
  sala!: ClassReportRoomDto;

  @ApiProperty({ type: [ClassReportProblemDto] })
  problemas!: ClassReportProblemDto[];

  @ApiProperty({ type: [ClassReportStudentDto] })
  alunos!: ClassReportStudentDto[];
}
