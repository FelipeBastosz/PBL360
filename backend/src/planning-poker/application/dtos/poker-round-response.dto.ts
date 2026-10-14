import { ApiProperty } from '@nestjs/swagger';

export enum PokerRoundStatusPayload {
  VOTANDO = 'VOTANDO',
  REVELADA = 'REVELADA',
  DECIDIDA = 'DECIDIDA',
}

export class PokerStudentResponseDto {
  @ApiProperty({ format: 'uuid' }) alunoId: string;
  @ApiProperty({ example: 'Carla Mendes' }) nome: string;
  @ApiProperty({ example: 'CM' }) iniciais: string;
  @ApiProperty({ type: String, nullable: true }) fotoUrl: string | null;
  @ApiProperty({ type: Number, nullable: true, description: 'Lugar na chamada.' })
  lugar: number | null;
}

export class PokerSeatResponseDto {
  @ApiProperty({ example: 1 }) lugar: number;
  @ApiProperty({ type: String, nullable: true, description: 'Nulo no modo anônimo.' })
  alunoId: string | null;
  @ApiProperty({ type: String, nullable: true }) nome: string | null;
  @ApiProperty({ type: String, nullable: true }) iniciais: string | null;
  @ApiProperty() avaliado: boolean;
  @ApiProperty() votou: boolean;
}

export class PokerRevealedVoteResponseDto {
  @ApiProperty() lugar: number;
  @ApiProperty({ example: 8.5 }) nota: number;
  @ApiProperty({ type: String, nullable: true }) alunoId: string | null;
  @ApiProperty({ type: String, nullable: true }) nome: string | null;
}

export class PokerRevealResponseDto {
  @ApiProperty({ type: PokerRevealedVoteResponseDto, isArray: true })
  votos: PokerRevealedVoteResponseDto[];
  @ApiProperty({ type: Number, nullable: true }) media: number | null;
  @ApiProperty() totalVotos: number;
  @ApiProperty() faltaram: number;
}

export class PokerRoundResponseDto {
  @ApiProperty({ format: 'uuid' }) rodadaId: string;
  @ApiProperty() numero: number;
  @ApiProperty({ enum: PokerRoundStatusPayload }) status: PokerRoundStatusPayload;
  @ApiProperty({ type: PokerStudentResponseDto }) avaliado: PokerStudentResponseDto;
  @ApiProperty({ type: PokerSeatResponseDto, isArray: true }) mesa: PokerSeatResponseDto[];
  @ApiProperty() votantesEsperados: number;
  @ApiProperty() votaram: number;
  @ApiProperty({ type: Number, isArray: true }) lugaresQueVotaram: number[];
  @ApiProperty({ type: PokerRevealResponseDto, nullable: true })
  revelacao: PokerRevealResponseDto | null;
}

export class StudentPokerRoundResponseDto extends PokerRoundResponseDto {
  @ApiProperty() souAvaliado: boolean;
  @ApiProperty({ type: Number, nullable: true }) meuVoto: number | null;
  @ApiProperty({ type: Number, nullable: true }) meuLugar: number | null;
}

export class PokerVoteResponseDto {
  @ApiProperty() votou: boolean;
  @ApiProperty() nota: number;
}

export class PokerDecisionResponseDto {
  @ApiProperty({ format: 'uuid' }) alunoId: string;
  @ApiProperty({ type: Number, nullable: true }) media: number | null;
  @ApiProperty() notaFinal: number;
  @ApiProperty() ajustada: boolean;
  @ApiProperty({ format: 'uuid' }) decididoPor: string;
  @ApiProperty({ type: String, format: 'date-time' }) decididoEm: Date;
}
