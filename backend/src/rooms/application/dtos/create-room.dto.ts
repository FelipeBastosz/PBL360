import { IsNotEmpty, IsString, MaxLength, Matches } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export class CreateRoomDto {
  @ApiProperty({
    description: 'Nome da sala informado pelo professor.',
    example: 'Engenharia de Software',
    maxLength: 120,
  })
  @IsString({
    message: 'O nome da sala deve ser um texto.',
  })
  @IsNotEmpty({
    message: 'O nome da sala é obrigatório.',
  })
  @MaxLength(120, {
    message: 'O nome da sala deve ter no máximo 120 caracteres.',
  })
  nome: string;

  @ApiProperty({
    description:
      'Código acadêmico da disciplina informado pelo professor. ' +
      'Não é utilizado para ingressar na sala. ' +
      'O ingresso dos alunos é realizado por meio ' +
      'do código da sala gerado automaticamente pelo sistema.',
    example: 'EXA123',
    pattern: '^[A-Za-z]{3}[0-9]{3}$',
  })
  @IsString({
    message: 'O código da disciplina deve ser um texto.',
  })
  @IsNotEmpty({
    message: 'O código da disciplina é obrigatório.',
  })
  @Matches(/^[A-Za-z]{3}[0-9]{3}$/, {
    message: 'O código da disciplina deve seguir o formato ABC123.',
  })
  codigoDisciplina: string;

  @ApiProperty({
    description: 'Semestre acadêmico ao qual a turma pertence.',
    example: '2026.2',
    maxLength: 10,
  })
  @IsString({
    message: 'O semestre deve ser um texto.',
  })
  @IsNotEmpty({
    message: 'O semestre é obrigatório.',
  })
  @MaxLength(10, {
    message: 'O semestre deve ter no máximo 10 caracteres.',
  })
  semestre: string;
}
