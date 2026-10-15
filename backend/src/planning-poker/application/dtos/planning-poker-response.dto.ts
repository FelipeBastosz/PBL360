import { ApiProperty } from '@nestjs/swagger';
import { PokerOrderPayload } from './planning-poker-request.dto';
import {
  PokerRoundResponseDto,
  PokerStudentResponseDto,
  StudentPokerRoundResponseDto,
} from './poker-round-response.dto';

export class PokerCompletedResponseDto {
  @ApiProperty({ format: 'uuid' }) alunoId: string;
  @ApiProperty() nome: string;
  @ApiProperty() iniciais: string;
  @ApiProperty({ type: Number, nullable: true, required: false }) media?: number | null;
  @ApiProperty({ required: false, description: 'Só para o professor.' }) notaFinal?: number;
  @ApiProperty({ required: false }) ajustada?: boolean;
}

export class PlanningPokerStateResponseDto {
  @ApiProperty({ format: 'uuid' }) pokerId: string;
  @ApiProperty() anonimo: boolean;
  @ApiProperty({ enum: PokerOrderPayload }) ordem: PokerOrderPayload;
  @ApiProperty({ example: 'ABERTO' }) status: string;
  @ApiProperty({ type: PokerStudentResponseDto, isArray: true })
  participantes: PokerStudentResponseDto[];
  @ApiProperty({ type: PokerStudentResponseDto, isArray: true })
  ausentes: PokerStudentResponseDto[];
  @ApiProperty({ type: String, isArray: true, format: 'uuid' }) fila: string[];
  @ApiProperty({ type: PokerCompletedResponseDto, isArray: true })
  concluidas: PokerCompletedResponseDto[];
  @ApiProperty({ type: PokerRoundResponseDto, nullable: true })
  rodadaAtual: PokerRoundResponseDto | StudentPokerRoundResponseDto | null;
  @ApiProperty({ required: false, description: 'Só para o aluno.' }) participante?: boolean;
}

export class PlanningPokerAvailabilityResponseDto {
  @ApiProperty() disponivel: boolean;
  @ApiProperty({ type: String, nullable: true, example: 'Salve a chamada para começar.' })
  motivo: string | null;
  @ApiProperty() presentes: number;
  @ApiProperty({ type: String, nullable: true, format: 'uuid' }) pokerAbertoId: string | null;
}

export class PokerQueueResponseDto {
  @ApiProperty({ type: String, isArray: true, format: 'uuid' }) fila: string[];
}

export class PokerResultResponseDto {
  @ApiProperty({ format: 'uuid' }) alunoId: string;
  @ApiProperty() nome: string;
  @ApiProperty() notaFinal: number;
  @ApiProperty() ajustada: boolean;
}

export class PokerPendingStudentResponseDto {
  @ApiProperty({ format: 'uuid' }) alunoId: string;
  @ApiProperty() nome: string;
}

export class ClosePlanningPokerResponseDto {
  @ApiProperty() avaliados: number;
  @ApiProperty({ type: PokerPendingStudentResponseDto, isArray: true })
  naoAvaliados: PokerPendingStudentResponseDto[];
  @ApiProperty({ type: PokerResultResponseDto, isArray: true })
  resultados: PokerResultResponseDto[];
}
