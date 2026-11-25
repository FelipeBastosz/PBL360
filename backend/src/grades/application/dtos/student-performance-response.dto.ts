import { ApiProperty } from '@nestjs/swagger';
import type { AttendanceStatusPayload } from '@/sessions/application/dtos/roll-call.dto';
import type { EvaluationModality } from '../../domain/entities/grade-calculator';

export class StudentPerformanceMarkDto {
  @ApiProperty({ format: 'uuid', description: 'Identificador da marcação.' })
  id!: string;

  @ApiProperty({ description: 'Nome da marcação.' })
  nome!: string;

  @ApiProperty({ description: 'Quantidade de registros desta marcação na sessão.' })
  quantidade!: number;
}

export class StudentPerformanceSessionDto {
  @ApiProperty({ format: 'uuid' })
  sessaoId!: string;

  @ApiProperty({ format: 'uuid' })
  problemaId!: string;

  @ApiProperty()
  problemaTitulo!: string;

  @ApiProperty({ description: 'Rótulo apresentado para a sessão.' })
  rotulo!: string;

  @ApiProperty({ description: 'Data no formato utilizado pelos demais endpoints.' })
  data!: string;

  @ApiProperty({ nullable: true, description: 'Nota calculada; zero é um resultado válido.' })
  nota!: number | null;

  @ApiProperty({ description: 'Situação calculada da nota.' })
  situacao!: string;

  @ApiProperty({
    enum: ['TUTOR', 'AUTOAVALIACAO', 'PARES'],
    description: 'Modalidade de avaliação aplicada à sessão.',
  })
  modalidade!: EvaluationModality;

  @ApiProperty({
    enum: ['PRESENTE', 'ATRASADO', 'JUSTIFICADO', 'AUSENTE'],
    nullable: true,
    description: 'Status da chamada, ou null quando não registrado.',
  })
  presenca!: AttendanceStatusPayload | null;

  @ApiProperty({ type: [StudentPerformanceMarkDto] })
  marcacoes!: StudentPerformanceMarkDto[];
}

export class StudentPerformanceResponseDto {
  @ApiProperty({ type: 'object', properties: { id: { type: 'string' }, nome: { type: 'string' } } })
  sala!: { id: string; nome: string };

  @ApiProperty({ type: 'object', properties: { id: { type: 'string' }, nome: { type: 'string' } } })
  aluno!: { id: string; nome: string };

  @ApiProperty({ type: [StudentPerformanceSessionDto] })
  sessoes!: StudentPerformanceSessionDto[];
}
