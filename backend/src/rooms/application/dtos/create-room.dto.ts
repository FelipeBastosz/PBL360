import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateRoomDto {
  @IsUUID('4', {
    message: 'O identificador do professor deve ser um UUID válido.',
  })
  tutorId: string;

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
