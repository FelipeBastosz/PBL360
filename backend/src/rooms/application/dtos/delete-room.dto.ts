import { IsUUID } from 'class-validator';

export class DeleteRoomDto {
  @IsUUID('4', { message: 'O campo "tutorId" deve ser um UUID válido.' })
  tutorId: string;
}
