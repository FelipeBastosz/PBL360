import { IsNotEmpty, IsString, IsUUID, MaxLength, Matches } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export class CreateRoomDto {
  @ApiProperty({
    description:
      'Identificador UUID do professor responsável pela sala. ' +
      'Deve corresponder ao professor autenticado.',
    example: '123e4567-e89b-42d3-a456-426614174000',
    format: 'uuid',
  })
  @IsUUID('4', {
    message: 'O identificador do professor deve ser um UUID válido.',
  })
  tutorId: string;

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
      'Código acadêmico da turma informado pelo professor. ' +
      'Não é utilizado para ingressar na sala. ' +
      'O ingresso dos alunos é realizado por meio ' +
      'do token gerado automaticamente pelo sistema.',
    example: 'EXA123',
    pattern: '^[A-Za-z]{3}[0-9]{3}$',
  })
  @IsString({
    message: 'O código da turma deve ser um texto.',
  })
  @IsNotEmpty({
    message: 'O código da turma é obrigatório.',
  })
  @Matches(/^[A-Za-z]{3}[0-9]{3}$/, {
    message: 'O código da turma deve seguir o formato EXA123.',
  })
  codigo: string;

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
